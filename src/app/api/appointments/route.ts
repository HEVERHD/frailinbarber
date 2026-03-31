import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, sendWhatsAppTemplate, buildConfirmationMessage, buildBarberNotification, buildStatusConfirmedMessage, buildLoyaltyMessage } from "@/lib/twilio"
import { formatDate, formatTime, formatCurrency, parseColombia, getColombiaTime, getColombiaDateStr, getColombiaDayOfWeek, to12Hour } from "@/lib/utils"
import { sendPushToBarber } from "@/lib/push"
import { autoScheduleFromWaitlist } from "@/lib/waitlist"

export const dynamic = "force-dynamic"

/** Fire-and-forget: mark as COMPLETED any appointment whose end time has passed */
async function autoCompletePastAppointments() {
  const now = new Date()
  const past = await prisma.appointment.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED"] }, date: { lt: now } },
    select: { id: true, date: true, service: { select: { duration: true } } },
  })
  const ids = past
    .filter((a) => new Date(a.date.getTime() + a.service.duration * 60_000) < now)
    .map((a) => a.id)
  if (ids.length > 0) {
    await prisma.appointment.updateMany({ where: { id: { in: ids } }, data: { status: "COMPLETED" } })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Run in background — doesn't block the response
  autoCompletePastAppointments().catch(() => {})

  const role = (session.user as any).role
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const status = searchParams.get("status")
  const barberId = searchParams.get("barberId")

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

  // ADMIN can see all or filter by barberId
  if (role === "ADMIN") {
    if (barberId) where.barberId = barberId
  } else {
    // BARBER only sees own appointments
    where.barberId = userId
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { user: true, service: true, barber: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.barberId) {
    return NextResponse.json({ error: "barberId es requerido" }, { status: 400 })
  }

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

  // Check if client is blocked
  if ((user as any).blocked) {
    return NextResponse.json(
      { error: "No es posible agendar una cita en este momento. Contáctanos para más información." },
      { status: 403 }
    )
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

  // Validate against barber's specific settings
  const settings = await prisma.barberSettings.findUnique({
    where: { userId: body.barberId },
  })
  if (settings) {
    // Check day off
    const daysOff = settings.daysOff.split(",").filter(Boolean).map(Number)
    if (daysOff.includes(getColombiaDayOfWeek(appointmentDate))) {
      return NextResponse.json(
        { error: "Este día no hay servicio. Selecciona otro día." },
        { status: 400 }
      )
    }

    // Check business hours (use day-specific schedule if available)
    const colTime = getColombiaTime(appointmentDate)
    const aptMinutes = colTime.hours * 60 + colTime.minutes
    const dayOfWeek = getColombiaDayOfWeek(appointmentDate)

    let effectiveOpen = settings.openTime
    let effectiveClose = settings.closeTime
    if (settings.daySchedules) {
      try {
        const daySchedules = JSON.parse(settings.daySchedules) as Record<string, { open: string; close: string }>
        const dayKey = String(dayOfWeek)
        if (daySchedules[dayKey]) {
          effectiveOpen = daySchedules[dayKey].open
          effectiveClose = daySchedules[dayKey].close
        }
      } catch {
        // invalid JSON, ignore and use global
      }
    }

    const [openH, openM] = effectiveOpen.split(":").map(Number)
    const [closeH, closeM] = effectiveClose.split(":").map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (aptMinutes < openMinutes || aptMinutes + service.duration > closeMinutes) {
      return NextResponse.json(
        { error: `Horario fuera de servicio. Atendemos de ${to12Hour(effectiveOpen)} a ${to12Hour(effectiveClose)}.` },
        { status: 400 }
      )
    }
  }

  // Check for conflicting appointments for THIS barber only
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: parseColombia(colombiaDateStr + "T00:00:00"),
        lt: parseColombia(colombiaDateStr + "T23:59:59"),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
      barberId: body.barberId,
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

  // Check for blocked slots for THIS barber only (one-time + recurring)
  // Use full interval overlap: blocked if [aptStart, aptEnd) overlaps [blockStart, blockEnd)
  const colTime = getColombiaTime(appointmentDate)
  const aptStart = colTime.hours * 60 + colTime.minutes
  const aptEnd = aptStart + service.duration
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }

  const [blockedSlots, recurringBlocks] = await Promise.all([
    prisma.blockedSlot.findMany({ where: { date: colombiaDateStr, barberId: body.barberId } }),
    prisma.recurringBlock.findMany({ where: { barberId: body.barberId } }),
  ])

  const isBlocked =
    blockedSlots.some((blocked) => {
      if (blocked.allDay) return true
      return aptStart < toMin(blocked.endTime) && aptEnd > toMin(blocked.startTime)
    }) ||
    recurringBlocks.some((r) => {
      if (r.allDay) return true
      return aptStart < toMin(r.endTime) && aptEnd > toMin(r.startTime)
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
      barberId: body.barberId,
      bookedBy: body.bookedBy || "CLIENT",
      notes: body.notes || null,
      status: "CONFIRMED",
    },
    include: { service: true, user: true, barber: { select: { id: true, name: true, phone: true, barberSettings: { select: { phone: true } } } } },
  })

  // Auto-mark waitlist entry as BOOKED if client was on the waitlist for this date
  if (user.phone) {
    const waitlistEntry = await prisma.waitlistEntry.findFirst({
      where: {
        phone: user.phone,
        date: colombiaDateStr,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
    })
    if (waitlistEntry) {
      await prisma.waitlistEntry.update({
        where: { id: waitlistEntry.id },
        data: { status: "BOOKED", notified: true },
      })
      console.log(`[Waitlist] Auto-marked entry ${waitlistEntry.id} as BOOKED — client booked from /booking`)
    }
  }

  // Build appointment link for client
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const appointmentLink = `${baseUrl}/cita/${appointment.token}`
  const queueLink = `${baseUrl}/cola`

  // Send WhatsApp confirmation to client
  const shopName = settings?.shopName || "Mi Barbería"
  const confirmationTemplateSid = process.env.TWILIO_TEMPLATE_CONFIRMATION
  const barberTemplateSid = process.env.TWILIO_TEMPLATE_BARBER

  if (user.phone) {
    try {
      if (confirmationTemplateSid) {
        await sendWhatsAppTemplate(user.phone, confirmationTemplateSid, {
          "1": appointment.service.name,
          "2": formatDate(appointment.date),
          "3": formatTime(appointment.date),
          "4": shopName,
          "5": appointmentLink,
        })
      } else {
        const message = buildConfirmationMessage(
          user.name || "Cliente",
          appointment.service.name,
          formatDate(appointment.date),
          formatTime(appointment.date),
          shopName,
          appointmentLink,
          queueLink
        )
        await sendWhatsAppMessage(user.phone, message)
      }
    } catch (error) {
      console.error("Error sending WhatsApp to client:", error)
    }
  }

  // Notify only the assigned barber (not all barbers)
  const barberPhone = appointment.barber.barberSettings?.phone || appointment.barber.phone
  if (barberPhone) {
    try {
      if (barberTemplateSid) {
        sendWhatsAppTemplate(barberPhone, barberTemplateSid, {
          "1": user.name || "Cliente",
          "2": appointment.service.name,
          "3": formatDate(appointment.date),
          "4": formatTime(appointment.date),
          "5": formatCurrency(appointment.service.price),
          "6": appointmentLink,
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
        sendWhatsAppMessage(barberPhone, barberMsg).catch((err) =>
          console.error("Error notifying barber:", err)
        )
      }
    } catch (error) {
      console.error("Error notifying barber:", error)
    }
  }

  // Push notification to the assigned barber
  sendPushToBarber(appointment.barber.id, {
    title: "📅 Nueva cita",
    body: `${user.name || "Cliente"} · ${appointment.service.name} · ${formatDate(appointment.date)} ${formatTime(appointment.date)}`,
    url: "/appointments",
    tag: "new-appointment",
  }).catch(() => {})

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const queueLink = `${baseUrl}/cola`

  // When confirming, notify the client
  if (body.status === "CONFIRMED" && appointment.user.phone) {
    try {
      const settings = await prisma.barberSettings.findFirst()
      const shopName = settings?.shopName || "Frailin Studio"
      const msg = buildStatusConfirmedMessage(
        appointment.user.name?.split(" ")[0] || "Cliente",
        appointment.service.name,
        formatDate(appointment.date),
        formatTime(appointment.date),
        shopName,
        queueLink
      )
      sendWhatsAppMessage(appointment.user.phone, msg).catch(() => {})
    } catch {}
  }

  // When completing, notify the next client in queue + check loyalty
  if (body.status === "COMPLETED") {
    try {
      const dateStr = getColombiaDateStr(new Date(appointment.date))
      const nextApt = await prisma.appointment.findFirst({
        where: {
          date: {
            gt: appointment.date,
            lt: parseColombia(dateStr + "T23:59:59"),
          },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: { user: true, service: true },
        orderBy: { date: "asc" },
      })
      if (nextApt?.user.phone) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
        const msg = `¡Hola ${nextApt.user.name?.split(" ")[0] || ""}! 💈 Es casi tu turno en Frailin Studio. Tu cita de *${nextApt.service.name}* está próxima. Ve preparándote. 🙌\n\n📍 ${baseUrl}/cola`
        sendWhatsAppMessage(nextApt.user.phone, msg).catch(() => {})
      }
    } catch {}

    // Loyalty: if client has 7 completed appointments this month, send discount WhatsApp
    try {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const [completedThisMonth, clientUser] = await Promise.all([
        prisma.appointment.count({
          where: {
            userId: appointment.userId,
            status: "COMPLETED",
            date: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.user.findUnique({ where: { id: appointment.userId }, select: { phone: true, name: true, loyaltyNotifiedMonth: true } }),
      ])

      if (
        completedThisMonth >= 7 &&
        clientUser?.phone &&
        clientUser.loyaltyNotifiedMonth !== currentMonth
      ) {
        const settings = await prisma.barberSettings.findFirst({ select: { shopName: true } })
        const shopName = settings?.shopName || "Frailin Studio"
        const loyaltyTemplateSid = process.env.TWILIO_TEMPLATE_LOYALTY
        const clientName = clientUser.name?.split(" ")[0] || "Cliente"
        if (loyaltyTemplateSid) {
          sendWhatsAppTemplate(clientUser.phone, loyaltyTemplateSid, {
            "1": clientName,
            "2": shopName,
          }).catch(() => {})
        } else {
          sendWhatsAppMessage(clientUser.phone, buildLoyaltyMessage(clientName, shopName)).catch(() => {})
        }
        await prisma.user.update({
          where: { id: appointment.userId },
          data: { loyaltyNotifiedMonth: currentMonth },
        })
      }
    } catch {}
  }

  // When cancelling or no-show, auto-schedule the next person in the waitlist
  if (body.status === "CANCELLED" || body.status === "NO_SHOW") {
    autoScheduleFromWaitlist(
      new Date(appointment.date),
      appointment.barberId,
      appointment.serviceId
    ).catch((err) => console.error("Error auto-scheduling from waitlist:", err))
  }

  return NextResponse.json(appointment)
}
