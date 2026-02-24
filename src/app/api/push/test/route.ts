import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"

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

  // If sendTo param provided, also try sending a test push
  let sendResult: any = null
  if (sendTo) {
    try {
      await sendPushToUser(sendTo, {
        title: "🔔 Prueba de notificación",
        body: "Si ves esto, las notificaciones push funcionan ✅",
        url: "/dashboard",
        tag: "test",
      })
      sendResult = { ok: true, sentTo: sendTo }
    } catch (err: any) {
      sendResult = { ok: false, error: err.message }
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
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 20) + "...",
    sendResult,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  if (role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { targetUserId } = await req.json()

  try {
    await sendPushToUser(targetUserId || userId, {
      title: "🔔 Prueba de notificación",
      body: "Si ves esto, las notificaciones push funcionan correctamente",
      url: "/dashboard",
      tag: "test",
    })
    return NextResponse.json({ ok: true, sentTo: targetUserId || userId })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
