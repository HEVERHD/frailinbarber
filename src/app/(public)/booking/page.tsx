"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { to12Hour } from "@/lib/utils"
import Image from "next/image"

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

type Step = "barber" | "service" | "date" | "time" | "info" | "confirm"

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
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistName, setWaitlistName] = useState("")
  const [waitlistPhone, setWaitlistPhone] = useState("")
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)

  // Fetch barbers on mount
  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((data: Barber[]) => {
        setBarbers(data)
        // Auto-select if only one barber
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

  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
      setLoading(true)
      fetch(`/api/appointments/slots?date=${selectedDate}&serviceId=${selectedService.id}&barberId=${selectedBarber.id}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data.slots)
          setDayOff(data.dayOff)
          setLoading(false)
        })
    }
  }, [selectedDate, selectedService, selectedBarber])

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone || !selectedBarber) return
    setSubmitting(true)

    const dateTimeStr = `${selectedDate}T${selectedTime}:00`

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        date: dateTimeStr,
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
        body: JSON.stringify({
          date: selectedDate,
          name: waitlistName,
          phone: waitlistPhone,
          serviceId: selectedService.id,
        }),
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

  const today = new Date().toISOString().split("T")[0]

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)

  const progressSteps: Step[] = ["barber", "service", "date", "time", "info"]
  // If only 1 barber, skip barber step in progress
  const visibleProgressSteps = barbers.length <= 1
    ? progressSteps.filter((s) => s !== "barber")
    : progressSteps

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2d1515]">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-[#e84118]">Frailin</span> Studio
          </h1>
          <p className="text-white/60 mt-1">Agenda tu cita</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {visibleProgressSteps.map((s, i) => {
            const allSteps: Step[] = barbers.length <= 1
              ? ["service", "date", "time", "info", "confirm"]
              : ["barber", "service", "date", "time", "info", "confirm"]
            return (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition ${
                  allSteps.indexOf(step) >= allSteps.indexOf(s)
                    ? "bg-[#e84118]"
                    : "bg-white/20"
                }`}
              />
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {/* Step 0: Barber Selection */}
          {step === "barber" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Elige tu barbero</h2>
              <div className="space-y-3">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber)
                      setStep("service")
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition hover:border-[#e84118] ${
                      selectedBarber?.id === barber.id
                        ? "border-[#e84118] bg-[#e84118]/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {barber.avatarUrl || barber.image ? (
                          <Image
                            src={barber.avatarUrl || barber.image || ""}
                            alt={barber.name || "Barbero"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            {(barber.name || "B").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{barber.name || "Barbero"}</p>
                        {barber.specialty && (
                          <p className="text-sm text-gray-500">{barber.specialty}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Service */}
          {step === "service" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Elige tu servicio</h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service)
                      setStep("date")
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition hover:border-[#e84118] ${
                      selectedService?.id === service.id
                        ? "border-[#e84118] bg-[#e84118]/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500">{service.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{service.duration} min</p>
                      </div>
                      <span className="font-bold text-[#e84118]">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {barbers.length > 1 && (
                <button
                  onClick={() => setStep("barber")}
                  className="w-full mt-4 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
              )}
            </div>
          )}

          {/* Step 2: Date */}
          {step === "date" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Selecciona la fecha</h2>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none text-lg"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("service")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
                <button
                  onClick={() => selectedDate && setStep("time")}
                  disabled={!selectedDate}
                  className="flex-1 py-3 rounded-xl bg-[#e84118] text-white font-medium hover:bg-[#c0392b] transition disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Time */}
          {step === "time" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Selecciona la hora</h2>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e84118] animate-spin" />
                  </div>
                  <p className="text-sm text-gray-400">Cargando horarios...</p>
                </div>
              ) : dayOff ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Este día no hay servicio</p>
                  <button
                    onClick={() => setStep("date")}
                    className="mt-4 text-[#e84118] font-medium"
                  >
                    Elegir otra fecha
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No hay horarios disponibles</p>
                  {waitlistDone ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-700 font-medium">Te avisaremos si se abre un horario</p>
                      <button
                        onClick={() => setStep("date")}
                        className="mt-3 text-[#e84118] font-medium text-sm"
                      >
                        Elegir otra fecha
                      </button>
                    </div>
                  ) : showWaitlist ? (
                    <div className="text-left space-y-3">
                      <p className="text-sm text-gray-600 font-medium">Unirme a la lista de espera</p>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={waitlistName}
                        onChange={(e) => setWaitlistName(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="+57 3001234567"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowWaitlist(false)}
                          className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleWaitlistSubmit}
                          disabled={waitlistSubmitting || !waitlistName || !waitlistPhone}
                          className="flex-1 py-3 rounded-xl bg-[#e84118] text-white font-medium hover:bg-[#c0392b] transition disabled:opacity-50 text-sm"
                        >
                          {waitlistSubmitting ? "Enviando..." : "Avisarme"}
                        </button>
                      </div>
                      {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowWaitlist(true)}
                        className="w-full py-3 rounded-xl border-2 border-[#e84118] text-[#e84118] font-medium hover:bg-[#e84118]/5 transition"
                      >
                        Unirme a lista de espera
                      </button>
                      <button
                        onClick={() => setStep("date")}
                        className="text-gray-400 font-medium text-sm"
                      >
                        Elegir otra fecha
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-xl border-2 font-medium transition ${
                          selectedTime === slot
                            ? "border-[#e84118] bg-[#e84118] text-white"
                            : "border-gray-200 hover:border-[#e84118]"
                        }`}
                      >
                        {to12Hour(slot)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("date")}
                      className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => selectedTime && setStep("info")}
                      disabled={!selectedTime}
                      className="flex-1 py-3 rounded-xl bg-[#e84118] text-white font-medium hover:bg-[#c0392b] transition disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Client Info */}
          {step === "info" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Tus datos</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full mt-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">WhatsApp *</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+57 3001234567"
                    className="w-full mt-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email (opcional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full mt-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#e84118] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("time")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
                <button
                  onClick={() => clientName && clientPhone && setStep("confirm")}
                  disabled={!clientName || !clientPhone}
                  className="flex-1 py-3 rounded-xl bg-[#e84118] text-white font-medium hover:bg-[#c0392b] transition disabled:opacity-50"
                >
                  Revisar
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === "confirm" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Confirma tu cita</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {selectedBarber && barbers.length > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Barbero</span>
                    <span className="font-medium">{selectedBarber.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Servicio</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-medium">{selectedTime ? to12Hour(selectedTime) : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-medium">{selectedService?.duration} min</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-lg text-[#e84118]">
                    {selectedService && formatPrice(selectedService.price)}
                  </span>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  {clientName} · {clientPhone}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#e84118] text-white font-semibold hover:bg-[#c0392b] transition disabled:opacity-50"
                >
                  {submitting ? "Agendando..." : "Confirmar Cita"}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
