"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/toast"
import { to12Hour, hourTo12 } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"

type Appointment = {
  id: string
  date: string
  status: string
  bookedBy: string
  notes: string | null
  user: { name: string | null; phone: string | null }
  service: { name: string; price: number; duration: number }
  barber?: { id: string; name: string | null }
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: "Pendiente", color: "bg-yellow-900/50 text-yellow-400", dot: "bg-yellow-400" },
  CONFIRMED: { label: "Confirmada", color: "bg-blue-900/50 text-blue-400", dot: "bg-blue-400" },
  COMPLETED: { label: "Completada", color: "bg-green-900/50 text-green-400", dot: "bg-green-400" },
  CANCELLED: { label: "Cancelada", color: "bg-red-900/50 text-red-400", dot: "bg-red-400" },
  NO_SHOW: { label: "No asistio", color: "bg-[#3d2020] text-white/60", dot: "bg-white/40" },
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 - 19:00

const COL_TZ = "America/Bogota"

function colombiaDateStr(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: COL_TZ })
}

function colombiaHour(date: Date): number {
  return parseInt(date.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: COL_TZ }))
}

function getWeekDays(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00")
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((day + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: colombiaDateStr(d),
      dayName: DAYS_ES[d.getDay()],
      dayNum: d.getDate(),
      isToday: colombiaDateStr(d) === colombiaDateStr(new Date()),
    }
  })
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(() => colombiaDateStr(new Date()))
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [view, setView] = useState<"list" | "week">("week")

  const [services, setServices] = useState<any[]>([])
  const [businessHours, setBusinessHours] = useState({ openTime: "09:00", closeTime: "19:00" })
  const [newApt, setNewApt] = useState({
    clientName: "",
    phone: "",
    serviceId: "",
    time: "",
    notes: "",
  })
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)
  const [clientResults, setClientResults] = useState<any[]>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dayOff, setDayOff] = useState(false)
  const [barbers, setBarbers] = useState<any[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState("")
  const { toast } = useToast()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || "BARBER"
  const userId = (session?.user as any)?.id || ""

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

  // Appointments for the selected day (used in mobile day timeline + list view)
  const dayAppointments = useMemo(() => {
    return weekAppointments
      .filter((apt) => {
        const aptDate = colombiaDateStr(new Date(apt.date))
        return aptDate === selectedDate && apt.status !== "CANCELLED"
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [weekAppointments, selectedDate])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, filter])

  useEffect(() => {
    fetchWeekAppointments()
  }, [weekDays])

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.openTime && data?.closeTime) {
          setBusinessHours({ openTime: data.openTime, closeTime: data.closeTime })
        }
      })
    // Fetch barbers list for ADMIN barber selector
    if (role === "ADMIN") {
      fetch("/api/barbers")
        .then((r) => r.json())
        .then(setBarbers)
    }
  }, [role])

  // Set default barberId for manual form
  useEffect(() => {
    if (userId && !selectedBarberId) {
      setSelectedBarberId(userId)
    }
  }, [userId, selectedBarberId])

  // Fetch available slots when date or service changes
  const fetchSlots = async () => {
    if (!newApt.serviceId || !selectedBarberId) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/appointments/slots?date=${selectedDate}&serviceId=${newApt.serviceId}&barberId=${selectedBarberId}`)
      const data = await res.json()
      const allSlots: { time: string; available: boolean }[] = data.slots || []
      setSlots(allSlots.filter((s) => s.available).map((s) => s.time))
      setDayOff(data.dayOff || false)
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (showNewForm) {
      setNewApt((prev) => ({ ...prev, time: "" }))
      fetchSlots()
    }
  }, [selectedDate, newApt.serviceId, showNewForm, selectedBarberId])

  // Search clients as user types
  useEffect(() => {
    if (newApt.clientName.length >= 2) {
      fetch(`/api/clients?search=${encodeURIComponent(newApt.clientName)}`)
        .then((r) => r.json())
        .then((data) => {
          setClientResults(data)
          setShowClientDropdown(data.length > 0)
        })
    } else {
      setClientResults([])
      setShowClientDropdown(false)
    }
  }, [newApt.clientName])

  const fetchAppointments = async () => {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate })
    if (filter !== "all") params.set("status", filter)
    const res = await fetch(`/api/appointments?${params}`)
    const data = await res.json()
    setAppointments(data)
    setLoading(false)
  }

  const fetchWeekAppointments = async () => {
    const startDate = weekDays[0].date
    const endDate = weekDays[6].date
    const res = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`)
    const data = await res.json()
    setWeekAppointments(Array.isArray(data) ? data : [])
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    const labels: Record<string, string> = {
      CONFIRMED: "Cita confirmada",
      COMPLETED: "Cita completada",
      CANCELLED: "Cita cancelada",
      NO_SHOW: "Marcada como no-show",
    }
    toast(labels[status] || "Estado actualizado")
    fetchAppointments()
    fetchWeekAppointments()
  }

  const createAppointment = async () => {
    if (!newApt.clientName || !newApt.phone || !newApt.serviceId || !newApt.time) {
      setFormError("Completa todos los campos obligatorios")
      return
    }
    setFormError("")
    setCreating(true)

    const dateTimeStr = `${selectedDate}T${newApt.time}:00`

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: newApt.clientName,
          phone: newApt.phone,
          serviceId: newApt.serviceId,
          barberId: selectedBarberId,
          date: dateTimeStr,
          bookedBy: "BARBER",
          notes: newApt.notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || "Error al crear la cita")
        return
      }

      setNewApt({ clientName: "", phone: "", serviceId: "", time: "", notes: "" })
      setShowNewForm(false)
      setSlots([])
      toast("Cita creada exitosamente ✓")
      fetchAppointments()
      fetchWeekAppointments()
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.")
    } finally {
      setCreating(false)
    }
  }

  const navigateWeek = (direction: number) => {
    const current = new Date(selectedDate + "T12:00:00")
    current.setDate(current.getDate() + direction * 7)
    setSelectedDate(current.toISOString().split("T")[0])
  }

  const navigateDay = (direction: number) => {
    const current = new Date(selectedDate + "T12:00:00")
    current.setDate(current.getDate() + direction)
    setSelectedDate(current.toISOString().split("T")[0])
  }

  const goToToday = () => {
    setSelectedDate(colombiaDateStr(new Date()))
  }

  const getAppointmentsForDayHour = (dayDate: string, hour: number) => {
    return weekAppointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      return (
        colombiaDateStr(aptDate) === dayDate &&
        colombiaHour(aptDate) === hour &&
        apt.status !== "CANCELLED"
      )
    })
  }

  // Count appointments per day for the week strip badges
  const getDayCount = (dayDate: string) => {
    return weekAppointments.filter((apt) => {
      const aptDateStr = colombiaDateStr(new Date(apt.date))
      return aptDateStr === dayDate && apt.status !== "CANCELLED"
    }).length
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Citas</h1>
        <div className="flex gap-2">
          <div className="hidden sm:flex bg-[#1a0a0a] rounded-xl p-1 border border-[#3d2020]">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                view === "week" ? "bg-[#e84118] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                view === "list" ? "bg-[#e84118] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-[#e84118] text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-[#c0392b] transition text-sm"
          >
            + Nueva
          </button>
        </div>
      </div>

      {/* New appointment form */}
      {showNewForm && (
        <div className="bg-[#2d1515] rounded-xl p-4 sm:p-6 border border-[#3d2020] mb-4">
          <h3 className="font-semibold mb-3 text-white text-sm">Agendar cita manual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={newApt.clientName}
                onChange={(e) => setNewApt({ ...newApt, clientName: e.target.value })}
                onFocus={() => clientResults.length > 0 && setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
              />
              {showClientDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#2d1515] border border-[#3d2020] rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                  {clientResults.map((c: any) => (
                    <button
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNewApt({ ...newApt, clientName: c.name || "", phone: c.phone || "" })
                        setShowClientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#3d2020] transition border-b border-[#3d2020] last:border-0"
                    >
                      <p className="text-sm font-medium text-white">{c.name || "Sin nombre"}</p>
                      <p className="text-xs text-white/40">{c.phone || c.email || "Sin contacto"}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="tel"
              placeholder="WhatsApp (+57...)"
              value={newApt.phone}
              onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
            />
            <select
              value={newApt.serviceId}
              onChange={(e) => setNewApt({ ...newApt, serviceId: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white text-sm"
            >
              <option value="">Seleccionar servicio</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration}min)
                </option>
              ))}
            </select>
            {role === "ADMIN" && barbers.length > 1 && (
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white text-sm"
              >
                {barbers.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name || "Barbero"}
                  </option>
                ))}
              </select>
            )}
            <div className="sm:col-span-2">
              <label className="text-[10px] text-white/50 mb-2 block">
                Hora disponible {newApt.time && `— ${to12Hour(newApt.time)}`}
              </label>
              {!newApt.serviceId ? (
                <p className="text-white/30 text-xs py-2">Selecciona un servicio primero</p>
              ) : loadingSlots ? (
                <div className="py-3"><Loader /></div>
              ) : dayOff ? (
                <p className="text-yellow-400 text-xs py-2">Este día no hay servicio</p>
              ) : slots.length === 0 ? (
                <p className="text-red-400 text-xs py-2">No hay horarios disponibles</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setNewApt({ ...newApt, time: slot })}
                      className={`py-2 rounded-xl border text-xs font-medium transition ${
                        newApt.time === slot
                          ? "border-[#e84118] bg-[#e84118] text-white"
                          : "border-[#3d2020] text-white/70 hover:border-[#e84118] hover:text-white"
                      }`}
                    >
                      {to12Hour(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={newApt.notes}
              onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 sm:col-span-2 text-sm"
            />
          </div>
          {formError && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-xs">
              {formError}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowNewForm(false); setFormError("") }}
              className="px-4 py-2 rounded-xl border border-[#3d2020] text-sm hover:bg-[#1a0a0a] transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={createAppointment}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-[#e84118] text-white text-sm hover:bg-[#c0392b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Agendando..." : "Agendar"}
            </button>
          </div>
        </div>
      )}

      {/* ============ MOBILE: Day strip + timeline ============ */}
      <div className="sm:hidden">
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-white/60 text-sm"
          >
            &larr;
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-xs text-white/60"
          >
            Hoy
          </button>
          <p className="text-xs text-white/40">
            {new Date(weekDays[0].date + "T12:00:00").toLocaleDateString("es-CO", { month: "short", year: "numeric" })}
          </p>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-white/60 text-sm"
          >
            &rarr;
          </button>
        </div>

        {/* Horizontal day strip */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {weekDays.map((day) => {
            const count = getDayCount(day.date)
            const isSelected = day.date === selectedDate
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`flex-1 min-w-[46px] flex flex-col items-center py-2 px-1 rounded-xl transition relative ${
                  isSelected
                    ? "bg-[#e84118] text-white"
                    : day.isToday
                    ? "bg-[#e84118]/20 text-[#e84118] border border-[#e84118]/40"
                    : "bg-[#1a0a0a] text-white/60 border border-[#3d2020]"
                }`}
              >
                <span className="text-[10px] uppercase">{day.dayName}</span>
                <span className="text-lg font-bold leading-tight">{day.dayNum}</span>
                {count > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? "bg-white" : "bg-[#e84118]"
                  }`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Day timeline */}
        <div className="space-y-2">
          {dayAppointments.length === 0 ? (
            <div className="text-center py-10 bg-[#2d1515] rounded-xl border border-[#3d2020]">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-white/30 text-sm">Sin citas para este dia</p>
            </div>
          ) : (
            dayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-[#2d1515] rounded-xl p-3 border border-[#3d2020]"
              >
                <div className="flex items-center gap-3">
                  {/* Time column */}
                  <div className="text-center min-w-[48px]">
                    <p className="text-sm font-bold text-white">
                      {new Date(apt.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                    <p className="text-[10px] text-white/30">{apt.service.duration}min</p>
                  </div>

                  {/* Divider */}
                  <div className={`w-1 h-10 rounded-full ${STATUS_MAP[apt.status]?.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{apt.user?.name || "Cliente"}</p>
                    <p className="text-xs text-white/40 truncate">{apt.service.name}</p>
                  </div>

                  {/* Status */}
                  <span className={`text-[10px] px-2 py-1 rounded-full flex-shrink-0 ${STATUS_MAP[apt.status]?.color}`}>
                    {STATUS_MAP[apt.status]?.label}
                  </span>
                </div>

                {/* Actions */}
                {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#3d2020]">
                    {apt.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(apt.id, "CONFIRMED")}
                        className="text-[10px] px-2 py-1 rounded-lg bg-blue-900/30 text-blue-400"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(apt.id, "COMPLETED")}
                      className="text-[10px] px-2 py-1 rounded-lg bg-green-900/30 text-green-400"
                    >
                      Completar
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, "NO_SHOW")}
                      className="text-[10px] px-2 py-1 rounded-lg bg-[#3d2020] text-white/50"
                    >
                      No asistio
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, "CANCELLED")}
                      className="text-[10px] px-2 py-1 rounded-lg bg-red-900/30 text-red-400"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============ DESKTOP: Weekly calendar / List ============ */}
      <div className="hidden sm:block">
        {view === "week" && (
          <div>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek(-1)}
                  className="p-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-white/60 hover:text-white transition"
                >
                  &larr;
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-sm text-white/60 hover:text-white transition"
                >
                  Hoy
                </button>
                <button
                  onClick={() => navigateWeek(1)}
                  className="p-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-white/60 hover:text-white transition"
                >
                  &rarr;
                </button>
              </div>
              <p className="text-sm text-white/50">
                {new Date(weekDays[0].date + "T12:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Calendar grid */}
            <div className="bg-[#2d1515] rounded-xl border border-[#3d2020] overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-[#3d2020]">
                <div className="p-2" />
                {weekDays.map((day) => (
                  <div
                    key={day.date}
                    onClick={() => { setSelectedDate(day.date); setView("list") }}
                    className={`p-2 text-center cursor-pointer hover:bg-white/5 transition border-l border-[#3d2020] ${
                      day.isToday ? "bg-[#e84118]/10" : ""
                    }`}
                  >
                    <p className="text-[10px] text-white/40">{day.dayName}</p>
                    <p className={`text-base font-bold ${
                      day.isToday ? "text-[#e84118]" : "text-white"
                    }`}>
                      {day.dayNum}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-[#3d2020]/50">
                  <div className="p-1 text-[10px] text-white/30 text-right pr-2 pt-2">
                    {hourTo12(hour)}
                  </div>
                  {weekDays.map((day) => {
                    const aptsInSlot = getAppointmentsForDayHour(day.date, hour)
                    return (
                      <div
                        key={`${day.date}-${hour}`}
                        className={`border-l border-[#3d2020]/50 min-h-[50px] p-0.5 ${
                          day.isToday ? "bg-[#e84118]/5" : ""
                        }`}
                      >
                        {aptsInSlot.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => { setSelectedDate(day.date); setView("list") }}
                            className={`text-[10px] p-1 rounded mb-0.5 cursor-pointer transition hover:brightness-125 ${
                              apt.status === "COMPLETED"
                                ? "bg-green-900/40 border border-green-800/50"
                                : apt.status === "CONFIRMED"
                                ? "bg-blue-900/40 border border-blue-800/50"
                                : "bg-yellow-900/40 border border-yellow-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${STATUS_MAP[apt.status]?.dot}`} />
                              <span className="font-medium text-white truncate">
                                {apt.user?.name?.split(" ")[0] || "?"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "list" && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white"
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
                        ? "bg-[#e84118] text-white"
                        : "bg-[#1a0a0a] text-white/50 hover:bg-[#3d2020]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment list */}
            {loading ? (
              <Loader />
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 bg-[#2d1515] rounded-xl border border-[#3d2020]">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-white/30">No hay citas para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#e84118]/20 rounded-full flex items-center justify-center text-lg font-bold text-[#e84118]">
                          {(apt.user?.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{apt.user?.name || "Cliente"}</p>
                          <p className="text-sm text-white/40">{apt.service.name}</p>
                          <p className="text-xs text-white/30">
                            {apt.user?.phone} · {apt.bookedBy === "BARBER" ? "Agendado manual" : "Reserva online"}
                            {role === "ADMIN" && apt.barber?.name && ` · ${apt.barber.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {new Date(apt.date).toLocaleTimeString("es-CO", {
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
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#3d2020]">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition"
                          >
                            Confirmar
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(apt.id, "COMPLETED")}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "NO_SHOW")}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#3d2020] text-white/50 hover:bg-[#4d2c2c] transition"
                        >
                          No asistio
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "CANCELLED")}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition"
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
        )}
      </div>
    </div>
  )
}
