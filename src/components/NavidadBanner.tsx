"use client"

import { useEffect, useState } from "react"
import { daysUntilNewYear, upcomingYear } from "@/lib/season"

interface NavidadBannerProps {
  // anoNuevo = 1–6 de enero: el banner celebra el año que arrancó
  newYear?: boolean
  // Cupos libres reales por fecha (YYYY-MM-DD) del 24 y 31 de diciembre, desde /api/season
  cupos?: Record<string, number> | null
}

type Msg = { icon: string; text: string; short?: string; accent: string }

// Real availability for the 24th / 31st — urgency only when it's true
function cuposMessages(cupos: Record<string, number> | null | undefined): Msg[] {
  if (!cupos || Object.keys(cupos).length === 0) {
    return [{ icon: "✂️", text: "YA PUEDES RESERVAR PARA EL 24 Y EL 31", short: "RESERVA TU 24 Y 31", accent: "Agenda online" }]
  }
  return Object.entries(cupos).sort(([a], [b]) => a.localeCompare(b)).map(([date, n]) => {
    const day = Number(date.slice(8, 10))
    if (n === 0) {
      return { icon: "🔥", text: `EL ${day} DE DICIEMBRE ESTÁ AGOTADO`, short: `${day} DIC AGOTADO`, accent: "Reserva otro día" }
    }
    const qty = n === 1 ? "QUEDA 1 CUPO" : `QUEDAN ${n} CUPOS`
    return { icon: "✂️", text: `${qty} PARA EL ${day} DE DICIEMBRE`, short: `${qty} EL ${day}`, accent: "¡Reserva ya!" }
  })
}

export default function NavidadBanner({ newYear = false, cupos }: NavidadBannerProps) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [fading, setFading] = useState(false)

  const year = upcomingYear()
  const days = daysUntilNewYear()

  // short = versión para móvil, donde el texto largo no cabe en el banner
  const messages: Msg[] = newYear
    ? [
        { icon: "🎆", text: `¡FELIZ ${year}!`, accent: "Arranca el año con buen corte" },
        { icon: "✂️", text: "AGENDA YA TU PRIMER CORTE DEL AÑO", short: "TU PRIMER CORTE DEL AÑO", accent: "Sin esperas" },
      ]
    : [
        { icon: "🎄", text: "FELIZ NAVIDAD", accent: "Estrena look estas fiestas" },
        ...cuposMessages(cupos),
        {
          icon: "🥂",
          text: days === 1 ? `FALTA 1 DÍA PARA EL ${year}` : `FALTAN ${days} DÍAS PARA EL ${year}`,
          accent: "Recíbelo bien motilado",
        },
      ]

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setMsgIndex((i) => i + 1)
        setFading(false)
      }, 400)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const msg = messages[msgIndex % messages.length]

  return (
    <>
      <style>{`
        @keyframes nv-banner-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes nv-banner-sway {
          0%, 100% { transform: rotate(-6deg); }
          50%       { transform: rotate(6deg); }
        }
        .nv-banner-gold {
          background: linear-gradient(90deg,
            #c8860a, #f5c842, #fff6d6, #ffffff,
            #f5c842, #fca5a5, #f5c842, #c8860a);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: nv-banner-shimmer 5s linear infinite;
        }
        .nv-sway { animation: nv-banner-sway 2.2s ease-in-out infinite; display: inline-block; }
      `}</style>

      <div
        className="fixed top-0 left-0 right-0 z-[300] h-8 flex items-center justify-center overflow-hidden select-none"
        style={{
          background:
            "linear-gradient(90deg, #031a10 0%, #0b3d24 22%, #5c0a14 50%, #0b3d24 78%, #031a10 100%)",
          borderBottom: "1px solid rgba(245,200,66,0.3)",
        }}
      >
        {/* Gold shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(245,200,66,0.14) 50%, transparent 65%)",
            backgroundSize: "300% 100%",
            animation: "nv-banner-shimmer 3.5s linear infinite",
          }}
        />
        <p
          className="relative text-[10px] sm:text-[11px] font-black tracking-[0.13em] flex items-center gap-2 whitespace-nowrap transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <span className="nv-sway">{msg.icon}</span>
          <span className="nv-banner-gold sm:hidden">{msg.short ?? msg.text}</span>
          <span className="nv-banner-gold hidden sm:inline">{msg.text}</span>
          <span className="hidden sm:inline" style={{ color: "#fde68a", opacity: 0.85 }}>· {msg.accent}</span>
        </p>
      </div>
    </>
  )
}
