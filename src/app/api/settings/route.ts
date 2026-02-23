import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  const { searchParams } = new URL(req.url)
  const barberId = searchParams.get("barberId")

  // Public access: return first settings for shop name (used by booking page)
  if (!session) {
    const settings = await prisma.barberSettings.findFirst()
    return NextResponse.json(settings)
  }

  // ADMIN can request any barber's settings
  if (role === "ADMIN" && barberId) {
    const settings = await prisma.barberSettings.findUnique({
      where: { userId: barberId },
    })
    return NextResponse.json(settings)
  }

  // BARBER or ADMIN (no barberId param): return own settings
  const settings = await prisma.barberSettings.findUnique({
    where: { userId },
  })
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  if (!session || (role !== "BARBER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()

  // ADMIN can update another barber's settings
  const targetUserId = (role === "ADMIN" && body.barberId) ? body.barberId : userId

  const settings = await prisma.barberSettings.upsert({
    where: { userId: targetUserId },
    update: {
      shopName: body.shopName,
      openTime: body.openTime,
      closeTime: body.closeTime,
      slotDuration: parseInt(body.slotDuration),
      daysOff: body.daysOff,
      daySchedules: body.daySchedules ?? null,
      address: body.address ?? null,
      phone: body.phone,
    },
    create: {
      shopName: body.shopName,
      openTime: body.openTime,
      closeTime: body.closeTime,
      slotDuration: parseInt(body.slotDuration),
      daysOff: body.daysOff,
      daySchedules: body.daySchedules ?? null,
      address: body.address ?? null,
      phone: body.phone,
      userId: targetUserId,
    },
  })

  return NextResponse.json(settings)
}
