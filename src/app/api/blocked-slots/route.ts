import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  const where: any = {}
  if (date) {
    where.date = date
  }

  const blockedSlots = await prisma.blockedSlot.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json(blockedSlots)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()

  const blockedSlot = await prisma.blockedSlot.create({
    data: {
      date: body.date,
      startTime: body.allDay ? "00:00" : body.startTime,
      endTime: body.allDay ? "23:59" : body.endTime,
      reason: body.reason || null,
      allDay: body.allDay || false,
    },
  })

  return NextResponse.json(blockedSlot, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })
  }

  await prisma.blockedSlot.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
