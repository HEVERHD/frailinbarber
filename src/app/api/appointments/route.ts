import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, sendWhatsAppTemplate, buildConfirmationMessage, buildBarberNotification } from "@/lib/twilio"
import { formatDate, formatTime, formatCurrency, parseColombia, getColombiaTime, getColombiaDateStr, getColombiaDayOfWeek, to12Hour } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const status = searchParams.get("status")

  const where: any = {}

  if (startDate && endDate) {
    where.date = {
      gte: parseColombia(startDate + "T00:00:00"),
      lt: parseColombia(endDate + "T23:59:59"),
    }
  } else if (dateStr) {
    where.date = {
      gte: parseColombia(dateStr + "T00:00:00"),
      lt: parseColombia(dateStr + "T23:59:59"),
    }
  }

  if (status) {
    where.status = status
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { user: true, service: true },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Find or create client user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: body.phone },
        ...(body.email ? [{ email: body.email }] : []),
      ],
    },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: body.clientName,
        phone: body.phone,
        email: body.email || null,
        role: "CLIENT",
      },
    })
  } else {
    if (!user.phone && body.phone) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phone: body.phone },
      })
    }
  }

  const service = await prisma.service.findUnique({ where: { id: body.serviceId } })
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  }

  // Parse as Colombia time
  const appointmentDate = parseColombia(body.date)
  const appointmentEnd = new Date(appointmentDate.getTime() + service.duration * 60000)

  // Get the date string in Colombia timezone for querying
  const colombiaDateStr = getColombiaDateStr(appointmentDate)

  // Validate against barber settings (business hours + days off)
  const settings = await prisma.barberSettings.findFirst()
  if (settings) {
    // Check day off
    const daysOff = settings.daysOff.split(",").map(Number)
    if (daysOff.includes(getColombiaDayOfWeek(appointmentDate))) {
      return NextResponse.json(
        { error: "Este día no hay servicio. Selecciona otro día." },
        { status: 400 }
      )
    }

    // Check business hours
    const colTime = getColombiaTime(appointmentDate)
    const aptMinutes = colTime.hours * 60 + colTime.minutes
    const [openH, openM] = settings.openTime.split(":").map(Number)
    const [closeH, closeM] = settings.closeTime.split(":").map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (aptMinutes < openMinutes || aptMinutes + service.duration > closeMinutes) {
      return NextResponse.json(
        { error: `Horario fuera de servicio. Atendemos de ${to12Hour(settings.openTime)} a ${to12Hour(settings.closeTime)}.` },
        { status: 400 }
      )
    }
  }

  // Check for conflicting appointments (overlapping time slots)
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: parseColombia(colombiaDateStr + "T00:00:00"),
        lt: parseColombia(colombiaDateStr + "T23:59:59"),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { service: true },
  })

  const hasConflict = existingAppointments.some((existing) => {
    const existingStart = new Date(existing.date).getTime()
    const existingEnd = existingStart + existing.service.duration * 60000
    const newStart = appointmentDate.getTime()
    const newEnd = appointmentEnd.getTime()
    return newStart < existingEnd && newEnd > existingStart
  })

  if (hasConflict) {
    return NextResponse.json(
      { error: "Ya existe una cita en ese horario. Por favor selecciona otro." },
      { status: 409 }
    )
  }

  // Check for blocked slots
  const colTime = getColombiaTime(appointmentDate)
  const timeStr = `${colTime.hours.toString().padStart(2, "0")}:${colTime.minutes.toString().padStart(2, "0")}`
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { date: colombiaDateStr },
  })

  const isBlocked = blockedSlots.some((blocked) => {
    if (blocked.allDay) return true
    return timeStr >= blocked.startTime && timeStr < blocked.endTime
  })

  if (isBlocked) {
    return NextResponse.json(
      { error: "Este horario está bloqueado. Por favor selecciona otro." },
      { status: 409 }
    )
  }

  const appointment = await prisma.appointment.create({
    data: {
      date: appointmentDate,
      userId: user.id,
      serviceId: body.serviceId,
      bookedBy: body.bookedBy || "CLIENT",
      notes: body.notes || null,
      status: "CONFIRMED",
    },
    include: { service: true, user: true },
  })

  // Build appointment link for client (use public URL for WhatsApp, fallback to NEXTAUTH_URL)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const appointmentLink = `${baseUrl}/cita/${appointment.token}`

  // Send WhatsApp confirmation to client + notification to barber
  const shopName = settings?.shopName || "Mi Barbería"

  const confirmationTemplateSid = process.env.TWILIO_TEMPLATE_CONFIRMATION
  const barberTemplateSid = process.env.TWILIO_TEMPLATE_BARBER

  if (user.phone) {
    try {
      if (confirmationTemplateSid) {
        // Use approved WhatsApp template for business-initiated messages
        // Template: Servicio: {{1}}, Fecha: {{2}}, Hora: {{3}}, Lugar: {{4}}, Link: {{5}}
        await sendWhatsAppTemplate(user.phone, confirmationTemplateSid, {
          "1": appointment.service.name,
          "2": formatDate(appointment.date),
          "3": formatTime(appointment.date),
          "4": shopName,
          "5": appointmentLink,
        })
      } else {
        // Fallback to plain text (works for sandbox or user-initiated conversations)
        const message = buildConfirmationMessage(
          user.name || "Cliente",
          appointment.service.name,
          formatDate(appointment.date),
          formatTime(appointment.date),
          shopName,
          appointmentLink
        )
        await sendWhatsAppMessage(user.phone, message)
      }
    } catch (error) {
      console.error("Error sending WhatsApp to client:", error)
    }
  }

  // Notify barbers via WhatsApp
  try {
    const barbers = await prisma.user.findMany({
      where: { role: "BARBER", phone: { not: null } },
      select: { phone: true },
    })

    for (const barber of barbers) {
      if (barber.phone) {
        if (barberTemplateSid) {
          // Template: Cliente: {{1}}, Servicio: {{2}}, Fecha: {{3}}, Hora: {{4}}, Precio: {{5}}
          sendWhatsAppTemplate(barber.phone, barberTemplateSid, {
            "1": user.name || "Cliente",
            "2": appointment.service.name,
            "3": formatDate(appointment.date),
            "4": formatTime(appointment.date),
            "5": formatCurrency(appointment.service.price),
          }).catch((err) => console.error("Error notifying barber:", err))
        } else {
          const barberMsg = buildBarberNotification(
            user.name || "Cliente",
            appointment.service.name,
            formatDate(appointment.date),
            formatTime(appointment.date),
            formatCurrency(appointment.service.price),
            body.bookedBy || "CLIENT"
          )
          sendWhatsAppMessage(barber.phone, barberMsg).catch((err) =>
            console.error("Error notifying barber:", err)
          )
        }
      }
    }
  } catch (error) {
    console.error("Error notifying barbers:", error)
  }

  return NextResponse.json(appointment, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id: body.id },
    data: { status: body.status },
    include: { service: true, user: true },
  })

  // When cancelling, notify waitlist entries for that date
  if (body.status === "CANCELLED") {
    try {
      const dateStr = getColombiaDateStr(new Date(appointment.date))
      const waitlistEntries = await prisma.waitlistEntry.findMany({
        where: { date: dateStr, status: "WAITING" },
        include: { service: true },
      })

      for (const entry of waitlistEntries) {
        if (entry.phone) {
          const message = `Hola ${entry.name}, se ha liberado un horario para ${dateStr}. Reserva tu cita ahora en ${process.env.NEXT_PUBLIC_APP_URL || "https://frailinstudio.com"}/booking`
          sendWhatsAppMessage(entry.phone, message).catch((err) =>
            console.error("Error notifying waitlist:", err)
          )
          await prisma.waitlistEntry.update({
            where: { id: entry.id },
            data: { status: "NOTIFIED", notified: true },
          })
        }
      }
    } catch (error) {
      console.error("Error notifying waitlist on cancellation:", error)
    }
  }

  return NextResponse.json(appointment)
}
