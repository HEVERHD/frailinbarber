"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState, useRef } from "react"
import Image from "next/image"

// ── Confetti ──────────────────────────────────────────────────
const COLORS = ["#d97706", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#ffffff"]

function Confetti({ active }: { active: boolean }) {
  const particles = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: `${(i * 37 + 11) % 100}%`,
      delay: `${((i * 0.13) % 1.8).toFixed(2)}s`,
      duration: `${(2.2 + (i * 0.07) % 1.5).toFixed(2)}s`,
      size: `${6 + (i % 5)}px`,
      round: i % 3 !== 0,
    }))
  )

  if (!active) return null

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {particles.current.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              top: 0,
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.round ? "50%" : "2px",
              animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────
function ConfirmContent() {
  const searchParams = useSearchParams()
  const [animate, setAnimate] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const service     = searchParams.get("service") || ""
  const date        = searchParams.get("date") || ""
  const time        = searchParams.get("time") || ""
  const duration    = searchParams.get("duration") || ""
  const price       = searchParams.get("price") || ""
  const name        = searchParams.get("name") || ""
  const barber      = searchParams.get("barber") || ""
  const barberImage = searchParams.get("barberImage") || ""

  useEffect(() => {
    setTimeout(() => { setAnimate(true); setConfetti(true) }, 100)
    setTimeout(() => setShowDetails(true), 600)
    setTimeout(() => setConfetti(false), 4000)
  }, [])

  const formatPrice = (p: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Number(p))

  const formatDateStr = (d: string) => {
    if (!d) return ""
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: "America/Bogota",
    }).format(new Date(d + "T12:00:00"))
  }

  const formatTime12 = (t: string) => {
    if (!t) return ""
    const [h, m] = t.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
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
      <Confetti active={confetti} />

      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">

        {/* Success animation */}
        <div className={`flex flex-col items-center mb-8 transition-all duration-700 ${animate ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>

          {/* Barber avatar above the checkmark */}
          {barberImage && (
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#d97706]/40 shadow-lg">
                <Image src={barberImage} alt={barber} width={64} height={64} className="object-cover w-full h-full" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* Checkmark circle */}
          <div className="relative w-20 h-20 mb-5">
            <div className={`absolute inset-0 bg-green-500/20 rounded-full ${animate ? "animate-ping" : ""}`} style={{ animationDuration: "1.5s", animationIterationCount: "2" }} />
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg
                className={`w-10 h-10 text-white transition-all duration-500 ${animate ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center">
            {name ? `${name.split(" ")[0]}, ` : ""}¡Cita Agendada!
          </h1>
          {barber && (
            <p className="text-white/40 text-sm mt-1">con {barber}</p>
          )}
          <p className="text-white/40 mt-1.5 text-center text-sm">
            Te enviaremos confirmación por WhatsApp
          </p>
        </div>

        {/* Booking details card */}
        <div className={`bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-700 delay-300 ${showDetails ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600" />

          <div className="p-6">
            {/* Service + barber */}
            {service && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-[#d97706]/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  ✂️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">Servicio</p>
                  <p className="font-semibold text-white text-base leading-tight">{service}</p>
                  {barber && <p className="text-xs text-white/35 mt-0.5">con {barber}</p>}
                </div>
                {price && (
                  <p className="text-lg font-bold text-[#d97706] flex-shrink-0">{formatPrice(price)}</p>
                )}
              </div>
            )}

            <div className="h-px bg-white/8 my-4" />

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {date && (
                <div className="bg-white/5 rounded-xl p-3.5 border border-white/8">
                  <div className="text-xl mb-1">📅</div>
                  <p className="text-xs text-white/40">Fecha</p>
                  <p className="text-sm font-medium text-white mt-0.5 capitalize leading-tight">{formatDateStr(date)}</p>
                </div>
              )}
              {time && (
                <div className="bg-white/5 rounded-xl p-3.5 border border-white/8">
                  <div className="text-xl mb-1">🕐</div>
                  <p className="text-xs text-white/40">Hora</p>
                  <p className="text-sm font-medium text-white mt-0.5">{formatTime12(time)}</p>
                  {duration && <p className="text-xs text-white/30 mt-0.5">{duration} min</p>}
                </div>
              )}
            </div>

            {/* WhatsApp notice */}
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3.5 flex items-center gap-3 mb-5">
              <span className="text-2xl">📲</span>
              <div>
                <p className="text-sm font-medium text-green-400">Confirmación por WhatsApp</p>
                <p className="text-xs text-white/40">Revisa tu WhatsApp para los detalles</p>
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        <p className="text-center text-xs text-white/20 mt-6">✂️ Frailin Studio</p>
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
