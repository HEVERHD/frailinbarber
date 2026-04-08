"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  CheckCircle,
  Users,
  Zap,
  Target,
  Clock,
  Star,
} from "lucide-react"

type Stats = {
  monthRevenue: number
  prevMonthRevenue: number
  revenueTrend: number | null
  completedCount: number
  prevCompletedCount: number
  completedTrend: number | null
  avgTicket: number
  prevAvgTicket: number
  monthProjection: number
  noShowCount: number
  noShowRate: string
  topService: string
  newClientsCount: number
  returningClientsCount: number
  todayAppointments: any[]
  monthlyRevenue: { month: string; revenue: number }[]
  byWeekday: { day: string; count: number }[]
  byService: { name: string; count: number; revenue: number }[]
  byHour: { hour: number; label: string; count: number }[]
  topClients: { name: string; count: number; revenue: number }[]
}

const PIE_COLORS = ["#e84118", "#f0932b", "#e55039", "#c0392b", "#a93226"]

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v)

const fmtShort = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}K`
    : `$${v}`

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-white/25">sin datos ant.</span>
  if (value === 0) return (
    <span className="flex items-center gap-1 text-xs text-white/40">
      <Minus size={11} /> igual que antes
    </span>
  )
  const up = value > 0
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{value}% vs mes ant.
    </span>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  accent,
}: {
  icon: any
  label: string
  value: string
  sub?: string
  trend?: number | null
  accent?: boolean
}) {
  return (
    <div className={`relative rounded-2xl p-5 border overflow-hidden ${
      accent
        ? "bg-gradient-to-br from-[#e84118]/20 to-[#1a0808] border-[#e84118]/40"
        : "bg-[#111] border-white/8"
    }`}>
      {accent && <div className="absolute inset-0 bg-[#e84118]/5 pointer-events-none" />}
      <div className="relative">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-[#e84118]/20" : "bg-white/5"}`}>
          <Icon size={16} className={accent ? "text-[#e84118]" : "text-white/50"} />
        </div>
        <p className="text-xs text-white/40 mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-none mb-2">{value}</p>
        {sub && <p className="text-xs text-white/30 mb-1">{sub}</p>}
        {trend !== undefined && <Trend value={trend ?? null} />}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-white/50 mb-1 text-xs">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold text-white">
          {typeof p.value === "number" && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const SkeletonCard = () => (
  <div className="bg-[#111] rounded-2xl p-5 border border-white/8 animate-pulse">
    <div className="w-9 h-9 rounded-xl bg-white/5 mb-3" />
    <div className="h-3 w-20 bg-white/5 rounded mb-2" />
    <div className="h-7 w-28 bg-white/5 rounded mb-2" />
    <div className="h-3 w-24 bg-white/5 rounded" />
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-36 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-4 w-52 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-[#111] rounded-2xl p-6 border border-white/8 animate-pulse">
              <div className="h-5 w-40 bg-white/5 rounded mb-4" />
              <div className="h-[240px] bg-white/3 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const totalClients = stats.newClientsCount + stats.returningClientsCount
  const maxHourCount = Math.max(...stats.byHour.map((h) => h.count), 1)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-sm text-white/35 mt-1">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {stats.monthProjection > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-[#e84118]/10 border border-[#e84118]/25 rounded-xl px-4 py-2.5">
            <Target size={14} className="text-[#e84118]" />
            <div>
              <p className="text-[10px] text-white/40 leading-none mb-0.5">Proyección del mes</p>
              <p className="text-sm font-bold text-[#e84118] leading-none">{fmtShort(stats.monthProjection)}</p>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          icon={DollarSign}
          label="Ingresos del mes"
          value={fmtShort(stats.monthRevenue)}
          sub={`Ant: ${fmtShort(stats.prevMonthRevenue)}`}
          trend={stats.revenueTrend}
          accent
        />
        <KpiCard
          icon={CheckCircle}
          label="Citas completadas"
          value={stats.completedCount.toString()}
          sub={`Ant: ${stats.prevCompletedCount}`}
          trend={stats.completedTrend}
        />
        <KpiCard
          icon={Zap}
          label="Ticket promedio"
          value={fmtShort(stats.avgTicket)}
          sub={`Ant: ${fmtShort(stats.prevAvgTicket)}`}
        />
        <KpiCard
          icon={Users}
          label="Clientes del mes"
          value={totalClients.toString()}
          sub={`${stats.newClientsCount} nuevos · ${stats.returningClientsCount} recurrentes`}
        />
        <KpiCard
          icon={Star}
          label="Servicio estrella"
          value={stats.topService}
        />
        <KpiCard
          icon={Clock}
          label="No-shows"
          value={`${stats.noShowCount}`}
          sub={`${stats.noShowRate}% del total`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue area chart */}
        <div className="lg:col-span-2 bg-[#111] rounded-2xl p-6 border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-white">Ingresos</p>
              <p className="text-xs text-white/30 mt-0.5">Últimos 6 meses</p>
            </div>
            <span className="text-xs text-white/20 bg-white/5 px-3 py-1.5 rounded-lg">USD</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e84118" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#e84118" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#e84118"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ fill: "#e84118", r: 4 }}
                activeDot={{ r: 6, fill: "#e84118" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service breakdown pie */}
        <div className="bg-[#111] rounded-2xl p-6 border border-white/8">
          <p className="font-bold text-white mb-1">Servicios</p>
          <p className="text-xs text-white/30 mb-5">Ingresos del mes</p>
          {stats.byService.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-white/20 text-sm">Sin datos este mes</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.byService}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {stats.byService.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => fmt(v)}
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff15", borderRadius: "10px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {stats.byService.slice(0, 4).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-white/60 truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{s.count} citas</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Heatmap by hour */}
        <div className="bg-[#111] rounded-2xl p-6 border border-white/8">
          <p className="font-bold text-white mb-1">Horas pico</p>
          <p className="text-xs text-white/30 mb-5">Distribución de citas — últimos 30 días</p>
          {stats.byHour.every((h) => h.count === 0) ? (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-white/20 text-sm">Sin datos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.byHour.map((h) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/35 w-12 shrink-0 text-right">{h.label}</span>
                  <div className="flex-1 h-5 bg-white/4 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max((h.count / maxHourCount) * 100, h.count > 0 ? 4 : 0)}%`,
                        background: h.count / maxHourCount > 0.7
                          ? "#e84118"
                          : h.count / maxHourCount > 0.4
                          ? "#f0932b"
                          : "#e8411855",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-white/40 w-5 shrink-0">{h.count || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekday bar chart */}
        <div className="bg-[#111] rounded-2xl p-6 border border-white/8">
          <p className="font-bold text-white mb-1">Días más activos</p>
          <p className="text-xs text-white/30 mb-5">Citas por día — últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byWeekday} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="day" stroke="#555" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff06" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stats.byWeekday.map((entry, i) => {
                  const max = Math.max(...stats.byWeekday.map((d) => d.count))
                  return <Cell key={i} fill={entry.count === max ? "#e84118" : "#e8411840"} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="bg-[#111] rounded-2xl p-6 border border-white/8">
          <p className="font-bold text-white mb-1">Top clientes</p>
          <p className="text-xs text-white/30 mb-5">Últimos 3 meses · por citas completadas</p>
          {stats.topClients.length === 0 ? (
            <p className="text-white/20 text-sm py-8 text-center">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {stats.topClients.map((client, i) => (
                <div key={client.name + i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    i === 0 ? "bg-[#e84118] text-white" : "bg-white/8 text-white/60"
                  }`}>
                    {i === 0 ? "👑" : (client.name[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                    <p className="text-xs text-white/30">{client.count} citas</p>
                  </div>
                  <span className="text-sm font-bold text-[#e84118] shrink-0">{fmtShort(client.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today */}
        <div className="bg-[#111] rounded-2xl p-6 border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-white">Citas de hoy</p>
              <p className="text-xs text-white/30 mt-0.5">{stats.todayAppointments.length} agendadas</p>
            </div>
            {stats.todayAppointments.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-white/30">Total estimado</p>
                <p className="text-sm font-bold text-[#e84118]">
                  {fmt(stats.todayAppointments.filter(a => a.status !== "CANCELLED").reduce((s: number, a: any) => s + (a.service?.price || 0), 0))}
                </p>
              </div>
            )}
          </div>
          {stats.todayAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">✂️</p>
              <p className="text-white/25 text-sm">Sin citas para hoy</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {stats.todayAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                  <div className="w-9 h-9 bg-[#e84118]/15 rounded-full flex items-center justify-center text-sm font-bold text-[#e84118] shrink-0">
                    {(apt.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{apt.user?.name || "Cliente"}</p>
                    <p className="text-xs text-white/35">{apt.service?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-white">
                      {new Date(apt.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      apt.status === "COMPLETED" ? "bg-emerald-900/50 text-emerald-400"
                      : apt.status === "CONFIRMED" ? "bg-blue-900/50 text-blue-400"
                      : "bg-yellow-900/50 text-yellow-400"
                    }`}>
                      {apt.status === "COMPLETED" ? "Listo" : apt.status === "CONFIRMED" ? "Confirmada" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
