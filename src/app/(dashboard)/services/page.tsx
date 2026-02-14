"use client"

import { useEffect, useState } from "react"

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: "", description: "", price: "", duration: "" })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    const res = await fetch("/api/services")
    const data = await res.json()
    setServices(data)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", description: "", price: "", duration: "" })
    setShowForm(true)
  }

  const openEdit = (service: Service) => {
    setEditing(service)
    setForm({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration.toString(),
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) return

    if (editing) {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form, active: editing.active }),
      })
    } else {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }

    setShowForm(false)
    setEditing(null)
    fetchServices()
  }

  const toggleActive = async (service: Service) => {
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...service, active: !service.active }),
    })
    fetchServices()
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <button
          onClick={openNew}
          className="bg-[#c9a96e] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#b8944f] transition text-sm"
        >
          + Nuevo Servicio
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold mb-4">
            {editing ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <input
              type="number"
              placeholder="Precio (MXN)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
            <input
              type="number"
              placeholder="Duración (minutos)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-sm hover:bg-[#16213e] transition"
            >
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      )}

      {/* Service list */}
      {loading ? (
        <p className="text-gray-400 text-center py-8">Cargando...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition ${
                !service.active ? "opacity-50" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{service.name}</h3>
                <span className="text-lg font-bold text-[#c9a96e]">
                  {formatPrice(service.price)}
                </span>
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 mb-2">{service.description}</p>
              )}
              <p className="text-xs text-gray-400 mb-4">{service.duration} minutos</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(service)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(service)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    service.active
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  {service.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
