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

  // This month's completed appointments
  const monthAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: startOfMonth },
      status: "COMPLETED",
    },
    include: { service: true },
  })

  const monthRevenue = monthAppointments.reduce((sum, a) => sum + a.service.price, 0)

  // Today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: startOfDay, lt: endOfDay },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    include: { service: true, user: true },
    orderBy: { date: "asc" },
  })

  // No-show count this month
  const noShowCount = await prisma.appointment.count({
    where: {
      date: { gte: startOfMonth },
      status: "NO_SHOW",
    },
  })

  // Total appointments this month (all statuses except cancelled)
  const totalMonthCount = await prisma.appointment.count({
    where: {
      date: { gte: startOfMonth },
      status: { not: "CANCELLED" },
    },
  })

  // Most popular service this month
  const serviceStats = await prisma.appointment.groupBy({
    by: ["serviceId"],
    where: {
      date: { gte: startOfMonth },
      status: { not: "CANCELLED" },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  })

  let topService = null
  if (serviceStats.length > 0) {
    topService = await prisma.service.findUnique({
      where: { id: serviceStats[0].serviceId },
    })
  }

  // Revenue last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const revenueByMonth = await prisma.appointment.findMany({
    where: {
      date: { gte: sixMonthsAgo },
      status: "COMPLETED",
    },
    include: { service: true },
  })

  const monthlyRevenue: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = m.toLocaleString("es-MX", { month: "short" })
    const revenue = revenueByMonth
      .filter((a) => {
        const d = new Date(a.date)
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
      })
      .reduce((sum, a) => sum + a.service.price, 0)
    monthlyRevenue.push({ month: monthName, revenue })
  }

  // Appointments by day of week
  const weekdayStats = await prisma.appointment.findMany({
    where: {
      date: { gte: sixMonthsAgo },
      status: { not: "CANCELLED" },
    },
  })

  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const byWeekday = days.map((day, index) => ({
    day,
    count: weekdayStats.filter((a) => new Date(a.date).getDay() === index).length,
  }))

  return NextResponse.json({
    monthRevenue,
    completedCount: monthAppointments.length,
    noShowCount,
    noShowRate: totalMonthCount > 0 ? ((noShowCount / totalMonthCount) * 100).toFixed(1) : "0",
    topService: topService?.name || "N/A",
    todayAppointments,
    monthlyRevenue,
    byWeekday,
  })
}
