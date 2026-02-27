import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { formatDate, formatTime, getColombiaDateStr } from "@/lib/utils"

/**
 * When an appointment is cancelled, finds the first person in the waitlist
 * for that date (preferring same service), auto-schedules them at the freed
 * slot, and notifies them via WhatsApp.
 */
export async function autoScheduleFromWaitlist(
  cancelledDate: Date,
  barberId: string,
  cancelledServiceId: string
): Promise<void> {
  const dateStr = getColombiaDateStr(cancelledDate)

  // Prefer same service first, then any service
  let entry = await prisma.waitlistEntry.findFirst({
    where: { date: dateStr, status: "WAITING", serviceId: cancelledServiceId },
    include: { service: true },
    orderBy: { createdAt: "asc" },
  })

  if (!entry) {
    entry = await prisma.waitlistEntry.findFirst({
      where: { date: dateStr, status: "WAITING" },
      include: { service: true },
      orderBy: { createdAt: "asc" },
    })
  }

  if (!entry) return

  // Find or create the user by phone
  let user = await prisma.user.findFirst({ where: { phone: entry.phone } })
  if (!user) {
    user = await prisma.user.create({
      data: { name: entry.name, phone: entry.phone, role: "CLIENT" },
    })
  }

  // Auto-create appointment at the freed slot
  const appointment = await prisma.appointment.create({
    data: {
      date: cancelledDate,
      userId: user.id,
      serviceId: entry.serviceId,
      barberId,
      bookedBy: "BARBER",
      status: "CONFIRMED",
    },
    include: {
      service: true,
      barber: {
        select: {
          id: true,
          barberSettings: { select: { shopName: true } },
        },
      },
    },
  })

  // Mark waitlist entry as BOOKED
  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { status: "BOOKED", notified: true },
  })

  // Send WhatsApp to the client
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
  const shopName = appointment.barber.barberSettings?.shopName || "Frailin Studio"
  const appointmentLink = baseUrl ? `${baseUrl}/cita/${appointment.token}` : ""

  const msg =
    `🎉 *¡Buenas noticias, ${entry.name}!*\n\n` +
    `Se liberó un cupo y te agendamos automáticamente:\n\n` +
    `📋 Servicio: ${appointment.service.name}\n` +
    `📅 Fecha: ${formatDate(appointment.date)}\n` +
    `🕐 Hora: ${formatTime(appointment.date)}\n` +
    `💈 ${shopName}` +
    (appointmentLink ? `\n\n🔗 Ver o cancelar tu cita:\n${appointmentLink}` : "") +
    `\n\n¡Te esperamos!`

  sendWhatsAppMessage(entry.phone, msg).catch((err) =>
    console.error("[Waitlist] Error sending WhatsApp:", err)
  )
}
