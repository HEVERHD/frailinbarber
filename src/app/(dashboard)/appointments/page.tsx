"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/toast"
import { to12Hour, hourTo12 } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"
import { Camera, X, ImagePlus } from "lucide-react"

type Appointment = {
  id: string
  date: string
  status: string
  bookedBy: string
  notes: string | null
  serviceId: string
  barberId: string
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
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7:00 - 23:00

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

// ── Real-time timeline constants ────────────────────────────
const HOUR_HEIGHT = 64 // px per hour
const TL_START = 7    // 7 AM
const TL_END = 24     // 12 AM (midnight)

function getColombiaMinute(date: Date): number {
  return parseInt(new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone: COL_TZ }).format(date))
}
function timeToY(h: number, m: number): number {
  return ((h - TL_START) * 60 + m) / 60 * HOUR_HEIGHT
}
function aptEndTime(apt: { date: string; service: { duration: number } }): Date {
  return new Date(new Date(apt.date).getTime() + apt.service.duration * 60000)
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(() => colombiaDateStr(new Date()))
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [view, setView] = useState<"list" | "week" | "day">("day")

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
  const [now, setNow] = useState(new Date())
  const [actionApt, setActionApt] = useState<Appointment | null>(null)
  const [completionApt, setCompletionApt] = useState<Appointment | null>(null)
  const [uploadPhoto, setUploadPhoto] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadUploading, setUploadUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Reschedule state ──
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([])
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false)
  const [rescheduleError, setRescheduleError] = useState("")
  const [rescheduling, setRescheduling] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || "BARBER"
  const userId = (session?.user as any)?.id || ""

  // ── Real-time clock (updates every 30s) ──
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Helpers that depend on `now` ──
  const isActive = (apt: Appointment) => {
    const start = new Date(apt.date)
    const end = aptEndTime(apt)
    return now >= start && now < end && (apt.status === "CONFIRMED" || apt.status === "PENDING")
  }
  const isPast = (apt: Appointment) => now >= aptEndTime(apt)
  const getProgress = (apt: Appointment) => {
    const elapsed = now.getTime() - new Date(apt.date).getTime()
    return Math.min(100, (elapsed / (apt.service.duration * 60000)) * 100)
  }
  const getRemainingMin = (apt: Appointment) =>
    Math.max(0, Math.ceil((aptEndTime(apt).getTime() - now.getTime()) / 60000))

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

  // ── Auto-complete past appointments (runs every 30s when viewing today) ──
  useEffect(() => {
    if (selectedDate !== colombiaDateStr(new Date())) return
    weekAppointments.forEach((apt) => {
      if ((apt.status === "CONFIRMED" || apt.status === "PENDING") && isPast(apt)) {
        updateStatus(apt.id, "COMPLETED")
      }
    })
  }, [now])

  // Search clients as user types (trigger at 1 char)
  useEffect(() => {
    if (newApt.clientName.length >= 1) {
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

  const handlePhotoSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setUploadPhoto(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleCompleteWithPhoto = async () => {
    if (!completionApt) return
    setUploadUploading(true)
    try {
      if (uploadPhoto) {
        await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: uploadPhoto,
            title: uploadTitle || `${completionApt.service.name} — ${completionApt.user.name || "Cliente"}`,
            category: "corte",
          }),
        })
      }
      await updateStatus(completionApt.id, "COMPLETED")
    } finally {
      setUploadUploading(false)
      setCompletionApt(null)
      setUploadPhoto(null)
      setUploadTitle("")
    }
  }

  const handleCompleteSkip = async () => {
    if (!completionApt) return
    await updateStatus(completionApt.id, "COMPLETED")
    setCompletionApt(null)
    setUploadPhoto(null)
    setUploadTitle("")
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

  const fetchRescheduleSlots = async (date: string, apt: Appointment) => {
    setRescheduleLoadingSlots(true)
    setRescheduleTime("")
    try {
      const barberId = apt.barber?.id || apt.barberId || userId
      const res = await fetch(`/api/appointments/slots?date=${date}&serviceId=${apt.serviceId}&barberId=${barberId}`)
      const data = await res.json()
      const available = (data.slots || []).filter((s: any) => s.available).map((s: any) => s.time)
      setRescheduleSlots(available)
    } catch {
      setRescheduleSlots([])
    } finally {
      setRescheduleLoadingSlots(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return
    setRescheduling(true)
    setRescheduleError("")
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rescheduleApt.id,
          action: "reschedule",
          newDate: `${rescheduleDate}T${rescheduleTime}:00`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRescheduleError(data.error || "Error al reagendar")
        return
      }
      setRescheduleApt(null)
      toast("Cita reagendada ✓")
      fetchAppointments()
      fetchWeekAppointments()
    } catch {
      setRescheduleError("Error de conexión. Intenta de nuevo.")
    } finally {
      setRescheduling(false)
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
              onClick={() => setView("day")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                view === "day" ? "bg-[#e84118] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Día
            </button>
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
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#2d1515] border border-[#3d2020] rounded-xl overflow-hidden shadow-xl max-h-56 overflow-y-auto">
                  {clientResults.map((c: any) => (
                    <button
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const isBarber = role === "BARBER" || role === "ADMIN"
                        setNewApt({
                          ...newApt,
                          clientName: c.name || "",
                          phone: isBarber ? (c.phone || "") : newApt.phone,
                        })
                        setShowClientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#3d2020] transition border-b border-[#3d2020] last:border-0 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#e84118]/20 flex items-center justify-center text-[#e84118] font-bold text-sm flex-shrink-0">
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name || "Sin nombre"}</p>
                        {(role === "BARBER" || role === "ADMIN") && (
                          <p className="text-xs text-white/40 truncate">{c.phone || c.email || "Sin contacto"}</p>
                        )}
                      </div>
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

        {/* ── Proportional real-time timeline ── */}
        <div className="bg-[#2d1515] rounded-xl border border-[#3d2020] overflow-hidden">
          {dayAppointments.length === 0 && selectedDate !== colombiaDateStr(now) ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-white/30 text-sm">Sin citas para este día</p>
            </div>
          ) : (
            <div
              className="relative ml-12"
              style={{ height: (TL_END - TL_START) * HOUR_HEIGHT }}
            >
              {/* Hour grid lines + labels */}
              {Array.from({ length: TL_END - TL_START + 1 }, (_, i) => i + TL_START).map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-[#3d2020]/60"
                  style={{ top: (hour - TL_START) * HOUR_HEIGHT }}
                >
                  <span className="absolute -left-11 -top-2.5 text-[10px] text-white/25 w-10 text-right pr-1">
                    {hourTo12(hour)}
                  </span>
                </div>
              ))}

              {/* Current time red line (only when viewing today) */}
              {selectedDate === colombiaDateStr(now) && (() => {
                const nowH = colombiaHour(now)
                const nowM = getColombiaMinute(now)
                if (nowH < TL_START || nowH >= TL_END) return null
                const y = timeToY(nowH, nowM)
                const timeLabel = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: COL_TZ })
                return (
                  <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: y }}>
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-red-500" />
                    <span className="text-[9px] text-red-400 px-1 bg-[#2d1515] flex-shrink-0">{timeLabel}</span>
                  </div>
                )
              })()}

              {/* Appointment blocks */}
              {dayAppointments.map((apt) => {
                const { h, m } = { h: colombiaHour(new Date(apt.date)), m: getColombiaMinute(new Date(apt.date)) }
                const top = timeToY(h, m)
                const height = Math.max((apt.service.duration / 60) * HOUR_HEIGHT, 36)
                const active = isActive(apt)
                const past = isPast(apt)
                const progress = active ? getProgress(apt) : 0
                const remaining = active ? getRemainingMin(apt) : 0

                // Necesita botón manual: activo O pasado-sin-completar
                const needsAction = (apt.status === "PENDING" || apt.status === "CONFIRMED") &&
                  (active || past)

                return (
                  <div
                    key={apt.id}
                    className="absolute left-1"
                    style={{ top: top + 1, height: height - 2, right: "4px" }}
                  >
                    {/* Bloque principal — toca para abrir actions */}
                    <div
                      onClick={() => setActionApt(apt)}
                      className={`h-full rounded-xl overflow-hidden border transition-opacity cursor-pointer active:brightness-125 ${
                        past && apt.status !== "COMPLETED" && apt.status !== "CANCELLED"
                          ? "opacity-50 border-[#3d2020]"
                          : active
                          ? "border-[#e84118] shadow-lg shadow-[#e84118]/20"
                          : "border-[#3d2020]"
                      }`}
                    >
                      {/* Progress bar fill for active appointment */}
                      {active && (
                        <div
                          className="absolute inset-0 bg-[#e84118]/20 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      )}

                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full p-2 bg-[#1a0a0a]/60">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-xs leading-tight truncate ${active ? "text-white" : "text-white/80"}`}>
                              {apt.user?.name || "Cliente"}
                            </p>
                            <p className="text-[10px] text-white/40 truncate">{apt.service.name}</p>
                            {active && (
                              <p className="text-[10px] text-[#e84118] font-medium mt-0.5">
                                {remaining} min restantes
                              </p>
                            )}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_MAP[apt.status]?.color}`}>
                            {STATUS_MAP[apt.status]?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Empty state overlay when no appointments but viewing today */}
              {dayAppointments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl mb-1">📅</p>
                    <p className="text-white/20 text-xs">Sin citas hoy</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ ACTION SHEET (mobile tap on appointment) ============ */}
      {actionApt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setActionApt(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full sm:max-w-sm bg-[#1a0a0a] rounded-t-3xl sm:rounded-2xl border border-[#3d2020] overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Appointment info */}
            <div className="px-5 py-3 border-b border-[#3d2020]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e84118]/20 flex items-center justify-center text-[#e84118] font-bold text-base flex-shrink-0">
                  {(actionApt.user?.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{actionApt.user?.name || "Cliente"}</p>
                  <p className="text-xs text-white/40">{actionApt.service.name} · {new Date(actionApt.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: COL_TZ })}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_MAP[actionApt.status]?.color}`}>
                  {STATUS_MAP[actionApt.status]?.label}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              {actionApt.status === "PENDING" && (
                <button
                  onClick={() => { updateStatus(actionApt.id, "CONFIRMED"); setActionApt(null) }}
                  className="w-full py-3 rounded-xl bg-blue-900/30 text-blue-400 font-medium text-sm hover:bg-blue-900/50 transition active:scale-98"
                >
                  ✓ Confirmar cita
                </button>
              )}
              {(actionApt.status === "PENDING" || actionApt.status === "CONFIRMED") && (
                <>
                  <button
                    onClick={() => {
                      const apt = actionApt
                      setActionApt(null)
                      const initDate = colombiaDateStr(new Date(apt.date))
                      setRescheduleApt(apt)
                      setRescheduleDate(initDate)
                      setRescheduleTime("")
                      setRescheduleError("")
                      setRescheduleSlots([])
                      fetchRescheduleSlots(initDate, apt)
                    }}
                    className="w-full py-3 rounded-xl bg-amber-900/30 text-amber-400 font-medium text-sm hover:bg-amber-900/50 transition"
                  >
                    📅 Reagendar
                  </button>
                  <button
                    onClick={() => { setActionApt(null); setCompletionApt(actionApt) }}
                    className="w-full py-3 rounded-xl bg-green-900/30 text-green-400 font-medium text-sm hover:bg-green-900/50 transition"
                  >
                    💈 Marcar como completada
                  </button>
                  <button
                    onClick={() => { updateStatus(actionApt.id, "NO_SHOW"); setActionApt(null) }}
                    className="w-full py-3 rounded-xl bg-[#2d1515] text-white/40 font-medium text-sm hover:bg-[#3d2020] transition border border-[#3d2020]"
                  >
                    No asistió
                  </button>
                  <button
                    onClick={() => { updateStatus(actionApt.id, "CANCELLED"); setActionApt(null) }}
                    className="w-full py-3 rounded-xl bg-red-900/20 text-red-400 font-medium text-sm hover:bg-red-900/40 transition"
                  >
                    ✕ Cancelar cita
                  </button>
                </>
              )}
              {actionApt.status === "COMPLETED" && (
                <button
                  onClick={() => { updateStatus(actionApt.id, "NO_SHOW"); setActionApt(null) }}
                  className="w-full py-3 rounded-xl bg-[#2d1515] text-white/40 font-medium text-sm hover:bg-[#3d2020] transition border border-[#3d2020]"
                >
                  No asistió (corregir)
                </button>
              )}
              <button
                onClick={() => setActionApt(null)}
                className="w-full py-3 rounded-xl text-white/30 text-sm hover:text-white/50 transition"
              >
                Cerrar
              </button>
            </div>

            {/* Safe area bottom */}
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ============ PHOTO UPLOAD MODAL (on completion) ============ */}
      {completionApt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleCompleteSkip}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-sm bg-[#1a0a0a] rounded-t-3xl sm:rounded-2xl border border-[#3d2020] overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-4 border-b border-[#3d2020]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-base">💈 ¡Listo el corte!</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {completionApt.user.name || "Cliente"} · {completionApt.service.name}
                  </p>
                </div>
                <button onClick={handleCompleteSkip} className="text-white/30 hover:text-white/60 transition">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-white/60 mt-3">¿Quieres subir una foto del resultado a la galería?</p>
            </div>

            {/* Photo area */}
            <div className="p-5 space-y-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])}
              />

              {uploadPhoto ? (
                <div className="relative">
                  <img
                    src={uploadPhoto}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl border border-[#3d2020]"
                  />
                  <button
                    onClick={() => setUploadPhoto(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-[#3d2020] flex flex-col items-center justify-center gap-2 hover:border-[#e84118]/50 hover:bg-[#e84118]/5 transition"
                >
                  <Camera size={28} className="text-white/30" />
                  <span className="text-sm text-white/40">Tomar foto / elegir imagen</span>
                </button>
              )}

              {uploadPhoto && (
                <input
                  type="text"
                  placeholder="Título (opcional)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-3 border border-[#3d2020] rounded-xl bg-[#0d0404] text-white placeholder-white/30 text-sm focus:border-[#e84118] focus:outline-none"
                />
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {uploadPhoto && (
                  <button
                    onClick={handleCompleteWithPhoto}
                    disabled={uploadUploading}
                    className="w-full py-3 rounded-xl bg-[#e84118] text-white font-medium text-sm hover:bg-[#c0392b] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadUploading ? (
                      <span>Subiendo...</span>
                    ) : (
                      <>
                        <ImagePlus size={16} />
                        Subir foto y completar
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleCompleteSkip}
                  disabled={uploadUploading}
                  className="w-full py-3 rounded-xl bg-green-900/30 text-green-400 font-medium text-sm hover:bg-green-900/50 transition disabled:opacity-40"
                >
                  {uploadPhoto ? "Solo completar (sin foto)" : "Completar sin foto"}
                </button>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ============ RESCHEDULE MODAL ============ */}
      {rescheduleApt && (() => {
        const weekDaysRs = getWeekDays(rescheduleDate)
        const todayStr = colombiaDateStr(new Date())
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setRescheduleApt(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative w-full sm:max-w-md bg-[#1a0a0a] rounded-t-3xl sm:rounded-2xl border border-[#3d2020] overflow-hidden z-10 max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-[#3d2020] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e84118]/20 flex items-center justify-center text-[#e84118] font-bold text-base flex-shrink-0">
                    {(rescheduleApt.user.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{rescheduleApt.user.name || "Cliente"}</p>
                    <p className="text-xs text-white/40">
                      {rescheduleApt.service.name} · Actual:{" "}
                      {new Date(rescheduleApt.date).toLocaleString("es-CO", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: COL_TZ,
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mt-3">Selecciona nueva fecha y hora</p>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                {/* Week navigation */}
                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const d = new Date(rescheduleDate + "T12:00:00")
                        d.setDate(d.getDate() - 7)
                        setRescheduleDate(d.toISOString().split("T")[0])
                      }}
                      className="p-2 rounded-lg bg-[#2d1515] border border-[#3d2020] text-white/60 hover:text-white transition"
                    >
                      ←
                    </button>
                    <span className="text-xs text-white/40">
                      {weekDaysRs[0].dayNum}{" "}
                      {new Date(weekDaysRs[0].date + "T12:00:00").toLocaleDateString("es-CO", { month: "short" })}
                      {" — "}
                      {weekDaysRs[6].dayNum}{" "}
                      {new Date(weekDaysRs[6].date + "T12:00:00").toLocaleDateString("es-CO", { month: "short" })}
                    </span>
                    <button
                      onClick={() => {
                        const d = new Date(rescheduleDate + "T12:00:00")
                        d.setDate(d.getDate() + 7)
                        setRescheduleDate(d.toISOString().split("T")[0])
                      }}
                      className="p-2 rounded-lg bg-[#2d1515] border border-[#3d2020] text-white/60 hover:text-white transition"
                    >
                      →
                    </button>
                  </div>

                  {/* Day pills */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {weekDaysRs.map((day) => {
                      const isPastDay = day.date < todayStr
                      const isSelected = day.date === rescheduleDate
                      return (
                        <button
                          key={day.date}
                          disabled={isPastDay}
                          onClick={() => {
                            setRescheduleDate(day.date)
                            fetchRescheduleSlots(day.date, rescheduleApt)
                          }}
                          className={`flex flex-col items-center py-2 rounded-xl text-xs transition
                            ${isSelected
                              ? "bg-[#e84118] text-white"
                              : isPastDay
                              ? "text-white/20 cursor-not-allowed"
                              : "bg-[#2d1515] text-white/60 hover:bg-[#3d2020] hover:text-white border border-[#3d2020]"
                            }`}
                        >
                          <span className="font-medium">{day.dayName}</span>
                          <span className="text-[11px] mt-0.5">{day.dayNum}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div className="px-5 pb-4">
                  {rescheduleLoadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader />
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <p className="text-center text-white/30 text-sm py-6">Sin disponibilidad para este día</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setRescheduleTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition
                            ${rescheduleTime === slot
                              ? "bg-[#e84118] text-white"
                              : "bg-[#2d1515] text-white/70 hover:bg-[#3d2020] hover:text-white border border-[#3d2020]"
                            }`}
                        >
                          {to12Hour(slot)}
                        </button>
                      ))}
                    </div>
                  )}

                  {rescheduleError && (
                    <p className="text-red-400 text-sm text-center mt-3">{rescheduleError}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-6 pt-3 border-t border-[#3d2020] flex-shrink-0 space-y-2">
                <button
                  onClick={handleReschedule}
                  disabled={!rescheduleTime || rescheduling}
                  className="w-full py-3 rounded-xl bg-[#e84118] text-white font-semibold text-sm hover:bg-[#c0392b] transition disabled:opacity-40"
                >
                  {rescheduling ? "Guardando..." : "Guardar nuevo horario"}
                </button>
                <button
                  onClick={() => setRescheduleApt(null)}
                  className="w-full py-3 rounded-xl text-white/30 text-sm hover:text-white/50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ============ DESKTOP: Weekly calendar / List ============ */}
      <div className="hidden sm:block">
        {view === "day" && (
          <div>
            {/* Day navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDay(-1)}
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
                  onClick={() => navigateDay(1)}
                  className="p-2 rounded-lg bg-[#1a0a0a] border border-[#3d2020] text-white/60 hover:text-white transition"
                >
                  &rarr;
                </button>
              </div>
              <p className="text-sm font-medium text-white">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>

            {/* Proportional timeline */}
            <div className="bg-[#2d1515] rounded-xl border border-[#3d2020] overflow-hidden">
              {dayAppointments.length === 0 && selectedDate !== colombiaDateStr(now) ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="text-white/30 text-sm">Sin citas para este día</p>
                </div>
              ) : (
                <div className="relative ml-16" style={{ height: (TL_END - TL_START) * HOUR_HEIGHT }}>
                  {/* Hour grid lines + labels */}
                  {Array.from({ length: TL_END - TL_START + 1 }, (_, i) => i + TL_START).map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-[#3d2020]/60"
                      style={{ top: (hour - TL_START) * HOUR_HEIGHT }}
                    >
                      <span className="absolute -left-14 -top-2.5 text-xs text-white/25 w-12 text-right pr-2">
                        {hourTo12(hour)}
                      </span>
                    </div>
                  ))}

                  {/* Current time red line */}
                  {selectedDate === colombiaDateStr(now) && (() => {
                    const nowH = colombiaHour(now)
                    const nowM = getColombiaMinute(now)
                    if (nowH < TL_START || nowH >= TL_END) return null
                    const y = timeToY(nowH, nowM)
                    const timeLabel = now.toLocaleTimeString("es-CO", {
                      hour: "2-digit", minute: "2-digit", hour12: true, timeZone: COL_TZ,
                    })
                    return (
                      <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: y }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                        <div className="flex-1 h-px bg-red-500" />
                        <span className="text-xs text-red-400 px-2 bg-[#2d1515] flex-shrink-0">{timeLabel}</span>
                      </div>
                    )
                  })()}

                  {/* Appointment blocks */}
                  {dayAppointments.map((apt) => {
                    const h = colombiaHour(new Date(apt.date))
                    const m = getColombiaMinute(new Date(apt.date))
                    const top = timeToY(h, m)
                    const height = Math.max((apt.service.duration / 60) * HOUR_HEIGHT, 40)
                    const active = isActive(apt)
                    const past = isPast(apt)
                    const progress = active ? getProgress(apt) : 0
                    const remaining = active ? getRemainingMin(apt) : 0

                    return (
                      <div
                        key={apt.id}
                        className="absolute left-1"
                        style={{ top: top + 1, height: height - 2, right: "8px" }}
                      >
                        <div
                          onClick={() => setActionApt(apt)}
                          className={`h-full rounded-xl overflow-hidden border transition cursor-pointer hover:brightness-110 ${
                            past && apt.status !== "COMPLETED" && apt.status !== "CANCELLED"
                              ? "opacity-50 border-[#3d2020]"
                              : active
                              ? "border-[#e84118] shadow-lg shadow-[#e84118]/20"
                              : apt.status === "COMPLETED"
                              ? "border-green-800/50"
                              : "border-[#3d2020]"
                          }`}
                        >
                          {active && (
                            <div
                              className="absolute inset-0 bg-[#e84118]/20 transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                          <div className="relative z-10 flex items-center h-full px-4 gap-4 bg-[#1a0a0a]/60">
                            <div className="w-9 h-9 rounded-full bg-[#e84118]/20 flex items-center justify-center text-[#e84118] font-bold text-sm flex-shrink-0">
                              {(apt.user?.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm truncate ${active ? "text-white" : "text-white/80"}`}>
                                {apt.user?.name || "Cliente"}
                              </p>
                              <p className="text-xs text-white/40 truncate">{apt.service.name}</p>
                              {active && (
                                <p className="text-xs text-[#e84118] font-medium">{remaining} min restantes</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs text-white/50">
                                {new Date(apt.date).toLocaleTimeString("es-CO", {
                                  hour: "2-digit", minute: "2-digit", hour12: true, timeZone: COL_TZ,
                                })}
                              </p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_MAP[apt.status]?.color}`}>
                                {STATUS_MAP[apt.status]?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {dayAppointments.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-4xl mb-1">📅</p>
                        <p className="text-white/20 text-sm">Sin citas hoy</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
                            hour12: true,
                            timeZone: COL_TZ,
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
                    {(apt.status === "PENDING" || apt.status === "CONFIRMED" || apt.status === "COMPLETED") && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#3d2020]">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition"
                          >
                            Confirmar
                          </button>
                        )}
                        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                          <button
                            onClick={() => setCompletionApt(apt)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition"
                          >
                            Completar
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(apt.id, "NO_SHOW")}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#3d2020] text-white/50 hover:bg-[#4d2c2c] transition"
                        >
                          {apt.status === "COMPLETED" ? "No asistió (corregir)" : "No asistio"}
                        </button>
                        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                          <button
                            onClick={() => updateStatus(apt.id, "CANCELLED")}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition"
                          >
                            Cancelar
                          </button>
                        )}
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
