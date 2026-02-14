"use client"

import { useEffect, useState } from "react"

const DAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shopName: "",
    openTime: "09:00",
    closeTime: "19:00",
    slotDuration: "30",
    daysOff: [] as string[],
    phone: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setSettings({
            shopName: data.shopName || "",
            openTime: data.openTime || "09:00",
            closeTime: data.closeTime || "19:00",
            slotDuration: data.slotDuration?.toString() || "30",
            daysOff: data.daysOff ? data.daysOff.split(",").filter(Boolean) : [],
            phone: data.phone || "",
          })
        }
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        daysOff: settings.daysOff.join(","),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleDay = (day: string) => {
    setSettings((prev) => ({
      ...prev,
      daysOff: prev.daysOff.includes(day)
        ? prev.daysOff.filter((d) => d !== day)
        : [...prev.daysOff, day],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      <div className="max-w-2xl space-y-6">
        {/* Shop Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Información de la barbería</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre de la barbería</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">WhatsApp del barbero</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+52 1234567890"
                className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Horario</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Hora de apertura</label>
              <input
                type="time"
                value={settings.openTime}
                onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Hora de cierre</label>
              <input
                type="time"
                value={settings.closeTime}
                onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:border-[#c9a96e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Days off */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Días de descanso</h3>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  settings.daysOff.includes(day.value)
                    ? "bg-red-100 text-red-700 border-2 border-red-300"
                    : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Link */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-2">Link de reservas</h3>
          <p className="text-sm text-gray-500 mb-3">
            Comparte este link con tus clientes para que agenden en línea
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/booking` : "/booking"}
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/booking`)
              }}
              className="px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-sm hover:bg-[#16213e] transition"
            >
              Copiar
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[#c9a96e] text-white font-semibold hover:bg-[#b8944f] transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar configuración"}
        </button>
      </div>
    </div>
  )
}
