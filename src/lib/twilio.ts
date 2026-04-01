import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"

function formatPhone(to: string): string {
  let phone = to.replace(/\s+/g, "").replace(/^0+/, "")
  if (!phone.startsWith("+")) {
    phone = phone.startsWith("57") ? `+${phone}` : `+57${phone}`
  }
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[WhatsApp Mock] To: ${to} | Message: ${message}`)
    return
  }

  const formattedTo = formatPhone(to)

  try {
    const msg = await client.messages.create({
      from,
      to: formattedTo,
      body: message,
    })
    console.log(`[WhatsApp] Sent to ${formattedTo} | SID: ${msg.sid}`)
  } catch (error: any) {
    console.error(`[WhatsApp Error] ${error.message}`)
    throw error
  }
}

/** Send a WhatsApp message using a Twilio Content Template (for business-initiated messages) */
export async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  variables: Record<string, string>
) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[WhatsApp Mock Template] To: ${to} | Template: ${contentSid} | Vars: ${JSON.stringify(variables)}`)
    return
  }

  const formattedTo = formatPhone(to)

  try {
    const msg = await client.messages.create({
      from,
      to: formattedTo,
      contentSid,
      contentVariables: JSON.stringify(variables),
    })
    console.log(`[WhatsApp Template] Sent to ${formattedTo} | SID: ${msg.sid}`)
  } catch (error: any) {
    console.error(`[WhatsApp Template Error] ${error.message}`)
    throw error
  }
}

/** Send a plain SMS via Vonage (fallback when WhatsApp fails) */
export async function sendSMS(to: string, message: string) {
  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.log(`[SMS Mock] To: ${to} | Message: ${message}`)
    return
  }

  let phone = to.replace(/\s+/g, "").replace(/^0+/, "").replace(/^\+/, "")
  if (!phone.startsWith("57")) {
    phone = `57${phone}`
  }

  try {
    const res = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.VONAGE_API_KEY,
        api_secret: process.env.VONAGE_API_SECRET,
        to: phone,
        from: "Frailin",
        text: message,
      }),
    })
    const data = await res.json() as any
    const msg = data.messages?.[0]
    if (msg?.status === "0") {
      console.log(`[SMS Vonage] Sent to +${phone} | MessageId: ${msg["message-id"]}`)
    } else {
      throw new Error(msg?.["error-text"] || JSON.stringify(data))
    }
  } catch (error: any) {
    console.error(`[SMS Vonage Error] ${error.message}`)
    throw error
  }
}

/** Try WhatsApp template; also always send SMS while WhatsApp has delivery issues */
export async function sendWhatsAppTemplateWithSMSFallback(
  to: string,
  contentSid: string,
  variables: Record<string, string>,
  smsFallbackBody: string
): Promise<void> {
  // Fire WhatsApp (don't await — 63005 failures are async, won't throw here)
  sendWhatsAppTemplate(to, contentSid, variables).catch((err) => {
    console.log(`[WhatsApp Failed] ${err.message} for ${to}`)
  })
  // Always send SMS as guaranteed delivery while WhatsApp is broken
  await sendSMS(to, smsFallbackBody).catch((err) => {
    console.error(`[SMS Error] ${err.message} for ${to}`)
  })
}

export function buildConfirmationMessage(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  shopName: string,
  appointmentLink?: string,
  queueLink?: string
): string {
  let msg = `✅ *Cita Confirmada*\n\nHola ${clientName}, tu cita ha sido agendada:\n\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💈 ${shopName}`
  if (appointmentLink) {
    msg += `\n\n🔗 Ver o cancelar tu cita:\n${appointmentLink}`
  }
  if (queueLink) {
    msg += `\n\n📍 Ver cola en vivo el día de tu cita:\n${queueLink}`
  }
  msg += `\n\n¡Te esperamos!`
  return msg
}

export function buildStatusConfirmedMessage(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  shopName: string,
  queueLink?: string
): string {
  let msg = `✅ *Cita Confirmada por el barbero*\n\nHola ${clientName}, tu cita ha sido confirmada:\n\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💈 ${shopName}`
  if (queueLink) {
    msg += `\n\n📍 Ver cola en vivo el día de tu cita:\n${queueLink}`
  }
  msg += `\n\n¡Te esperamos!`
  return msg
}

export function buildBarberNotification(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  price: string,
  bookedBy: string
): string {
  const source = bookedBy === "CLIENT" ? "desde la web" : "manual"
  return `🔔 *Nueva Cita Agendada* (${source})\n\n👤 Cliente: ${clientName}\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💰 Precio: ${price}\n\n¡Revisa tu agenda!`
}

export function buildReminderMessage(
  clientName: string,
  serviceName: string,
  time: string,
  shopName: string
): string {
  return `⏰ *Recordatorio de Cita*\n\nHola ${clientName}, tu cita es en 1 hora:\n\n📋 Servicio: ${serviceName}\n🕐 Hora: ${time}\n💈 ${shopName}\n\n¡Te esperamos!`
}

export function buildLoyaltyMessage(
  clientName: string,
  shopName: string
): string {
  return `🎉 *¡Felicidades ${clientName}!*\n\nAlcanzaste *7 cortes* este mes en ${shopName}. 💈\n\n¡Has ganado un *descuento especial* en tu próxima cita! Menciónalo al llegar y te aplicamos el beneficio.\n\n¡Gracias por tu fidelidad!`
}

export function buildReengagementMessage(
  clientName: string,
  shopName: string,
  bookingLink: string
): string {
  return `¡Hola ${clientName}! 👋 Te echamos de menos en ${shopName}.\n\nHace más de 10 días que no tienes una cita agendada. ¿Cuándo te vemos? 💈\n\n🔗 Reserva aquí: ${bookingLink}`
}

export function buildReminder24hMessage(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  shopName: string,
  appointmentLink?: string
): string {
  let msg = `📅 *Recordatorio — Mañana tienes cita*\n\nHola ${clientName}, te recordamos tu cita:\n\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💈 ${shopName}`
  if (appointmentLink) {
    msg += `\n\n🔗 Ver o cancelar tu cita:\n${appointmentLink}`
  }
  msg += `\n\n¡Te esperamos!`
  return msg
}
