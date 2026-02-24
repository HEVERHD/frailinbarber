import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sendTo = searchParams.get("sendTo")

  // List all push subscriptions
  const subs = await prisma.pushSubscription.findMany({
    include: { user: { select: { id: true, name: true, role: true } } },
  })

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY || ""
  const vapidMailto = process.env.VAPID_MAILTO || ""

  // If sendTo param provided, send directly with webpush and capture per-subscription results
  let sendResults: any[] = []
  if (sendTo) {
    const userSubs = subs.filter((s) => s.userId === sendTo)
    webpush.setVapidDetails(vapidMailto, vapidPublic, vapidPrivate)

    for (const sub of userSubs) {
      try {
        const result = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "🔔 Prueba de notificación",
            body: "Si ves esto, las notificaciones push funcionan ✅",
            url: "/dashboard",
            tag: "test",
          })
        )
        sendResults.push({ endpoint: sub.endpoint.slice(0, 50) + "...", statusCode: result.statusCode, ok: true })
      } catch (err: any) {
        sendResults.push({
          endpoint: sub.endpoint.slice(0, 50) + "...",
          ok: false,
          statusCode: err.statusCode,
          error: err.message,
          body: err.body,
        })
      }
    }
  }

  return NextResponse.json({
    total: subs.length,
    subscriptions: subs.map((s) => ({
      userId: s.userId,
      userName: s.user.name,
      userRole: s.user.role,
      endpoint: s.endpoint.slice(0, 60) + "...",
      createdAt: s.createdAt,
    })),
    vapidPublicKey: vapidPublic.slice(0, 20) + "...",
    vapidPrivateKey: vapidPrivate ? vapidPrivate.slice(0, 10) + "..." : "❌ NO CONFIGURADA",
    vapidMailto: vapidMailto || "❌ NO CONFIGURADA",
    sendResults,
  })
}
