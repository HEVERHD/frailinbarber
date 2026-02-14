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
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020]">
              <div className="animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-[#3d2020] mb-2" />
                <div className="h-3 w-20 bg-[#3d2020] rounded mb-2" />
                <div className="h-6 w-28 bg-[#3d2020] rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
              <div className="animate-pulse">
                <div className="h-5 w-40 bg-[#3d2020] rounded mb-4" />
                <div className="h-[250px] bg-[#3d2020]/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <div className="animate-pulse">
            <div className="h-5 w-32 bg-[#3d2020] rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#1a0a0a] rounded-lg border border-[#3d2020]">
                  <div className="w-10 h-10 bg-[#3d2020] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-[#3d2020] rounded mb-2" />
                    <div className="h-3 w-24 bg-[#3d2020] rounded" />
                  </div>
                  <div className="h-4 w-16 bg-[#3d2020] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  const kpis = [
    { label: "Ingresos del mes", value: formatCurrency(stats.monthRevenue), icon: "💰" },
    { label: "Citas completadas", value: stats.completedCount.toString(), icon: "✅" },
    { label: "No-shows", value: `${stats.noShowCount} (${stats.noShowRate}%)`, icon: "❌" },
    { label: "Servicio top", value: stats.topService, icon: "⭐" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020]"
          >
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-sm text-white/50">{kpi.label}</p>
            <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold text-white mb-4">Ingresos últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d2020" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ background: "#1a0a0a", border: "1px solid #3d2020", borderRadius: "8px", color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#e84118"
                strokeWidth={3}
                dot={{ fill: "#e84118" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
          <h3 className="font-semibold text-white mb-4">Citas por día de la semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.byWeekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d2020" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ background: "#1a0a0a", border: "1px solid #3d2020", borderRadius: "8px", color: "#fff" }}
              />
              <Bar dataKey="count" fill="#f0932b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
        <h3 className="font-semibold text-white mb-4">Citas de hoy</h3>
        {stats.todayAppointments.length === 0 ? (
          <p className="text-white/30 text-sm">No hay citas para hoy</p>
        ) : (
          <div className="space-y-3">
            {stats.todayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-[#1a0a0a] rounded-lg border border-[#3d2020]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e84118]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#e84118]">
                    {(apt.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{apt.user?.name || "Cliente"}</p>
                    <p className="text-xs text-white/40">{apt.service?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-white">
                    {new Date(apt.date).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === "COMPLETED"
                        ? "bg-green-900/50 text-green-400"
                        : apt.status === "CONFIRMED"
                        ? "bg-blue-900/50 text-blue-400"
                        : "bg-yellow-900/50 text-yellow-400"
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
