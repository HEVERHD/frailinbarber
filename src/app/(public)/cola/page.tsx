"use client"

import { useEffect, useState, useCallback } from "react"

const COL_TZ = "America/Bogota"

type Apt = {
  id: string
  clientName: string
  serviceName: string
  duration: number
  date: string
  status: string
}

type QueueData = {
  shopName: string
  appointments: Apt[]
  updatedAt: string
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: COL_TZ,
  })
}

function aptEndTime(apt: Apt): Date {
  return new Date(new Date(apt.date).getTime() + apt.duration * 60000)
}

function getProgress(apt: Apt, now: Date): number {
  const elapsed = now.getTime() - new Date(apt.date).getTime()
  return Math.min(100, Math.max(0, (elapsed / (apt.duration * 60000)) * 100))
}

function getRemainingMin(apt: Apt, now: Date): number {
  return Math.max(0, Math.ceil((aptEndTime(apt).getTime() - now.getTime()) / 60000))
}

function isActive(apt: Apt, now: Date): boolean {
  return (
    now >= new Date(apt.date) &&
    now < aptEndTime(apt) &&
    (apt.status === "CONFIRMED" || apt.status === "PENDING")
  )
}

export default function ColaPage() {
  const [data, setData] = useState<QueueData | null>(null)
  const [now, setNow] = useState(new Date())
  const [lastFetch, setLastFetch] = useState(0)
  const [error, setError] = useState(false)

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/cola")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
      setLastFetch(Date.now())
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  // Initial fetch + refresh every 30s
  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  // Update clock every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const secondsAgo = Math.floor((Date.now() - lastFetch) / 1000)

  const active = data?.appointments.find((a) => isActive(a, now))
  const upcoming = data?.appointments.filter(
    (a) => !isActive(a, now) && a.status !== "COMPLETED" && new Date(a.date) > now
  ) ?? []
  const totalPosition = data?.appointments.filter(
    (a) => a.status !== "COMPLETED"
  ) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2d1515] px-4 py-8">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💈</div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-[#e84118]">Frailin</span> Studio
          </h1>
          <p className="text-white/40 text-sm mt-1">Cola en vivo</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center text-red-400 text-sm mb-6">
            No se pudo cargar la cola. Intenta recargar.
          </div>
        )}

        {data && (
          <>
            {/* En silla ahora */}
            <div className="mb-6">
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2 text-center">
                En silla ahora
              </p>
              {active ? (
                <div className="bg-[#2d1515] border border-[#e84118]/50 rounded-2xl p-5 shadow-lg shadow-[#e84118]/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold text-lg">{active.clientName}</p>
                      <p className="text-white/50 text-sm">{active.serviceName}</p>
                    </div>
                    <span className="bg-[#e84118]/20 text-[#e84118] text-xs px-2 py-1 rounded-full font-medium">
                      En curso
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#e84118] rounded-full transition-all duration-1000"
                      style={{ width: `${getProgress(active, now)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/30">
                    <span>{formatTime(active.date)}</span>
                    <span className="text-[#e84118] font-medium">
                      {getRemainingMin(active, now)} min restantes
                    </span>
                    <span>{formatTime(aptEndTime(active).toISOString())}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2d1515] border border-[#3d2020] rounded-2xl p-5 text-center">
                  <p className="text-white/30 text-sm">Ningún servicio en curso</p>
                </div>
              )}
            </div>

            {/* Cola de espera */}
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2 text-center">
                Cola de espera
              </p>

              {upcoming.length === 0 ? (
                <div className="bg-[#2d1515] border border-[#3d2020] rounded-2xl p-5 text-center">
                  <p className="text-white/30 text-sm">No hay más citas por hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((apt, i) => {
                    const position = totalPosition.findIndex((a) => a.id === apt.id) + 1
                    const waitMin = active
                      ? getRemainingMin(active, now) + upcoming.slice(0, i).reduce((acc, a) => acc + a.duration, 0)
                      : upcoming.slice(0, i).reduce((acc, a) => acc + a.duration, 0)

                    return (
                      <div
                        key={apt.id}
                        className="bg-[#2d1515] border border-[#3d2020] rounded-xl p-4 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#3d2020] flex items-center justify-center flex-shrink-0">
                          <span className="text-white/60 text-xs font-bold">{position}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{apt.clientName}</p>
                          <p className="text-white/40 text-xs truncate">{apt.serviceName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white/70 text-xs font-medium">{formatTime(apt.date)}</p>
                          {i === 0 && (
                            <p className="text-[#e84118] text-[10px]">
                              ~{waitMin} min
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Completadas hoy */}
            {data.appointments.filter((a) => a.status === "COMPLETED").length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-white/20 text-xs">
                  {data.appointments.filter((a) => a.status === "COMPLETED").length} servicio(s) completado(s) hoy
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/20 text-[10px]">
            Actualizado hace {secondsAgo}s
          </p>
          <button
            onClick={fetchQueue}
            className="mt-2 text-white/30 text-[10px] hover:text-white/60 transition"
          >
            ↻ Actualizar ahora
          </button>
        </div>

      </div>
    </div>
  )
}
