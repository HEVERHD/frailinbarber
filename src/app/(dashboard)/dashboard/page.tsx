"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

type Stats = {
  monthRevenue: number
  completedCount: number
  noShowCount: number
  noShowRate: string
  topService: string
  todayAppointments: any[]
  monthlyRevenue: { month: string; revenue: number }[]
  byWeekday: { day: string; count: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando estadísticas...</p>
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)

  const kpis = [
    { label: "Ingresos del mes", value: formatCurrency(stats.monthRevenue), icon: "💰" },
    { label: "Citas completadas", value: stats.completedCount.toString(), icon: "✅" },
    { label: "No-shows", value: `${stats.noShowCount} (${stats.noShowRate}%)`, icon: "❌" },
    { label: "Servicio top", value: stats.topService, icon: "⭐" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="text-xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Ingresos últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#c9a96e"
                strokeWidth={3}
                dot={{ fill: "#c9a96e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Citas por día de la semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.byWeekday}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4">Citas de hoy</h3>
        {stats.todayAppointments.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay citas para hoy</p>
        ) : (
          <div className="space-y-3">
            {stats.todayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#c9a96e]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#c9a96e]">
                    {(apt.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{apt.user?.name || "Cliente"}</p>
                    <p className="text-xs text-gray-500">{apt.service?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {new Date(apt.date).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {apt.status === "COMPLETED"
                      ? "Completada"
                      : apt.status === "CONFIRMED"
                      ? "Confirmada"
                      : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
