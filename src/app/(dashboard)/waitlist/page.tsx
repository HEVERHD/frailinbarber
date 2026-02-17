"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"
import { Phone, Check, X } from "lucide-react"

type WaitlistEntry = {
  id: string
  date: string
  name: string
  phone: string
  status: "WAITING" | "NOTIFIED" | "BOOKED" | "EXPIRED"
  notified: boolean
  createdAt: string
  service: {
    id: string
    name: string
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  WAITING: { label: "Esperando", color: "bg-yellow-100 text-yellow-700" },
  NOTIFIED: { label: "Notificado", color: "bg-blue-100 text-blue-700" },
  BOOKED: { label: "Agendado", color: "bg-green-100 text-green-700" },
  EXPIRED: { label: "Expirado", color: "bg-gray-100 text-gray-500" },
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const res = await fetch("/api/waitlist")
    const data = await res.json()
    setEntries(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    toast(status === "BOOKED" ? "Marcado como agendado" : status === "EXPIRED" ? "Marcado como expirado" : "Notificado")
    fetchEntries()
  }

  const filtered = filterStatus === "all" ? entries : entries.filter((e) => e.status === filterStatus)

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-")
    return new Date(+y, +m - 1, +d).toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Lista de Espera</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#1a0a0a] border border-[#3d2020] text-white text-sm rounded-xl px-3 py-2 focus:border-[#e84118] focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="WAITING">Esperando</option>
          <option value="NOTIFIED">Notificados</option>
          <option value="BOOKED">Agendados</option>
          <option value="EXPIRED">Expirados</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020] animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-[#3d2020] rounded" />
                <div className="h-4 w-20 bg-[#3d2020] rounded" />
              </div>
              <div className="h-3 w-48 bg-[#3d2020] rounded mt-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-lg mb-2">Sin entradas</p>
          <p className="text-sm">Cuando un cliente se una a la lista de espera, aparecerá aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const statusInfo = STATUS_LABELS[entry.status]
            return (
              <div
                key={entry.id}
                className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{entry.name}</p>
                    <p className="text-sm text-white/40 mt-1">
                      {entry.service.name} · {formatDate(entry.date)}
                    </p>
                    <a
                      href={`https://wa.me/${entry.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#e84118] hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <Phone size={12} />
                      {entry.phone}
                    </a>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {entry.status === "WAITING" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => updateStatus(entry.id, "NOTIFIED")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                    >
                      <Phone size={12} />
                      Notificar
                    </button>
                    <button
                      onClick={() => updateStatus(entry.id, "BOOKED")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                    >
                      <Check size={12} />
                      Agendado
                    </button>
                    <button
                      onClick={() => updateStatus(entry.id, "EXPIRED")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition"
                    >
                      <X size={12} />
                      Expirar
                    </button>
                  </div>
                )}

                {entry.status === "NOTIFIED" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => updateStatus(entry.id, "BOOKED")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                    >
                      <Check size={12} />
                      Agendado
                    </button>
                    <button
                      onClick={() => updateStatus(entry.id, "EXPIRED")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition"
                    >
                      <X size={12} />
                      Expirar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
