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
  const clientId = searchParams.get("id")
  const search = searchParams.get("search")

  // Single client detail with appointment history
  if (clientId) {
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        appointments: {
          include: { service: true },
          orderBy: { date: "desc" },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const completedApts = client.appointments.filter((a) => a.status === "COMPLETED")
    const totalSpent = completedApts.reduce((sum, a) => sum + a.service.price, 0)
    const noShows = client.appointments.filter((a) => a.status === "NO_SHOW").length

    // Find favorite service
    const serviceCounts: Record<string, { name: string; count: number }> = {}
    completedApts.forEach((a) => {
      if (!serviceCounts[a.serviceId]) {
        serviceCounts[a.serviceId] = { name: a.service.name, count: 0 }
      }
      serviceCounts[a.serviceId].count++
    })
    const favoriteService = Object.values(serviceCounts).sort((a, b) => b.count - a.count)[0]

    return NextResponse.json({
      ...client,
      stats: {
        totalVisits: completedApts.length,
        totalSpent,
        noShows,
        favoriteService: favoriteService?.name || "N/A",
        lastVisit: completedApts[0]?.date || null,
      },
    })
  }

  // Quick search for autocomplete
  if (search) {
    const results = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true },
      take: 5,
    })
    return NextResponse.json(results)
  }

  // List all clients with summary stats
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      appointments: {
        include: { service: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const clientsWithStats = clients.map((client) => {
    const completed = client.appointments.filter((a) => a.status === "COMPLETED")
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      totalVisits: completed.length,
      totalSpent: completed.reduce((sum, a) => sum + a.service.price, 0),
      lastVisit: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null,
      totalAppointments: client.appointments.length,
      createdAt: client.createdAt,
    }
  })

  return NextResponse.json(clientsWithStats)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Nombre y telefono son obligatorios" }, { status: 400 })
  }

  // Check if client already exists by phone
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: body.phone },
        ...(body.email ? [{ email: body.email }] : []),
      ],
    },
  })

  if (existing) {
    return NextResponse.json({ error: "Ya existe un cliente con ese telefono o email" }, { status: 409 })
  }

  const client = await prisma.user.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      role: "CLIENT",
    },
  })

  return NextResponse.json(client, { status: 201 })
}
