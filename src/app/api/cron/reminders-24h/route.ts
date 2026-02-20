import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, sendWhatsAppTemplate, buildReminder24hMessage } from "@/lib/twilio"
import { formatDate, formatTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Window: appointments between 23h and 25h from now
  const from24h = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const to24h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: from24h, lte: to24h },
      status: { in: ["PENDING", "CONFIRMED"] },
      reminded24h: false,
    },
    include: {
      user: true,
      service: true,
      barber: {
        include: { barberSettings: true },
      },
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
  const templateSid = process.env.TWILIO_TEMPLATE_REMINDER_24H
  let sent = 0

  for (const appointment of appointments) {
    if (appointment.user.phone) {
      try {
        const shopName = (appointment.barber as any).barberSettings?.shopName || "Mi Barbería"
        const link = baseUrl ? `${baseUrl}/cita/${appointment.token}` : undefined
        if (templateSid) {
          await sendWhatsAppTemplate(appointment.user.phone, templateSid, {
            "1": appointment.user.name || "Cliente",
            "2": appointment.service.name,
            "3": formatDate(appointment.date),
            "4": formatTime(appointment.date),
            "5": shopName,
            ...(link ? { "6": link } : {}),
          })
        } else {
          const message = buildReminder24hMessage(
            appointment.user.name || "Cliente",
            appointment.service.name,
            formatDate(appointment.date),
            formatTime(appointment.date),
            shopName,
            link
          )
          await sendWhatsAppMessage(appointment.user.phone, message)
        }
        sent++
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminded24h: true },
        })
      } catch (error) {
        console.error(`Error sending 24h reminder for appointment ${appointment.id}:`, error)
      }
    } else {
      // No phone number — mark as reminded to avoid reprocessing
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminded24h: true },
      })
    }
  }

  return NextResponse.json({
    checked: appointments.length,
    sent,
    timestamp: now.toISOString(),
  })
}
