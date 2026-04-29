"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, Scissors, ChevronLeft, ChevronRight, Smartphone, X } from "lucide-react"

type Barber = {
  id: string
  name: string | null
  image: string | null
  avatarUrl: string | null
  specialty: string | null
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
}

type Step = "barber" | "service" | "datetime" | "info" | "confirm"

// ── Week helpers ──────────────────────────────────────────────
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

const COL_TZ = "America/Bogota"

function toLocalDateStr(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: COL_TZ }).format(date)
}

function formatTime(slot: string): string {
  const [h, m] = slot.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("barber")
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [dayOff, setDayOff] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [nameSuggestions, setNameSuggestions] = useState<{ name: string; phone: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistName, setWaitlistName] = useState("")
  const [waitlistPhone, setWaitlistPhone] = useState("")
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [shopName, setShopName] = useState("Mi Barbería")
  const [hasSavedClient, setHasSavedClient] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPwaModal, setShowPwaModal] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [weekAvailability, setWeekAvailability] = useState<Record<string, "available" | "partial" | "full" | "off">>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // ── Saved client info (localStorage) ──────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("barber_client")
      if (saved) {
        const { name, phone, email } = JSON.parse(saved)
        if (name) { setClientName(name); setHasSavedClient(true) }
        if (phone) setClientPhone(phone)
        if (email) setClientEmail(email)
      }
    } catch {}
  }, [])

  // ── PWA install prompt ─────────────────────────────────────
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    if (standalone) return

    const dismissed = localStorage.getItem("pwa_dismissed")
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIos(ios)

    if (ios) {
      // iOS Safari: no hay beforeinstallprompt, mostrar tutorial después de un delay
      const timer = setTimeout(() => setShowPwaModal(true), 4000)
      return () => clearTimeout(timer)
    } else {
      // Android / Desktop Chrome-Edge: esperar el evento nativo
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPwaModal(true)
      }
      window.addEventListener("beforeinstallprompt", handler)
      // Ocultar el modal si el usuario ya instaló la app
      const onInstalled = () => {
        setShowPwaModal(false)
        setDeferredPrompt(null)
        localStorage.setItem("pwa_dismissed", Date.now().toString())
      }
      window.addEventListener("appinstalled", onInstalled)
      return () => {
        window.removeEventListener("beforeinstallprompt", handler)
        window.removeEventListener("appinstalled", onInstalled)
      }
    }
  }, [])

  // ── Data fetching ──────────────────────────────────────────
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => { if (s?.shopName) setShopName(s.shopName) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((data: Barber[]) => {
        setBarbers(data)
        if (data.length === 1) {
          setSelectedBarber(data[0])
          setStep("service")
        }
      })
  }, [])

  useEffect(() => {
    if (step === "service" && services.length === 0) {
      fetch("/api/services")
        .then((r) => r.json())
        .then(setServices)
    }
  }, [step, services.length])

  // Auto-select today when entering the datetime step (so slots load immediately)
  useEffect(() => {
    if (step === "datetime" && !selectedDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setSelectedDate(toLocalDateStr(today))
    }
  }, [step, selectedDate])

  // Fetch week availability whenever week or service/barber changes
  useEffect(() => {
    if (step !== "datetime" || !selectedService || !selectedBarber) return
    const days = getWeekDays(weekStart)
    const startDate = toLocalDateStr(days[0])
    const endDate = toLocalDateStr(days[6])
    setLoadingAvailability(true)
    fetch(`/api/appointments/week-availability?startDate=${startDate}&endDate=${endDate}&serviceId=${selectedService.id}&barberId=${selectedBarber.id}`)
      .then((r) => r.json())
      .then((data) => setWeekAvailability((prev) => ({ ...prev, ...data })))
      .catch(() => {})
      .finally(() => setLoadingAvailability(false))
  }, [step, weekStart, selectedService?.id, selectedBarber?.id])

  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
      setLoading(true)
      setSlots([])
      setDayOff(false)
      fetch(`/api/appointments/slots?date=${selectedDate}&serviceId=${selectedService.id}&barberId=${selectedBarber.id}`)
        .then((r) => r.json())
        .then((data) => {
          const allSlots: { time: string; available: boolean }[] = data.slots ?? []
          setSlots(allSlots.filter((s) => s.available).map((s) => s.time))
          setDayOff(data.dayOff ?? false)
          setLoading(false)
        })
    }
  }, [selectedDate, selectedService, selectedBarber])

  // ── Handlers ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone || !selectedBarber) return
    setSubmitting(true)
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        date: `${selectedDate}T${selectedTime}:00`,
        clientName,
        phone: clientPhone,
        email: clientEmail,
        bookedBy: "CLIENT",
      }),
    })
    if (res.ok) {
      const params = new URLSearchParams({
        service: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration.toString(),
        price: selectedService.price.toString(),
        name: clientName,
        barber: selectedBarber.name || "",
      })
      localStorage.setItem("barber_client", JSON.stringify({ name: clientName, phone: clientPhone, email: clientEmail }))
      router.push(`/booking/confirm?${params.toString()}`)
    } else {
      const data = await res.json()
      setError(data.error || "Error al agendar la cita")
    }
    setSubmitting(false)
  }

  const handleWaitlistSubmit = async () => {
    if (!waitlistName || !waitlistPhone || !selectedService || !selectedDate) return
    setWaitlistSubmitting(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, name: waitlistName, phone: waitlistPhone, serviceId: selectedService.id }),
      })
      if (res.ok) {
        setWaitlistDone(true)
      } else {
        const data = await res.json()
        setError(data.error || "Error al unirse a la lista")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setWaitlistSubmitting(false)
    }
  }

  useEffect(() => {
    if (clientName.length >= 1) {
      fetch(`/api/search-client?q=${encodeURIComponent(clientName)}`)
        .then((r) => r.json())
        .then((clients: { name: string; phone: string }[]) => {
          setNameSuggestions(clients)
          setShowSuggestions(clients.length > 0)
        })
    } else {
      setNameSuggestions([])
      setShowSuggestions(false)
    }
  }, [clientName])

  // ── Week navigation ────────────────────────────────────────
  const todayLocal = new Date()
  todayLocal.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(todayLocal)
  const currentWeekStart = getWeekStart(todayLocal)
  const weekDays = getWeekDays(weekStart)
  const monthLabel = weekStart.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  const handleDateSelect = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    if (d.getTime() < todayLocal.getTime()) return
    setSelectedDate(toLocalDateStr(d))
    setSelectedTime("")
  }

  const prevWeek = () => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    if (prev.getTime() >= currentWeekStart.getTime()) setWeekStart(prev)
  }

  const nextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
  }

  const clearSavedClient = () => {
    localStorage.removeItem("barber_client")
    setHasSavedClient(false)
    setClientName("")
    setClientPhone("")
    setClientEmail("")
  }

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setShowPwaModal(false)
    localStorage.setItem("pwa_dismissed", Date.now().toString())
  }

  const dismissPwa = () => {
    setShowPwaModal(false)
    localStorage.setItem("pwa_dismissed", Date.now().toString())
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price)

  const progressSteps: Step[] = ["barber", "service", "datetime", "info"]
  const visibleProgressSteps = barbers.length <= 1 ? progressSteps.filter((s) => s !== "barber") : progressSteps
  const allSteps: Step[] =
    barbers.length <= 1
      ? ["service", "datetime", "info", "confirm"]
      : ["barber", "service", "datetime", "info", "confirm"]

  // ── Input styles ───────────────────────────────────────────
  const inputCls = "w-full p-3.5 bg-[#151515] border border-white/12 rounded-xl text-white placeholder-white/25 focus:border-[#d97706] focus:outline-none transition text-sm"

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white">
      {/* PWA install modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl mb-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d97706]/15 rounded-xl flex items-center justify-center">
                  <Smartphone size={22} className="text-[#d97706]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Instala la app</p>
                  <p className="text-xs text-white/40">Agenda más rápido la próxima vez</p>
                </div>
              </div>
              <button onClick={dismissPwa} className="p-1.5 text-white/30 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            {isIos ? (
              <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2.5">
                <p className="text-xs text-white/50 font-medium mb-3">Sigue estos pasos en Safari:</p>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="w-6 h-6 bg-[#d97706]/20 rounded-full flex items-center justify-center text-[#d97706] font-bold flex-shrink-0 text-[11px]">1</span>
                  <span>Toca el botón <span className="font-bold text-white/70">Compartir</span> <span className="text-white/30">(cuadro con flecha ↑)</span></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="w-6 h-6 bg-[#d97706]/20 rounded-full flex items-center justify-center text-[#d97706] font-bold flex-shrink-0 text-[11px]">2</span>
                  <span>Selecciona <span className="font-bold text-white/70">"Añadir a pantalla de inicio"</span></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="w-6 h-6 bg-[#d97706]/20 rounded-full flex items-center justify-center text-[#d97706] font-bold flex-shrink-0 text-[11px]">3</span>
                  <span>Pulsa <span className="font-bold text-white/70">Añadir</span> en la esquina superior derecha</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handlePwaInstall}
                className="w-full py-3.5 rounded-xl bg-[#d97706] text-white font-bold text-sm hover:bg-[#b45309] active:scale-95 transition-all mb-3 flex items-center justify-center gap-2"
              >
                <Smartphone size={16} />
                Instalar app gratis
              </button>
            )}

            <button onClick={dismissPwa} className="w-full py-2.5 rounded-xl text-xs text-white/30 hover:text-white/50 transition">
              Ahora no
            </button>
          </div>
        </div>
      )}
      {/* Barbershop background */}
      <div className="fixed inset-0 z-0">
        <Image src="/barberia.jpg" alt="" fill className="object-cover blur-sm scale-105" style={{ opacity: 0.45 }} priority />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#d97706]/8 rounded-full blur-[120px] pointer-events-none z-10" />

      <div className="relative z-10 max-w-md mx-auto px-4 py-10 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition text-sm">
            <ArrowLeft size={15} />
            <span>Inicio</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Image src="/logo2.png" alt="Barbería" width={28} height={28} />
            <span className="font-black text-base tracking-wide">
              {shopName}
            </span>
          </div>
          <div className="w-16" />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {visibleProgressSteps.map((s) => {
            const active = allSteps.indexOf(step) >= allSteps.indexOf(s)
            return (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${active ? "w-8 bg-[#d97706]" : "w-5 bg-white/10"}`}
              />
            )
          })}
        </div>

        {/* ── Step: Barber ── */}
        {step === "barber" && (
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-[#d97706] tracking-[0.2em] uppercase mb-2">Paso 1</p>
              <h2 className="text-2xl font-black">Elige tu barbero</h2>
            </div>
            <div className="space-y-3">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => { setSelectedBarber(barber); setStep("service") }}
                  className="w-full text-left p-4 rounded-2xl border border-white/12 bg-[#1a1a1a] hover:border-[#d97706]/50 hover:bg-[#d97706]/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/5 flex-shrink-0 ring-2 ring-white/5 group-hover:ring-[#d97706]/30 transition">
                      {barber.avatarUrl || barber.image ? (
                        <Image src={barber.avatarUrl || barber.image || ""} alt={barber.name || ""} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-black text-[#d97706]">
                          {(barber.name || "B").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{barber.name || "Barbero"}</p>
                      {barber.specialty && <p className="text-sm text-white/40 mt-0.5">{barber.specialty}</p>}
                    </div>
                    <div className="ml-auto w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#d97706] flex items-center justify-center transition-all">
                      <ChevronRight size={14} className="text-white/40 group-hover:text-white transition" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Service ── */}
        {step === "service" && (
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-[#d97706] tracking-[0.2em] uppercase mb-2">
                {barbers.length > 1 ? "Paso 2" : "Paso 1"}
              </p>
              <h2 className="text-2xl font-black">Elige tu servicio</h2>
            </div>
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep("datetime") }}
                  className="w-full text-left p-5 rounded-2xl border border-white/12 bg-[#1a1a1a] hover:border-[#d97706]/50 hover:bg-[#d97706]/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-white text-base">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-white/40 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <Clock size={12} className="text-white/25" />
                        <span className="text-xs text-white/30">{service.duration} min</span>
                      </div>
                    </div>
                    <span className="font-black text-[#d97706] text-lg shrink-0">{formatPrice(service.price)}</span>
                  </div>
                </button>
              ))}
            </div>
            {barbers.length > 1 && (
              <button onClick={() => setStep("barber")} className="w-full mt-5 py-3.5 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/20 transition text-sm font-medium flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Atrás
              </button>
            )}
          </div>
        )}

        {/* ── Step: Date + Time ── */}
        {step === "datetime" && (
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-[#d97706] tracking-[0.2em] uppercase mb-2">
                {barbers.length > 1 ? "Paso 3" : "Paso 2"}
              </p>
              <h2 className="text-2xl font-black">Fecha y hora</h2>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevWeek}
                disabled={weekStart.getTime() <= currentWeekStart.getTime()}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold capitalize text-white/60">{monthLabel}</span>
              <button onClick={nextWeek} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week strip */}
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {weekDays.map((day, i) => {
                const dateStr = toLocalDateStr(day)
                const isPast = day.getTime() < todayLocal.getTime()
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const avail = weekAvailability[dateStr]
                const isOff = avail === "off"
                const isDisabled = isPast || isOff
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-white/25 uppercase">{DAY_LABELS[i]}</span>
                    <button
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition select-none
                        ${isSelected
                          ? "bg-[#d97706] text-white shadow-lg shadow-[#d97706]/30"
                          : isDisabled
                          ? "text-white/15 cursor-not-allowed"
                          : isToday
                          ? "bg-white/8 text-white ring-1 ring-white/20"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                        }`}
                    >
                      {day.getDate()}
                    </button>
                    {/* Availability dot */}
                    <div className="h-1.5 flex items-center justify-center">
                      {!isPast && (
                        loadingAvailability ? (
                          <span className="w-1 h-1 rounded-full bg-white/10 animate-pulse" />
                        ) : avail === "available" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ) : avail === "partial" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        ) : avail === "full" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        ) : null
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-3 mb-5 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pocas horas</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" /> Completo</span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mb-5" />

            {/* Time slots */}
            {!selectedDate ? (
              <p className="text-center text-white/25 text-sm py-8">Selecciona un día para ver los horarios</p>
            ) : loading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#d97706]/20 border-t-[#d97706] animate-spin" />
                <p className="text-sm text-white/30">Cargando horarios...</p>
              </div>
            ) : dayOff ? (
              <div className="text-center py-8">
                <p className="text-white/50 font-medium">Este día no hay servicio</p>
                <p className="text-sm text-white/25 mt-1">Elige otra fecha</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-white/40 mb-4 text-sm">No hay horarios disponibles para este día</p>
                {waitlistDone ? (
                  <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 font-medium text-sm">Te avisamos si se abre un horario ✓</p>
                  </div>
                ) : showWaitlist ? (
                  <div className="text-left space-y-3">
                    <p className="text-sm text-white/50 font-medium mb-3">Lista de espera</p>
                    <input type="text" placeholder="Tu nombre" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} className={inputCls} />
                    <input type="tel" placeholder="+57 3001234567" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)} className={inputCls} />
                    <div className="flex gap-3">
                      <button onClick={() => setShowWaitlist(false)} className="flex-1 py-3 rounded-xl border border-white/12 text-white/50 hover:text-white transition text-sm">Cancelar</button>
                      <button onClick={handleWaitlistSubmit} disabled={waitlistSubmitting || !waitlistName || !waitlistPhone} className="flex-1 py-3 rounded-xl bg-[#d97706] text-white font-medium hover:bg-[#c0392b] transition disabled:opacity-50 text-sm">
                        {waitlistSubmitting ? "Enviando..." : "Avisarme"}
                      </button>
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                  </div>
                ) : (
                  <button onClick={() => setShowWaitlist(true)} className="w-full py-3.5 rounded-xl border border-[#d97706]/40 text-[#d97706] font-medium hover:bg-[#d97706]/10 transition text-sm">
                    Unirme a lista de espera
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const [h, m] = slot.split(":").map(Number)
                  const period = h >= 12 ? "PM" : "AM"
                  const hour = h % 12 || 12
                  const timeStr = `${hour}:${m.toString().padStart(2, "0")}`
                  const isSelected = selectedTime === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => { setSelectedTime(slot); setTimeout(() => setStep("info"), 150) }}
                      className={`py-3 rounded-xl border transition flex flex-col items-center gap-0.5
                        ${isSelected
                          ? "bg-[#d97706] border-[#d97706] text-white shadow-lg shadow-[#d97706]/25"
                          : "border-white/12 bg-[#1a1a1a] text-white/70 hover:border-[#d97706]/40 hover:text-white"
                        }`}
                    >
                      <span className="font-bold text-[13px] leading-tight">{timeStr}</span>
                      <span className={`text-[10px] leading-tight ${isSelected ? "text-white/70" : "text-white/30"}`}>{period}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Nav */}
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep("service")} className="flex-1 py-3.5 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/20 transition text-sm font-medium flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Atrás
              </button>
              <button
                onClick={() => selectedDate && selectedTime && setStep("info")}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 py-3.5 rounded-xl bg-[#d97706] text-white font-semibold hover:bg-[#c0392b] transition disabled:opacity-30 text-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Info ── */}
        {step === "info" && (
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-[#d97706] tracking-[0.2em] uppercase mb-2">
                {barbers.length > 1 ? "Paso 4" : "Paso 3"}
              </p>
              <h2 className="text-2xl font-black">Tus datos</h2>
            </div>
            {hasSavedClient && (
              <div className="flex items-center justify-between bg-[#d97706]/10 border border-[#d97706]/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-[#d97706]">Recordamos tus datos</p>
                <button onClick={clearSavedClient} className="text-xs text-white/30 hover:text-white/60 transition underline underline-offset-2">
                  No soy yo
                </button>
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Nombre *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => nameSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Tu nombre completo"
                  className={inputCls}
                />
                {showSuggestions && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-2xl overflow-hidden">
                    {nameSuggestions.map((s) => (
                      <button
                        key={s.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setClientName(s.name); if (s.phone) setClientPhone(s.phone); setShowSuggestions(false) }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0 flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#d97706]/15 flex items-center justify-center text-[#d97706] font-bold text-xs flex-shrink-0">
                          {s.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white/70">{s.name}</p>
                          {s.phone && <p className="text-xs text-white/30">{s.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">WhatsApp *</label>
                <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+57 300 123 4567" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Email <span className="normal-case font-normal text-white/20">(opcional)</span></label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="tu@email.com" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep("datetime")} className="flex-1 py-3.5 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/20 transition text-sm font-medium flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Atrás
              </button>
              <button
                onClick={() => clientName && clientPhone && setStep("confirm")}
                disabled={!clientName || !clientPhone}
                className="flex-1 py-3.5 rounded-xl bg-[#d97706] text-white font-semibold hover:bg-[#c0392b] transition disabled:opacity-30 text-sm"
              >
                Revisar
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === "confirm" && (
          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-[#d97706] tracking-[0.2em] uppercase mb-2">Último paso</p>
              <h2 className="text-2xl font-black">Confirma tu cita</h2>
            </div>

            {/* Summary card */}
            <div className="bg-[#1a1a1a] border border-white/12 rounded-2xl overflow-hidden mb-4">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#d97706]/15 rounded-lg flex items-center justify-center">
                  <Scissors size={15} className="text-[#d97706]" />
                </div>
                <p className="font-bold text-white">{selectedService?.name}</p>
              </div>
              {/* Details */}
              <div className="divide-y divide-white/5">
                {selectedBarber && barbers.length > 1 && (
                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-sm text-white/40">Barbero</span>
                    <span className="text-sm font-semibold text-white">{selectedBarber.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="text-sm text-white/40">Fecha</span>
                  <span className="text-sm font-semibold text-white capitalize">
                    {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="text-sm text-white/40">Hora</span>
                  <span className="text-sm font-semibold text-white">{selectedTime && formatTime(selectedTime)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="text-sm text-white/40">Duración</span>
                  <span className="text-sm font-semibold text-white">{selectedService?.duration} min</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 bg-[#d97706]/5">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="font-black text-xl text-[#d97706]">{selectedService && formatPrice(selectedService.price)}</span>
                </div>
              </div>
            </div>

            {/* Client summary */}
            <div className="bg-[#1a1a1a] border border-white/12 rounded-xl px-5 py-3.5 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 bg-[#d97706]/15 rounded-full flex items-center justify-center text-[#d97706] font-black text-sm">
                {clientName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{clientName}</p>
                <p className="text-xs text-white/35">{clientPhone}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("info")} className="flex-1 py-3.5 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/20 transition text-sm font-medium flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#c0392b] text-white font-bold hover:shadow-lg hover:shadow-[#d97706]/25 transition-all disabled:opacity-50 text-sm"
              >
                {submitting ? "Agendando..." : "Confirmar Cita"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3.5 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
