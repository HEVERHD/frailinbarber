"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Clock, Star, CalendarDays } from "lucide-react"
import { useSeason } from "@/lib/season"

type SeasonStats = {
  monthLabel: string
  prevMonthLabel: string
  monthCount: number
  prevCount: number
  trend: number | null
  peakHours: { label: string; count: number }[]
  starService: { name: string; count: number } | null
  hotDays: { date: string; booked: number; free: number; past: boolean }[]
}

// Resumen de temporada para el dashboard — solo en Navidad / Año Nuevo
export default function SeasonSummary() {
  // Follows the theme chosen in Ajustes (or ?tema= preview), like the rest of the panel
  const season = useSeason()
  const active = season === "navidad" || season === "anoNuevo"
  const [data, setData] = useState<SeasonStats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!active) return
    fetch("/api/stats/season")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true))
  }, [active])

  if (!active || failed) return null

  if (!data) {
    return <div className="h-40 rounded-2xl bg-[#111] border border-white/8 animate-pulse mb-6" />
  }

  const up = (data.trend ?? 0) > 0
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F5C842]/25 bg-gradient-to-br from-[#14532d]/30 via-[#111] to-[#7f1d1d]/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-bold text-white">{season === "navidad" ? "🎄 Temporada navideña" : "🎆 Arranque de año"}</p>
          <p className="text-xs text-white/40 mt-0.5">Citas agendadas (incluye futuras), sin canceladas</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mes vs mes anterior */}
        <div className="rounded-xl bg-black/30 border border-white/8 p-4">
          <p className="text-xs text-white/50 mb-1 capitalize">Citas de {data.monthLabel}</p>
          <p className="text-3xl font-black text-white leading-none mb-2">{data.monthCount}</p>
          <p className="text-xs text-white/40 mb-1 capitalize">{data.prevMonthLabel}: {data.prevCount}</p>
          {data.trend === null ? (
            <span className="text-xs text-white/30">sin datos del mes anterior</span>
          ) : data.trend === 0 ? (
            <span className="flex items-center gap-1 text-xs text-white/50"><Minus size={11} /> igual</span>
          ) : (
            <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {up ? "+" : ""}{data.trend}%
            </span>
          )}
        </div>

        {/* Días fuertes */}
        {data.hotDays.map((d) => (
          <div key={d.date} className="rounded-xl bg-black/30 border border-white/8 p-4">
            <p className="text-xs text-white/50 mb-1 flex items-center gap-1.5">
              <CalendarDays size={12} /> {Number(d.date.slice(8, 10))} de diciembre
            </p>
            <p className="text-3xl font-black text-white leading-none mb-2">{d.booked}</p>
            <p className="text-xs text-white/40">agendadas</p>
            {!d.past && (
              <p className={`text-xs font-semibold mt-1 ${d.free === 0 ? "text-red-400" : d.free <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
                {d.free === 0 ? "Agotado" : `${d.free} cupos libres`}
              </p>
            )}
          </div>
        ))}

        {/* Horas pico + servicio estrella */}
        <div className="rounded-xl bg-black/30 border border-white/8 p-4">
          <p className="text-xs text-white/50 mb-2 flex items-center gap-1.5"><Clock size={12} /> Horas pico</p>
          {data.peakHours.length === 0 ? (
            <p className="text-xs text-white/30">Aún sin citas este mes</p>
          ) : (
            <div className="space-y-1 mb-3">
              {data.peakHours.map((h) => (
                <p key={h.label} className="text-sm text-white flex justify-between">
                  <span className="font-semibold">{h.label}</span>
                  <span className="text-white/40">{h.count} citas</span>
                </p>
              ))}
            </div>
          )}
          {data.starService && (
            <p className="text-xs text-white/50 flex items-center gap-1.5 pt-2 border-t border-white/8">
              <Star size={12} className="text-[#F5C842]" />
              <span className="text-white font-semibold truncate">{data.starService.name}</span>
              <span className="text-white/40">· {data.starService.count}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
