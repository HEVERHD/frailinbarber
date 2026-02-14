import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const settings = await prisma.barberSettings.findFirst()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "BARBER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const settings = await prisma.barberSettings.upsert({
    where: { id: "default" },
    update: {
      shopName: body.shopName,
      openTime: body.openTime,
      closeTime: body.closeTime,
      slotDuration: parseInt(body.slotDuration),
      daysOff: body.daysOff,
      phone: body.phone,
    },
    create: {
      id: "default",
      shopName: body.shopName,
      openTime: body.openTime,
      closeTime: body.closeTime,
      slotDuration: parseInt(body.slotDuration),
      daysOff: body.daysOff,
      phone: body.phone,
    },
  })

  return NextResponse.json(settings)
}
