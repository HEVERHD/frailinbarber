"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/toast"

type ProfileStats = {
  totalAppointments: number
  completedToday: number
  monthRevenue: number
  totalClients: number
  avgPerDay: number
  topService: string
  completionRate: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const bookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/booking`
    : ""

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  const copyLink = async () => {
    await navigator.clipboard.writeText(bookingUrl)
    toast("Link copiado al portapapeles")
  }

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Frailin Studio - Agenda tu cita",
        text: "Agenda tu cita en Frailin Studio",
        url: bookingUrl,
      })
    } else {
      copyLink()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mi Perfil</h1>

      {/* Profile card */}
      <div className="bg-[#2d1515] rounded-2xl border border-[#3d2020] overflow-hidden mb-6">
        <div className="h-20 bg-gradient-to-r from-[#e84118] to-[#f0932b]" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-20 h-20 rounded-full border-4 border-[#2d1515] object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-[#2d1515] bg-[#e84118] flex items-center justify-center text-2xl font-bold text-white">
                {(session?.user?.name || "A")[0].toUpperCase()}
              </div>
            )}
            <div className="pb-1">
              <h2 className="text-xl font-bold text-white">{session?.user?.name || "Admin"}</h2>
              <p className="text-sm text-white/40">{session?.user?.email}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#e84118]/20 text-[#e84118] font-medium">
                Barbero Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] animate-pulse">
              <div className="h-3 w-16 bg-[#3d2020] rounded mb-2" />
              <div className="h-7 w-20 bg-[#3d2020] rounded" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Citas totales</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalAppointments}</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Ingresos del mes</p>
            <p className="text-2xl font-bold text-[#e84118] mt-1">{formatCurrency(stats.monthRevenue)}</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Total clientes</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalClients}</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Tasa completadas</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.completionRate}%</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Completadas hoy</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.completedToday}</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]">
            <p className="text-xs text-white/40">Promedio diario</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.avgPerDay}</p>
          </div>
          <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] col-span-2">
            <p className="text-xs text-white/40">Servicio mas popular</p>
            <p className="text-2xl font-bold text-[#f0932b] mt-1">{stats.topService}</p>
          </div>
        </div>
      )}

      {/* Invitation link */}
      <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020] mb-6">
        <h3 className="font-semibold text-white mb-2">Link de reservas</h3>
        <p className="text-sm text-white/40 mb-4">
          Comparte este link con tus clientes para que agenden citas
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#1a0a0a] border border-[#3d2020] rounded-xl px-4 py-3 text-sm text-white/60 truncate">
            {bookingUrl}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-3 bg-[#e84118] text-white rounded-xl text-sm font-medium hover:bg-[#c0392b] transition flex-shrink-0"
          >
            Copiar
          </button>
        </div>
        <button
          onClick={shareLink}
          className="mt-3 w-full py-3 border border-[#3d2020] rounded-xl text-sm text-white/60 hover:text-white hover:bg-[#1a0a0a] transition flex items-center justify-center gap-2"
        >
          <span suppressHydrationWarning>📤</span>
          Compartir link
        </button>
      </div>

      {/* Quick actions */}
      <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
        <h3 className="font-semibold text-white mb-4">Accesos rapidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <a
            href="/appointments"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>📅</span>
            <span className="text-xs text-white/60">Ver citas</span>
          </a>
          <a
            href="/clients"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>👥</span>
            <span className="text-xs text-white/60">Clientes</span>
          </a>
          <a
            href="/services"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>✂️</span>
            <span className="text-xs text-white/60">Servicios</span>
          </a>
          <a
            href="/users"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>🔑</span>
            <span className="text-xs text-white/60">Usuarios</span>
          </a>
          <a
            href="/blocked-slots"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>🚫</span>
            <span className="text-xs text-white/60">Bloqueos</span>
          </a>
          <a
            href="/settings"
            className="flex flex-col items-center gap-2 p-4 bg-[#1a0a0a] border border-[#3d2020] rounded-xl hover:border-[#e84118]/50 transition"
          >
            <span className="text-2xl" suppressHydrationWarning>⚙️</span>
            <span className="text-xs text-white/60">Configuracion</span>
          </a>
        </div>
      </div>
    </div>
  )
}
