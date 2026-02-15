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

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const [
    totalAppointments,
    completedToday,
    monthCompleted,
    totalClients,
    allMonthAppointments,
    topServiceResult,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count({
      where: {
        date: { gte: startOfDay, lt: endOfDay },
        status: "COMPLETED",
      },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: startOfMonth },
        status: "COMPLETED",
      },
      include: { service: true },
    }),
    prisma.user.count({
      where: { role: "CLIENT" },
    }),
    prisma.appointment.count({
      where: {
        date: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { status: { not: "CANCELLED" } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
  ])

  const monthRevenue = monthCompleted.reduce((sum, a) => sum + a.service.price, 0)

  // Completion rate
  const totalNonCancelled = await prisma.appointment.count({
    where: { status: { not: "CANCELLED" } },
  })
  const totalCompleted = await prisma.appointment.count({
    where: { status: "COMPLETED" },
  })
  const completionRate = totalNonCancelled > 0
    ? ((totalCompleted / totalNonCancelled) * 100).toFixed(0)
    : "0"

  // Average per day (last 30 days)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const last30 = await prisma.appointment.count({
    where: {
      date: { gte: thirtyDaysAgo },
      status: { not: "CANCELLED" },
    },
  })
  const avgPerDay = Math.round(last30 / 30)

  // Top service name
  let topService = "N/A"
  if (topServiceResult.length > 0) {
    const svc = await prisma.service.findUnique({
      where: { id: topServiceResult[0].serviceId },
    })
    if (svc) topService = svc.name
  }

  return NextResponse.json({
    totalAppointments,
    completedToday,
    monthRevenue,
    totalClients,
    avgPerDay,
    topService,
    completionRate,
  })
}
