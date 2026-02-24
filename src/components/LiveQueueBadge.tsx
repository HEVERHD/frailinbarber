"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

const COL_TZ = "America/Bogota"

type Apt = {
  id: string
  clientName: string
  serviceName: string
  duration: number
  date: string
  status: string
}

function aptEndTime(apt: Apt): Date {
  return new Date(new Date(apt.date).getTime() + apt.duration * 60000)
}

function isActive(apt: Apt, now: Date): boolean {
  return (
    now >= new Date(apt.date) &&
    now < aptEndTime(apt) &&
    (apt.status === "CONFIRMED" || apt.status === "PENDING")
  )
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: COL_TZ,
  })
}

export default function LiveQueueBadge() {
  const [now, setNow] = useState(new Date())
  const [appointments, setAppointments] = useState<Apt[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/cola")
      if (!res.ok) return
      const json = await res.json()
      setAppointments(json.appointments ?? [])
      setLoaded(true)
    } catch {}
  }, [])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!loaded) return null

  const active = appointments.find((a) => isActive(a, now))
  const waiting = appointments.filter(
    (a) =>
      !isActive(a, now) &&
      (a.status === "CONFIRMED" || a.status === "PENDING") &&
      new Date(a.date) > now
  )

  if (!active && waiting.length === 0) return null

  // Minutos hasta el próximo turno (solo cuando el barbero está libre)
  const nextApt = waiting[0]
  const minsToNext = nextApt
    ? Math.ceil((new Date(nextApt.date).getTime() - now.getTime()) / 60000)
    : null
  const almostBusy = !active && minsToNext !== null && minsToNext <= 10

  // Progress for active service
  const progress = active
    ? Math.min(100, ((now.getTime() - new Date(active.date).getTime()) / (active.duration * 60000)) * 100)
    : 0
  const remaining = active
    ? Math.max(0, Math.ceil((aptEndTime(active).getTime() - now.getTime()) / 60000))
    : 0

  return (
    <Link
      href="/booking"
      className={`inline-block text-left w-full max-w-xs rounded-2xl overflow-hidden transition-all group ${
        almostBusy
          ? "bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/15 hover:border-amber-500/60"
          : "bg-white/5 border border-white/10 hover:border-[#e84118]/30 hover:bg-white/8"
      }`}
    >
      {/* Estado principal */}
      {active ? (
        <div className="border-b border-white/5">
          {/* Header row */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e84118] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e84118]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">
                Peluqueando a {active.clientName}
              </p>
              <p className="text-white/40 text-xs truncate">{active.serviceName}</p>
            </div>
            <span className="text-[#e84118] text-xs font-bold flex-shrink-0 tabular-nums">
              {remaining} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #c0392b, #e84118, #ff6b35)",
                  boxShadow: "0 0 10px rgba(232,65,24,0.7)",
                  transition: "width 2s ease",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-white/25">{formatTime(active.date)}</span>
              <span className="text-[9px] text-white/25 tabular-nums">{Math.round(progress)}%</span>
              <span className="text-[9px] text-white/25">{formatTime(aptEndTime(active).toISOString())}</span>
            </div>
          </div>
        </div>
      ) : almostBusy ? (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-500/20">
          <span className="text-lg flex-shrink-0">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-sm font-bold leading-tight">
              ¡Agenda ya! Se ocupa en {minsToNext} min
            </p>
            <p className="text-amber-400/60 text-xs">Última oportunidad disponible</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <p className="text-white text-sm font-semibold">💈 Barbero disponible ahora</p>
        </div>
      )}

      {/* Cola de espera */}
      {waiting.length > 0 && (
        <div className="px-4 py-2 space-y-1.5">
          {waiting.slice(0, 3).map((apt, i) => (
            <div key={apt.id} className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-bold flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-white/60 text-xs flex-1 truncate">{apt.clientName}</p>
              <p className="text-white/30 text-xs flex-shrink-0">{formatTime(apt.date)}</p>
            </div>
          ))}
          {waiting.length > 3 && (
            <p className="text-white/25 text-xs text-center pt-0.5">
              +{waiting.length - 3} más en cola
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`px-4 py-2 border-t flex items-center justify-between ${almostBusy ? "border-amber-500/20" : "border-white/5"}`}>
        <p className={`text-[10px] ${almostBusy ? "text-amber-400/50" : "text-white/20"}`}>
          {almostBusy ? "Toca para agendar ahora →" : "Cola en vivo · actualiza cada 30s"}
        </p>
        <svg
          className={`w-3 h-3 transition ${almostBusy ? "text-amber-400/60 group-hover:text-amber-300" : "text-white/20 group-hover:text-[#e84118]"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
