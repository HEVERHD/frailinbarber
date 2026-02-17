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
