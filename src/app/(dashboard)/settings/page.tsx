"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { QRCodeSVG } from "qrcode.react"
import { useToast } from "@/components/ui/toast"

const DAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
]

type Barber = { id: string; name: string | null }

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "ADMIN"

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>("")
  const [settings, setSettings] = useState({
    shopName: "",
    openTime: "09:00",
    closeTime: "19:00",
    slotDuration: "30",
    daysOff: [] as string[],
    daySchedules: {} as Record<string, { open: string; close: string }>,
    address: "",
    phone: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Fetch barbers list (only needed for ADMIN)
  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((data: Barber[]) => setBarbers(data))
  }, [isAdmin])

  // Load settings whenever selectedBarberId changes (or on first load for BARBER)
  useEffect(() => {
    const ownId = (session?.user as any)?.id
    if (!ownId && isAdmin === undefined) return

    const barberId = isAdmin && selectedBarberId ? selectedBarberId : ownId
    if (!barberId) return

    setLoading(true)
    const url = isAdmin && barberId
      ? `/api/settings?barberId=${barberId}`
      : `/api/settings`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          let parsedDaySchedules: Record<string, { open: string; close: string }> = {}
          if (data.daySchedules) {
            try { parsedDaySchedules = JSON.parse(data.daySchedules) } catch {}
          }
          setSettings({
            shopName: data.shopName || "",
            openTime: data.openTime || "09:00",
            closeTime: data.closeTime || "19:00",
            slotDuration: data.slotDuration?.toString() || "30",
            daysOff: data.daysOff ? data.daysOff.split(",").filter(Boolean) : [],
            daySchedules: parsedDaySchedules,
            address: data.address || "",
            phone: data.phone || "",
          })
        }
        setLoading(false)
      })
  }, [selectedBarberId, (session?.user as any)?.id])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        daysOff: settings.daysOff.join(","),
        daySchedules: Object.keys(settings.daySchedules).length > 0
          ? JSON.stringify(settings.daySchedules)
          : null,
        ...(isAdmin && selectedBarberId ? { barberId: selectedBarberId } : {}),
      }),
    })
    setSaving(false)
    toast("Configuración guardada")
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
      <div>
        <h1 className="text-2xl font-bold mb-6 text-white">Configuración</h1>
        <div className="max-w-2xl space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020] animate-pulse">
              <div className="h-5 w-40 bg-[#3d2020] rounded mb-4" />
              <div className="space-y-3">
                <div className="h-12 w-full bg-[#3d2020] rounded-xl" />
                {i < 2 && <div className="h-12 w-full bg-[#3d2020] rounded-xl" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Configuración</h1>

      <div className="max-w-2xl space-y-6">

        {/* Barber selector — only for ADMIN */}
        {isAdmin && barbers.length > 1 && (
          <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
            <h3 className="font-semibold mb-4 text-white">Editar configuración de</h3>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full p-3 border border-[#3d2020] rounded-xl bg-[#1a0a0a] text-white focus:border-[#e84118] focus:outline-none"
            >
              <option value="">— Mi configuración —</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Shop Info */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold mb-4 text-white">Información de la barbería</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/60">Nombre de la barbería</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full mt-1 p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60">WhatsApp del barbero</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+57 3001234567"
                className="w-full mt-1 p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60">Dirección (para el mapa en la página)</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Calle 123 #45-67, Barrio, Ciudad"
                className="w-full mt-1 p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
              />
              <p className="text-xs text-white/30 mt-1">Esta dirección aparecerá en el mapa de &quot;Cómo llegar&quot; de la página pública.</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold mb-4 text-white">Horario</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/60">Hora de apertura</label>
              <input
                type="time"
                value={settings.openTime}
                onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                className="w-full mt-1 p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60">Hora de cierre</label>
              <input
                type="time"
                value={settings.closeTime}
                onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                className="w-full mt-1 p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Days off */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold mb-4 text-white">Días de descanso</h3>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  settings.daysOff.includes(day.value)
                    ? "bg-red-100 text-red-700 border-2 border-red-300"
                    : "bg-[#3d2020] text-white/60 border-2 border-transparent hover:bg-[#4d2c2c]"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-day custom schedules */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold mb-1 text-white">Horarios especiales por día</h3>
          <p className="text-sm text-white/40 mb-4">
            Define un horario diferente al general para días específicos. Los días de descanso no aplican.
          </p>
          {DAYS.filter((day) => !settings.daysOff.includes(day.value)).length === 0 ? (
            <p className="text-white/30 text-sm">Todos los días están marcados como descanso.</p>
          ) : (
            <div className="space-y-3">
              {DAYS.filter((day) => !settings.daysOff.includes(day.value)).map((day) => {
                const custom = settings.daySchedules[day.value]
                const openVal = custom?.open ?? settings.openTime
                const closeVal = custom?.close ?? settings.closeTime
                const hasCustom = !!custom

                const updateDay = (field: "open" | "close", value: string) => {
                  setSettings((prev) => ({
                    ...prev,
                    daySchedules: {
                      ...prev.daySchedules,
                      [day.value]: {
                        open: field === "open" ? value : openVal,
                        close: field === "close" ? value : closeVal,
                      },
                    },
                  }))
                }

                const resetDay = () => {
                  setSettings((prev) => {
                    const { [day.value]: _, ...rest } = prev.daySchedules
                    return { ...prev, daySchedules: rest }
                  })
                }

                return (
                  <div key={day.value} className="flex items-center gap-3 flex-wrap">
                    <span className={`w-24 text-sm font-medium ${hasCustom ? "text-[#e84118]" : "text-white/50"}`}>
                      {day.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={openVal}
                        onChange={(e) => updateDay("open", e.target.value)}
                        className="p-2 border border-[#3d2020] rounded-xl bg-[#1a0a0a] text-white text-sm focus:border-[#e84118] focus:outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
                      />
                      <span className="text-white/30 text-sm">—</span>
                      <input
                        type="time"
                        value={closeVal}
                        onChange={(e) => updateDay("close", e.target.value)}
                        className="p-2 border border-[#3d2020] rounded-xl bg-[#1a0a0a] text-white text-sm focus:border-[#e84118] focus:outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
                      />
                    </div>
                    {hasCustom ? (
                      <button
                        onClick={resetDay}
                        title="Restablecer al horario general"
                        className="text-xs text-white/30 hover:text-red-400 transition px-2 py-1 rounded-lg border border-[#3d2020] hover:border-red-400"
                      >
                        ↺ general
                      </button>
                    ) : (
                      <span className="text-xs text-white/20">horario general</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Booking Link + QR */}
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold mb-2 text-white">Link de reservas</h3>
          <p className="text-sm text-white/40 mb-3">
            Comparte este link o el QR con tus clientes para que agenden en linea
          </p>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/booking` : "/booking"}
              className="flex-1 p-3 bg-[#1a0a0a] border border-[#3d2020] rounded-xl text-sm text-white/60"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/booking`)
              }}
              className="px-4 py-2 rounded-xl bg-[#e84118] text-white text-sm hover:bg-[#c0392b] transition"
            >
              Copiar
            </button>
          </div>

          {/* QR Code */}
          <div className="qr-container flex flex-col items-center gap-4 p-6 bg-white rounded-2xl">
            <QRCodeSVG
              value={typeof window !== "undefined" ? `${window.location.origin}/booking` : ""}
              size={200}
              bgColor="#ffffff"
              fgColor="#1a0a0a"
              level="H"
              imageSettings={{
                src: "/logo.png",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
            <p className="text-sm font-medium text-gray-600">Escanea para agendar tu cita</p>
          </div>
          <button
            onClick={() => {
              const svg = document.querySelector(".qr-container svg") as SVGSVGElement
              if (!svg) return
              const svgData = new XMLSerializer().serializeToString(svg)
              const canvas = document.createElement("canvas")
              canvas.width = 600
              canvas.height = 700
              const ctx = canvas.getContext("2d")
              if (!ctx) return
              const img = new window.Image()
              img.onload = () => {
                ctx.fillStyle = "#ffffff"
                ctx.fillRect(0, 0, 600, 700)
                ctx.drawImage(img, 100, 50, 400, 400)
                ctx.fillStyle = "#1a0a0a"
                ctx.font = "bold 28px sans-serif"
                ctx.textAlign = "center"
                ctx.fillText("Frailin Studio", 300, 510)
                ctx.font = "18px sans-serif"
                ctx.fillStyle = "#666666"
                ctx.fillText("Escanea para agendar tu cita", 300, 550)
                ctx.fillText(window.location.origin + "/booking", 300, 590)
                const link = document.createElement("a")
                link.download = "frailin-studio-qr.png"
                link.href = canvas.toDataURL("image/png")
                link.click()
              }
              img.src = "data:image/svg+xml;base64," + btoa(decodeURIComponent(encodeURIComponent(svgData).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))))
            }}
            className="w-full mt-4 py-3 rounded-xl border border-[#3d2020] text-white text-sm hover:bg-[#1a0a0a] transition font-medium"
          >
            Descargar QR como imagen
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[#e84118] text-white font-semibold hover:bg-[#c0392b] transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  )
}
