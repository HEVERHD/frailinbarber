import { NextRequest, NextResponse } from "next/server"
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

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede cambiar roles" }, { status: 403 })
  }

  const { userId, role } = await req.json()

  if (!userId || !role || !["ADMIN", "BARBER", "CLIENT"].includes(role)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
  }

  // Prevent removing your own ADMIN role
  if (userId === currentUser.id && role !== "ADMIN") {
    return NextResponse.json({ error: "No puedes quitarte el rol de administrador" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  // Auto-create BarberSettings when promoting to BARBER or ADMIN
  if (role === "BARBER" || role === "ADMIN") {
    const existingSettings = await prisma.barberSettings.findUnique({
      where: { userId },
    })
    if (!existingSettings) {
      const adminSettings = await prisma.barberSettings.findUnique({
        where: { userId: currentUser.id },
      })
      await prisma.barberSettings.create({
        data: {
          shopName: adminSettings?.shopName || "Mi Barbería",
          openTime: adminSettings?.openTime || "09:00",
          closeTime: adminSettings?.closeTime || "19:00",
          slotDuration: adminSettings?.slotDuration || 30,
          daysOff: adminSettings?.daysOff || "0",
          userId,
        },
      })
    }
  }

  return NextResponse.json(updated)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
  })
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "BARBER")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { userId, name, phone, email } = await req.json()
  if (!userId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  // BARBER can only edit CLIENT users
  if (currentUser.role === "BARBER" && target.role !== "CLIENT") {
    return NextResponse.json({ error: "Solo puedes editar clientes" }, { status: 403 })
  }

  // Check email uniqueness if changing it
  if (email && email !== target.email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } })
    if (existing) return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 409 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
  })
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "BARBER")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("id")
  if (!userId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  if (userId === currentUser.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  // BARBER can only delete CLIENT users
  if (currentUser.role === "BARBER" && target.role !== "CLIENT") {
    return NextResponse.json({ error: "Solo puedes eliminar clientes" }, { status: 403 })
  }

  // Delete all related data before removing the user
  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({ where: { userId } })
    await tx.appointment.deleteMany({ where: { barberId: userId } })
    await tx.blockedSlot.deleteMany({ where: { barberId: userId } })
    await tx.recurringBlock.deleteMany({ where: { barberId: userId } })
    await tx.barberSettings.deleteMany({ where: { userId } })
    await tx.user.delete({ where: { id: userId } })
  })

  return NextResponse.json({ ok: true })
}
