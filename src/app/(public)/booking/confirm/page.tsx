"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function ConfirmContent() {
  const searchParams = useSearchParams()
  const [animate, setAnimate] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const service = searchParams.get("service") || ""
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const duration = searchParams.get("duration") || ""
  const price = searchParams.get("price") || ""
  const name = searchParams.get("name") || ""

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100)
    setTimeout(() => setShowDetails(true), 600)
  }, [])

  const formatPrice = (p: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(p))

  const formatDate = (d: string) => {
    if (!d) return ""
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    }).format(new Date(d + "T12:00:00"))
  }

  const addToCalendarUrl = () => {
    if (!date || !time) return "#"
    const start = `${date.replace(/-/g, "")}T${time.replace(":", "")}00`
    const endDate = new Date(`${date}T${time}:00`)
    endDate.setMinutes(endDate.getMinutes() + Number(duration || 30))
    const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0]
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Cita - ${service}`
    )}&dates=${start}/${end}&details=${encodeURIComponent(
      `Servicio: ${service}\nDuración: ${duration} min`
    )}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] px-4">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Success animation */}
        <div
          className={`flex flex-col items-center mb-8 transition-all duration-700 ${
            animate ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="relative w-24 h-24 mb-6">
            <div className={`absolute inset-0 bg-green-500/20 rounded-full ${animate ? "animate-ping" : ""}`} />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg
                className={`w-12 h-12 text-white transition-all duration-500 ${
                  animate ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">
            {name ? `${name}, ` : ""}Cita Agendada!
          </h1>
          <p className="text-white/50 mt-2 text-center">
            Te enviaremos un recordatorio por WhatsApp
          </p>
        </div>

        {/* Booking details card */}
        <div
          className={`bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-700 delay-300 ${
            showDetails ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600" />

          <div className="p-6">
            {/* Service */}
            {service && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-[#d97706]/20 rounded-xl flex items-center justify-center text-xl">
                  ✂️
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/40">Servicio</p>
                  <p className="font-semibold text-white text-lg">{service}</p>
                </div>
                {price && (
                  <p className="text-lg font-bold text-[#d97706]">{formatPrice(price)}</p>
                )}
              </div>
            )}

            <div className="h-px bg-white/8 my-4" />

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {date && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <div className="text-xl mb-1">📅</div>
                  <p className="text-xs text-white/40">Fecha</p>
                  <p className="text-sm font-medium text-white mt-1 capitalize">{formatDate(date)}</p>
                </div>
              )}
              {time && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <div className="text-xl mb-1">🕐</div>
                  <p className="text-xs text-white/40">Hora</p>
                  <p className="text-sm font-medium text-white mt-1">{time}</p>
                  {duration && (
                    <p className="text-xs text-white/30 mt-0.5">{duration} min</p>
                  )}
                </div>
              )}
            </div>

            {/* WhatsApp reminder notice */}
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 flex items-center gap-3 mb-5">
              <span className="text-2xl">📲</span>
              <div>
                <p className="text-sm font-medium text-green-400">Recordatorio por WhatsApp</p>
                <p className="text-xs text-white/40">Te avisaremos 1 hora antes de tu cita</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <a
                href={addToCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Agregar al calendario
              </a>

              <Link
                href="/booking"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#d97706] text-white text-sm font-semibold hover:bg-[#b45309] transition"
              >
                Agendar otra cita
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center w-full py-3 text-sm text-white/40 hover:text-white transition"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">✂️ Tu Barbería</p>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d97706] animate-spin" />
            </div>
            <span className="text-white/40 text-sm">Cargando...</span>
          </div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
