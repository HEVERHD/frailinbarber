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
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  if (!loaded) return null

  const active = appointments.find((a) => isActive(a, now))
  const waiting = appointments.filter(
    (a) => !isActive(a, now) && a.status !== "COMPLETED" && new Date(a.date) > now
  )
  const totalInQueue = (active ? 1 : 0) + waiting.length

  if (totalInQueue === 0) return null

  return (
    <Link
      href="/cola"
      className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 hover:bg-white/10 hover:border-[#e84118]/30 transition-all group"
    >
      {/* Indicador en vivo */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e84118] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e84118]" />
      </span>

      <div className="text-left">
        {active ? (
          <>
            <p className="text-white text-sm font-semibold leading-tight">
              Peluqueando a {active.clientName}
            </p>
            <p className="text-white/40 text-xs">
              {waiting.length > 0
                ? `${waiting.length} ${waiting.length === 1 ? "persona" : "personas"} en cola`
                : "Sin más en cola"}
            </p>
          </>
        ) : (
          <>
            <p className="text-white text-sm font-semibold leading-tight">
              {waiting.length} {waiting.length === 1 ? "persona" : "personas"} en cola
            </p>
            <p className="text-white/40 text-xs">Sin servicio en curso</p>
          </>
        )}
      </div>

      <svg
        className="w-4 h-4 text-white/30 group-hover:text-[#e84118] transition ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
