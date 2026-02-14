import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Only BARBER can change roles
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
  })

  if (!currentUser || currentUser.role !== "BARBER") {
    return NextResponse.json({ error: "Solo barberos pueden cambiar roles" }, { status: 403 })
  }

  const { userId, role } = await req.json()

  if (!userId || !role || !["BARBER", "CLIENT"].includes(role)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
  }

  // Prevent removing your own BARBER role
  if (userId === currentUser.id && role === "CLIENT") {
    return NextResponse.json({ error: "No puedes quitarte el rol de barbero a ti mismo" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  return NextResponse.json(updated)
}
