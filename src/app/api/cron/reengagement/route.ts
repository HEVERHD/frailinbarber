import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"
// import { sendWhatsAppMessage, sendWhatsAppTemplateWithSMSFallback, buildReengagementMessage } from "@/lib/twilio"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // ── DESACTIVADO TEMPORALMENTE ──────────────────────────────
  // Para reactivar: descomentar las importaciones de arriba y el bloque de abajo.
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ disabled: true, message: "Re-engagement desactivado" })

  // const now = new Date()
  // const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

  // // Find clients whose last appointment was > 10 days ago
  // // and haven't received a re-engagement message in the last 10 days
  // const clients = await prisma.user.findMany({
  //   where: {
  //     role: "CLIENT",
  //     phone: { not: null },
  //     OR: [
  //       { reengagementSentAt: null },
  //       { reengagementSentAt: { lt: tenDaysAgo } },
  //     ],
  //   },
  //   select: {
  //     id: true,
  //     name: true,
  //     phone: true,
  //     reengagementSentAt: true,
  //     appointments: {
  //       orderBy: { date: "desc" },
  //       take: 1,
  //       select: { date: true, status: true },
  //     },
  //   },
  // })

  // const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  // const bookingLink = `${baseUrl}/booking`

  // const settings = await prisma.barberSettings.findFirst({ select: { shopName: true } })
  // const shopName = settings?.shopName || "Mi Barbería"

  // const reengagementTemplateSid = process.env.TWILIO_TEMPLATE_REENGAGEMENT

  // let sent = 0
  // const toNotify: string[] = []

  // for (const client of clients) {
  //   const lastApt = client.appointments[0]

  //   // Skip if: no past appointments, or last appointment < 10 days ago
  //   if (!lastApt) continue
  //   const lastAptDate = new Date(lastApt.date)
  //   if (lastAptDate > tenDaysAgo) continue

  //   toNotify.push(client.id)

  //   if (client.phone) {
  //     const clientName = client.name?.split(" ")[0] || "Cliente"
  //     try {
  //       if (reengagementTemplateSid) {
  //         await sendWhatsAppTemplateWithSMSFallback(client.phone, reengagementTemplateSid, {
  //           "1": clientName,
  //           "2": shopName,
  //           "3": bookingLink,
  //         }, `¡Hola ${clientName}! Te echamos de menos en ${shopName}. Reserva tu cita aquí: ${bookingLink}`)
  //       } else {
  //         await sendWhatsAppMessage(client.phone, buildReengagementMessage(clientName, shopName, bookingLink))
  //       }
  //       sent++
  //     } catch (err) {
  //       console.error(`[Reengagement] Error sending to ${client.phone}:`, err)
  //     }
  //   }
  // }

  // // Update reengagementSentAt for all notified clients
  // if (toNotify.length > 0) {
  //   await prisma.user.updateMany({
  //     where: { id: { in: toNotify } },
  //     data: { reengagementSentAt: now },
  //   })
  // }

  // return NextResponse.json({
  //   checked: clients.length,
  //   sent,
  //   timestamp: now.toISOString(),
  // })
}
