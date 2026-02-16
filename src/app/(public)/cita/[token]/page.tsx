"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CalendarDays, Clock, Scissors, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react"

type AppointmentData = {
  id: string
  date: string
  status: string
  service: { name: string; duration: number; price: number }
  user: { name: string }
  shopName: string
}

export default function CitaPage() {
  const params = useParams()
  const token = params.token as string
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    fetch(`/api/appointments/details?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setAppointment(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Error al cargar la cita")
        setLoading(false)
      })
  }, [token])

  const handleCancel = async () => {
    setCancelling(true)
    const res = await fetch("/api/appointments/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (res.ok) {
      setCancelled(true)
      setShowConfirmDialog(false)
    } else {
      const data = await res.json()
      setError(data.error || "Error al cancelar")
    }
    setCancelling(false)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Bogota",
    }).format(new Date(dateStr))
  }

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Bogota",
    }).format(new Date(dateStr))
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2d1515] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#3d2020]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e84118] animate-spin" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#e84118] font-bold text-sm">Frailin</span>
            <span className="text-white/60 font-medium text-sm">Studio</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2d1515] flex items-center justify-center p-4">
        <div className="bg-[#2d1515] border border-[#3d2020] rounded-2xl p-8 text-center max-w-md w-full">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Cita no encontrada</h1>
          <p className="text-white/40">El link puede ser inválido o la cita ya no existe.</p>
        </div>
      </div>
    )
  }

  if (!appointment) return null

  const isActive = ["PENDING", "CONFIRMED"].includes(appointment.status)
  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    PENDING: { label: "Pendiente", color: "text-yellow-400", icon: Clock },
    CONFIRMED: { label: "Confirmada", color: "text-green-400", icon: CheckCircle },
    COMPLETED: { label: "Completada", color: "text-blue-400", icon: CheckCircle },
    CANCELLED: { label: "Cancelada", color: "text-red-400", icon: XCircle },
    NO_SHOW: { label: "No asistió", color: "text-orange-400", icon: AlertCircle },
  }

  const status = cancelled
    ? statusConfig.CANCELLED
    : statusConfig[appointment.status] || statusConfig.PENDING
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2d1515] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Frailin Studio" width={64} height={64} className="mx-auto mb-3 rounded-xl" />
          <h1 className="text-lg font-bold text-white">
            <span className="text-[#e84118]">Frailin</span> Studio
          </h1>
          <p className="text-white/40 text-sm mt-1">Detalles de tu cita</p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center mb-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-[#2d1515] border border-[#3d2020] ${status.color}`}>
            <StatusIcon size={16} />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        {/* Appointment details card */}
        <div className="bg-[#2d1515] border border-[#3d2020] rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#e84118] to-[#f0932b]" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#e84118]/15 flex items-center justify-center flex-shrink-0">
                <Scissors size={20} className="text-[#e84118]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Servicio</p>
                <p className="text-white font-medium">{appointment.service.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#e84118]/15 flex items-center justify-center flex-shrink-0">
                <CalendarDays size={20} className="text-[#e84118]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Fecha</p>
                <p className="text-white font-medium capitalize">{formatDate(appointment.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#e84118]/15 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-[#e84118]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Hora</p>
                <p className="text-white font-medium">{formatTime(appointment.date)} ({appointment.service.duration} min)</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#e84118]/15 flex items-center justify-center flex-shrink-0">
                <DollarSign size={20} className="text-[#e84118]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Precio</p>
                <p className="text-white font-medium">{formatCurrency(appointment.service.price)}</p>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {isActive && !cancelled && (
            <div className="px-6 pb-6">
              {!showConfirmDialog ? (
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className="w-full py-3 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition"
                >
                  Cancelar mi cita
                </button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-sm text-white mb-3">¿Estás seguro que quieres cancelar tu cita?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="flex-1 py-2.5 border border-[#3d2020] rounded-xl text-sm text-white/60 hover:bg-[#1a0a0a] transition"
                    >
                      No, mantener
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm text-white font-medium hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {cancelling ? "Cancelando..." : "Sí, cancelar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancelled confirmation */}
          {cancelled && (
            <div className="px-6 pb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <XCircle size={24} className="mx-auto text-red-400 mb-2" />
                <p className="text-sm text-red-400 font-medium">Tu cita ha sido cancelada</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <a
            href="/booking"
            className="text-sm text-[#e84118] hover:underline"
          >
            Agendar una nueva cita
          </a>
        </div>
      </div>
    </div>
  )
}
