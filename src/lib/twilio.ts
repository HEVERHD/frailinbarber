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

export function buildConfirmationMessage(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  shopName: string,
  appointmentLink?: string
): string {
  let msg = `✅ *Cita Confirmada*\n\nHola ${clientName}, tu cita ha sido agendada:\n\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💈 ${shopName}`
  if (appointmentLink) {
    msg += `\n\n🔗 Ver o cancelar tu cita:\n${appointmentLink}`
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
