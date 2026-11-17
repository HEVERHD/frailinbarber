import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSeason } from "@/lib/season-shared"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  const { searchParams } = new URL(req.url)
  const barberId = searchParams.get("barberId")

  // Public access: shop name/city as configured on a barber's profile (used by booking +
  // home page) — falls back to the ADMIN's own settings for single-account setups
  if (!session) {
    const settings =
      (await prisma.barberSettings.findFirst({ where: { user: { role: "BARBER" } } })) ??
      (await prisma.barberSettings.findFirst({ where: { user: { role: "ADMIN" } } })) ??
      (await prisma.barberSettings.findFirst())
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

  // Tema forzado: "auto" / null → automático por fecha; si no viene, no se toca
  let seasonOverride: string | null | undefined = undefined
  if ("seasonOverride" in body) {
    const v = body.seasonOverride
    if (v === null || v === "" || v === "auto") seasonOverride = null
    else if (isSeason(v)) seasonOverride = v
    else return NextResponse.json({ error: "Temporada no válida" }, { status: 400 })
  }

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
      city: body.city ?? null,
      phone: body.phone,
      seasonOverride,
    },
    create: {
      shopName: body.shopName,
      openTime: body.openTime,
      closeTime: body.closeTime,
      slotDuration: parseInt(body.slotDuration),
      daysOff: body.daysOff,
      daySchedules: body.daySchedules ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      phone: body.phone,
      seasonOverride: seasonOverride ?? null,
      userId: targetUserId,
    },
  })

  return NextResponse.json(settings)
}
