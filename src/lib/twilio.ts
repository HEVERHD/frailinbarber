import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[WhatsApp Mock] To: ${to} | Message: ${message}`)
    return
  }

  // Ensure phone has Colombia country code (+57)
  let phone = to.replace(/\s+/g, "").replace(/^0+/, "")
  if (!phone.startsWith("+")) {
    phone = phone.startsWith("57") ? `+${phone}` : `+57${phone}`
  }
  const formattedTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`

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

export function buildConfirmationMessage(
  clientName: string,
  serviceName: string,
  date: string,
  time: string,
  shopName: string
): string {
  return `✅ *Cita Confirmada*\n\nHola ${clientName}, tu cita ha sido agendada:\n\n📋 Servicio: ${serviceName}\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💈 ${shopName}\n\n¡Te esperamos!`
}

export function buildReminderMessage(
  clientName: string,
  serviceName: string,
  time: string,
  shopName: string
): string {
  return `⏰ *Recordatorio de Cita*\n\nHola ${clientName}, tu cita es en 1 hora:\n\n📋 Servicio: ${serviceName}\n🕐 Hora: ${time}\n💈 ${shopName}\n\n¡Te esperamos!`
}
