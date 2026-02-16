"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"

type Client = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  totalVisits: number
  totalSpent: number
  lastVisit: string | null
  totalAppointments: number
  createdAt: string
}

type ClientDetail = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  createdAt: string
  stats: {
    totalVisits: number
    totalSpent: number
    noShows: number
    favoriteService: string
    lastVisit: string | null
  }
  appointments: {
    id: string
    date: string
    status: string
    service: { name: string; price: number; duration: number }
  }[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completada", color: "text-green-400" },
  CONFIRMED: { label: "Confirmada", color: "text-blue-400" },
  PENDING: { label: "Pendiente", color: "text-yellow-400" },
  CANCELLED: { label: "Cancelada", color: "text-red-400" },
  NO_SHOW: { label: "No asistio", color: "text-white/40" },
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "" })
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const fetchClients = () => {
    setLoading(true)
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const createClient = async () => {
    if (!form.name || !form.phone) return
    setSaving(true)
    setFormError("")

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setFormError(data.error || "Error al registrar cliente")
      setSaving(false)
      return
    }

    setForm({ name: "", phone: "", email: "" })
    setShowForm(false)
    setSaving(false)
    toast("Cliente registrado")
    fetchClients()
  }

  const viewClient = async (id: string) => {
    setLoadingDetail(true)
    const res = await fetch(`/api/clients?id=${id}`)
    const data = await res.json()
    setSelectedClient(data)
    setLoadingDetail(false)
  }

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name?.toLowerCase() || "").includes(q) ||
      (c.phone || "").includes(q) ||
      (c.email?.toLowerCase() || "").includes(q)
    )
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Detail view
  if (selectedClient) {
    const { stats } = selectedClient
    return (
      <div>
        <button
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          &larr; Volver a clientes
        </button>

        {/* Client header */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020] mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#e84118]/20 rounded-full flex items-center justify-center text-2xl font-bold text-[#e84118]">
              {(selectedClient.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedClient.name || "Sin nombre"}</h1>
              <div className="flex gap-4 mt-1">
                {selectedClient.phone && (
                  <span className="text-sm text-white/40">{selectedClient.phone}</span>
                )}
                {selectedClient.email && (
                  <span className="text-sm text-white/40">{selectedClient.email}</span>
                )}
              </div>
              <p className="text-xs text-white/30 mt-1">
                Cliente desde {formatDate(selectedClient.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Visitas", value: stats.totalVisits.toString(), icon: "✂️" },
            { label: "Total gastado", value: formatPrice(stats.totalSpent), icon: "💰" },
            { label: "Servicio favorito", value: stats.favoriteService, icon: "⭐" },
            { label: "No-shows", value: stats.noShows.toString(), icon: "❌" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]"
            >
              <div className="text-xl mb-1">{kpi.icon}</div>
              <p className="text-xs text-white/40">{kpi.label}</p>
              <p className="text-lg font-bold text-white mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Appointment history */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold text-white mb-4">Historial de citas</h3>
          {selectedClient.appointments.length === 0 ? (
            <p className="text-white/30 text-sm">Sin citas registradas</p>
          ) : (
            <div className="space-y-2">
              {selectedClient.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 bg-[#1a0a0a] rounded-lg border border-[#3d2020]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-white/40">
                        {new Date(apt.date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {new Date(apt.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{apt.service.name}</p>
                      <p className="text-xs text-white/40">{formatPrice(apt.service.price)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_LABELS[apt.status]?.color || "text-white/40"}`}>
                    {STATUS_LABELS[apt.status]?.label || apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Clients list
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clientes</h1>
          <p className="text-xs text-white/40 mt-1">{clients.length} registrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#e84118] text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-[#c0392b] transition text-sm"
        >
          + Nuevo
        </button>
      </div>

      {/* New client form */}
      {showForm && (
        <div className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] mb-4">
          <h3 className="font-semibold mb-3 text-white text-sm">Registrar cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
            />
            <input
              type="tel"
              placeholder="WhatsApp (+57...) *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
            />
          </div>
          {formError && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-xs">
              {formError}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowForm(false); setFormError("") }}
              className="px-4 py-2 rounded-xl border border-[#3d2020] text-sm hover:bg-[#1a0a0a] transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={createClient}
              disabled={saving || !form.name || !form.phone}
              className="px-4 py-2 rounded-xl bg-[#e84118] text-white text-sm hover:bg-[#c0392b] transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, telefono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3d2020] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-[#3d2020] rounded mb-2" />
                  <div className="h-3 w-24 bg-[#3d2020] rounded" />
                </div>
                <div className="hidden sm:block text-right">
                  <div className="h-4 w-16 bg-[#3d2020] rounded mb-1" />
                  <div className="h-3 w-20 bg-[#3d2020] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-[#2d1515] rounded-xl border border-[#3d2020]">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-white/30">
            {search ? "No se encontraron clientes" : "No hay clientes registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => viewClient(client.id)}
              className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] cursor-pointer hover:border-[#e84118]/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e84118]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#e84118]">
                    {(client.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{client.name || "Sin nombre"}</p>
                    <p className="text-xs text-white/40">
                      {client.phone || client.email || "Sin contacto"}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">
                    {client.totalVisits} {client.totalVisits === 1 ? "visita" : "visitas"}
                  </p>
                  <p className="text-xs text-white/40">
                    {client.totalSpent > 0 ? formatPrice(client.totalSpent) : "Sin compras"}
                  </p>
                  {client.lastVisit && (
                    <p className="text-xs text-white/30">
                      Ultima: {formatDate(client.lastVisit)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
