import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Save push subscription for the logged-in user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Datos de suscripción inválidos" }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
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
