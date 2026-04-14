import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const blocks = await prisma.recurringBlock.findMany({
    where: role === "ADMIN" ? {} : { barberId: userId },
    orderBy: { startTime: "asc" },
  })

  return NextResponse.json(blocks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()

  const block = await prisma.recurringBlock.create({
    data: {
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason || null,
      allDay: body.allDay ?? false,
      daysOfWeek: body.daysOfWeek ?? "",
      barberId: userId,
    },
  })

  return NextResponse.json(block)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const block = await prisma.recurringBlock.findUnique({ where: { id } })
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (role !== "ADMIN" && block.barberId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.recurringBlock.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
