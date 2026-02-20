import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, sendWhatsAppTemplate, buildReminderMessage } from "@/lib/twilio"
import { formatTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 40 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 80 * 60 * 1000)

  // Find appointments in the next 40-80 min window that haven't been notified
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: windowStart, lte: windowEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
      notified: false,
    },
    include: {
      user: true,
      service: true,
      barber: {
        select: { name: true },
        include: { barberSettings: true },
      },
    },
  })

  const templateSid = process.env.TWILIO_TEMPLATE_REMINDER_1H
  let sent = 0

  for (const appointment of appointments) {
    if (appointment.user.phone) {
      try {
        const shopName = (appointment.barber as any).barberSettings?.shopName || "Mi Barbería"
        if (templateSid) {
          await sendWhatsAppTemplate(appointment.user.phone, templateSid, {
            "1": appointment.user.name || "Cliente",
            "2": appointment.service.name,
            "3": formatTime(appointment.date),
            "4": shopName,
          })
        } else {
          const message = buildReminderMessage(
            appointment.user.name || "Cliente",
            appointment.service.name,
            formatTime(appointment.date),
            shopName
          )
          await sendWhatsAppMessage(appointment.user.phone, message)
        }
        sent++
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { notified: true },
        })
      } catch (error) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, error)
      }
    } else {
      // No phone number — mark as notified to avoid reprocessing
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { notified: true },
      })
    }
  }

  return NextResponse.json({
    checked: appointments.length,
    sent,
    timestamp: now.toISOString(),
  })
}
