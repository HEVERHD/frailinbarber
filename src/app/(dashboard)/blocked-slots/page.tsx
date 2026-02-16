"use client"

import { useEffect, useState } from "react"
import { to12Hour } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"

type BlockedSlot = {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string | null
  allDay: boolean
  createdAt: string
}

export default function BlockedSlotsPage() {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    reason: "",
    allDay: false,
  })

  useEffect(() => {
    fetchBlocked()
  }, [])

  const fetchBlocked = async () => {
    setLoading(true)
    const res = await fetch("/api/blocked-slots")
    const data = await res.json()
    setBlockedSlots(data)
    setLoading(false)
  }

  const createBlock = async () => {
    if (!form.date) return
    if (!form.allDay && (!form.startTime || !form.endTime)) return
    if (!form.allDay && form.startTime >= form.endTime) {
      alert("La hora de inicio debe ser antes de la hora de fin")
      return
    }

    await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setForm({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      reason: "",
      allDay: false,
    })
    setShowForm(false)
    fetchBlocked()
  }

  const deleteBlock = async (id: string) => {
    await fetch(`/api/blocked-slots?id=${id}`, { method: "DELETE" })
    fetchBlocked()
  }

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("es-CO", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bloqueo de Horarios</h1>
          <p className="text-sm text-white/40 mt-1">
            Bloquea días u horas para que no estén disponibles en el booking
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#e84118] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#c0392b] transition text-sm"
        >
          + Nuevo Bloqueo
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020] mb-6">
          <h3 className="font-semibold mb-4 text-white">Crear bloqueo</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                  className="w-4 h-4 accent-[#e84118]"
                />
                <span className="text-sm text-white">Todo el día</span>
              </label>
            </div>
            {!form.allDay && (
              <>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Hora inicio</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Hora fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Razón (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Día libre, almuerzo, cita personal..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-[#3d2020] text-sm hover:bg-[#1a0a0a] transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={createBlock}
              className="px-4 py-2 rounded-xl bg-[#e84118] text-white text-sm hover:bg-[#c0392b] transition"
            >
              Bloquear
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <Loader />
      ) : blockedSlots.length === 0 ? (
        <div className="text-center py-12 bg-[#2d1515] rounded-xl border border-[#3d2020]">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-white/30">No hay horarios bloqueados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center text-lg">
                  🚫
                </div>
                <div>
                  <p className="font-medium text-white">{formatDate(slot.date)}</p>
                  <p className="text-sm text-white/40">
                    {slot.allDay
                      ? "Todo el día"
                      : `${to12Hour(slot.startTime)} - ${to12Hour(slot.endTime)}`}
                    {slot.reason && ` · ${slot.reason}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteBlock(slot.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
