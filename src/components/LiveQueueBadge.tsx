"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

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
  // Solo citas futuras (no pasadas, no completadas)
  const upcoming = appointments.filter(
    (a) => !isActive(a, now) && a.status !== "COMPLETED" && new Date(a.date) > now
  )

  // No mostrar nada si no hay actividad ni citas futuras
  if (!active && upcoming.length === 0) return null

  const busy = !!active

  return (
    <Link
      href="/cola"
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 border transition-all hover:scale-105 ${
        busy
          ? "bg-[#e84118]/10 border-[#e84118]/30 hover:bg-[#e84118]/20"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      {/* Dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            busy ? "bg-[#e84118]" : "bg-emerald-400"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            busy ? "bg-[#e84118]" : "bg-emerald-400"
          }`}
        />
      </span>

      <span className={`text-sm font-medium ${busy ? "text-white" : "text-white/80"}`}>
        {busy ? `Peluqueando a ${active!.clientName}` : "Barbero disponible ahora"}
      </span>
    </Link>
  )
}
