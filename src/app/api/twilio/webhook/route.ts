import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Twilio envía el cuerpo como application/x-www-form-urlencoded
export async function POST(req: NextRequest) {
  // ── Validar firma de Twilio (evita peticiones falsas) ─────
  const authToken = process.env.TWILIO_AUTH_TOKEN || ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
  const signature = req.headers.get("x-twilio-signature") || ""

  const rawBody = await req.text()
  const params: Record<string, string> = {}
  new URLSearchParams(rawBody).forEach((value, key) => { params[key] = value })

  if (authToken && appUrl) {
    const webhookUrl = `${appUrl}/api/twilio/webhook`
    const valid = twilio.validateRequest(authToken, signature, webhookUrl, params)
    if (!valid) {
      console.warn("[Webhook] Firma inválida — petición ignorada")
      return new NextResponse("Unauthorized", { status: 403 })
    }
  }

  // ── Leer campos del mensaje entrante ──────────────────────
  const from = params["From"] || ""          // "whatsapp:+573001234567"
  const body = params["Body"] || ""          // texto del mensaje
  const profileName = params["ProfileName"] || "" // nombre de WhatsApp del remitente

  if (!from) {
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } })
  }

  const clientPhone = from.replace("whatsapp:", "")

  // ── Buscar cliente en la base de datos ────────────────────
  let clientName = profileName || "Desconocido"
  let isRegistered = false
  try {
    const user = await prisma.user.findFirst({
      where: { phone: clientPhone },
      select: { name: true },
    })
    if (user?.name) {
      clientName = user.name
      isRegistered = true
    }
  } catch {}

  // ── Reenviar mensaje a Rubén ──────────────────────────────
  const forwardTo = process.env.FORWARD_WHATSAPP_TO
  if (forwardTo) {
    const registered = isRegistered ? "✅ Cliente registrado" : "❓ No registrado"
    const msg = [
      `📩 *Mensaje entrante*`,
      ``,
      `👤 *${clientName}*`,
      `📱 ${clientPhone}`,
      `${registered}`,
      ``,
      `💬 _"${body}"_`,
    ].join("\n")

    sendWhatsAppMessage(forwardTo, msg).catch((err) =>
      console.error("[Webhook] Error al reenviar mensaje:", err)
    )
  } else {
    console.warn("[Webhook] FORWARD_WHATSAPP_TO no está configurado — mensaje no reenviado")
  }

  // ── Respuesta vacía a Twilio (sin auto-reply al cliente) ──
  return new NextResponse("<Response/>", {
    headers: { "Content-Type": "text/xml" },
  })
}
