"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
}

type Step = "service" | "date" | "time" | "info" | "confirm"

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("service")
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

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
  }, [])

  useEffect(() => {
    if (selectedDate && selectedService) {
      setLoading(true)
      fetch(`/api/appointments/slots?date=${selectedDate}&serviceId=${selectedService.id}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data.slots)
          setDayOff(data.dayOff)
          setLoading(false)
        })
    }
  }, [selectedDate, selectedService])

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return
    setSubmitting(true)

    const dateTimeStr = `${selectedDate}T${selectedTime}:00`

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
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
      })
      router.push(`/booking/confirm?${params.toString()}`)
    } else {
      const data = await res.json()
      setError(data.error || "Error al agendar la cita")
    }
    setSubmitting(false)
  }

  const today = new Date().toISOString().split("T")[0]

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)

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
          {(["service", "date", "time", "info"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition ${
                (["service", "date", "time", "info", "confirm"] as Step[]).indexOf(step) >= i
                  ? "bg-[#e84118]"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
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
                <div className="text-center py-8 text-gray-400">Cargando horarios...</div>
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
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay horarios disponibles</p>
                  <button
                    onClick={() => setStep("date")}
                    className="mt-4 text-[#e84118] font-medium"
                  >
                    Elegir otra fecha
                  </button>
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
                        {slot}
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
                  <span className="font-medium">{selectedTime}</span>
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
