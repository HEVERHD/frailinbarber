import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Save push subscription — works for authenticated users AND public booking flow
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id ?? null

  const body = await req.json()

  // Support both formats:
  //   authenticated dashboard:  { endpoint, keys: { p256dh, auth } }
  //   public booking confirm:   { subscription: { endpoint, keys }, appointmentDate, appointmentTime, service, barber }
  const sub = body.subscription ?? body
  const endpoint = sub.endpoint
  const p256dh   = sub.keys?.p256dh
  const auth     = sub.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Datos de suscripción inválidos" }, { status: 400 })
  }

  // Anonymous booking flow: subscription is registered in the browser.
  // TODO: add nullable userId + remindAt to PushSubscription schema, then store here
  // and schedule the push with VAPID keys from env (VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY).
  if (!userId) return NextResponse.json({ ok: true })

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, userId },
    create: { endpoint, p256dh, auth, userId },
  })

  return NextResponse.json({ ok: true })
}

// Remove push subscription (unsubscribe)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 })

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } })

  return NextResponse.json({ ok: true })
}
