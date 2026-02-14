"use client"

import { useEffect, useState } from "react"

type Appointment = {
  id: string
  date: string
  status: string
  bookedBy: string
  notes: string | null
  user: { name: string | null; phone: string | null }
  service: { name: string; price: number; duration: number }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completada", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  NO_SHOW: { label: "No asistió", color: "bg-gray-100 text-gray-700" },
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  // New appointment form
  const [services, setServices] = useState<any[]>([])
  const [newApt, setNewApt] = useState({
    clientName: "",
    phone: "",
    serviceId: "",
    time: "",
    notes: "",
  })

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, filter])

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate })
    if (filter !== "all") params.set("status", filter)
    const res = await fetch(`/api/appointments?${params}`)
    const data = await res.json()
    setAppointments(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    fetchAppointments()
  }

  const createAppointment = async () => {
    if (!newApt.clientName || !newApt.phone || !newApt.serviceId || !newApt.time) return

    const dateTimeStr = `${selectedDate}T${newApt.time}:00`

    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: newApt.clientName,
        phone: newApt.phone,
        serviceId: newApt.serviceId,
        date: dateTimeStr,
        bookedBy: "BARBER",
        notes: newApt.notes,
      }),
    })

    setNewApt({ clientName: "", phone: "", serviceId: "", time: "", notes: "" })
    setShowNewForm(false)
    fetchAppointments()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Citas</h1>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-[#c9a96e] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#b8944f] transition text-sm"
        >
          + Nueva Cita
        </button>
      </div>

      {/* New appointment form */}
      {showNewForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold mb-4">Agendar cita manual</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={newApt.clientName}
              onChange={(e) => setNewApt({ ...newApt, clientName: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="WhatsApp (+52...)"
              value={newApt.phone}
              onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <select
              value={newApt.serviceId}
              onChange={(e) => setNewApt({ ...newApt, serviceId: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            >
              <option value="">Seleccionar servicio</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration} min - ${s.price})
                </option>
              ))}
            </select>
            <input
              type="time"
              value={newApt.time}
              onChange={(e) => setNewApt({ ...newApt, time: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={newApt.notes}
              onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={createAppointment}
              className="px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-sm hover:bg-[#16213e] transition"
            >
              Agendar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "Todas" },
            { value: "CONFIRMED", label: "Confirmadas" },
            { value: "PENDING", label: "Pendientes" },
            { value: "COMPLETED", label: "Completadas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filter === f.value
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment list */}
      {loading ? (
        <p className="text-gray-400 text-center py-8">Cargando...</p>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-400">No hay citas para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#c9a96e]/10 rounded-full flex items-center justify-center text-lg font-bold text-[#c9a96e]">
                    {(apt.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{apt.user?.name || "Cliente"}</p>
                    <p className="text-sm text-gray-500">{apt.service.name}</p>
                    <p className="text-xs text-gray-400">
                      {apt.user?.phone} · {apt.bookedBy === "BARBER" ? "Agendado por ti" : "Reserva online"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {new Date(apt.date).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${STATUS_MAP[apt.status]?.color}`}
                  >
                    {STATUS_MAP[apt.status]?.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {apt.status === "PENDING" && (
                    <button
                      onClick={() => updateStatus(apt.id, "CONFIRMED")}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    >
                      Confirmar
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(apt.id, "COMPLETED")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                  >
                    Completar
                  </button>
                  <button
                    onClick={() => updateStatus(apt.id, "NO_SHOW")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                  >
                    No asistió
                  </button>
                  <button
                    onClick={() => updateStatus(apt.id, "CANCELLED")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
