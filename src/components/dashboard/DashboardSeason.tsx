"use client"

import { useSeason, daysUntilNewYear, upcomingYear, type Season } from "@/lib/season"
import { getColombiaDateStr } from "@/lib/utils"

// Tema del panel: discreto para no estorbar el trabajo. Solo Navidad / Año Nuevo.
export function useDashboardSeason(): "navidad" | "anoNuevo" | null {
  const season: Season = useSeason()
  return season === "navidad" || season === "anoNuevo" ? season : null
}

const XMAS_COLORS = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#f8fafc"]
const NEW_YEAR_COLORS = ["#facc15", "#fde68a", "#f8fafc", "#fbbf24"]

const DASH_STYLES = `
  @keyframes ds-bulb-glow {
    0%, 100% { opacity: 1;    filter: brightness(1.15); }
    50%      { opacity: 0.35; filter: brightness(0.6); }
  }
  @keyframes ds-snow-fall {
    0%   { transform: translateY(-20px); }
    100% { transform: translateY(105vh); }
  }
  @keyframes ds-snow-sway {
    0%, 100% { transform: translateX(-8px); }
    50%      { transform: translateX(8px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ds-flake { display: none; }
    .ds-bulb  { animation: none !important; }
  }
`

/** Hilera de luces colgando a lo ancho del contenedor (que debe ser `relative`) */
export function SeasonLights({ season, segments = 3, className = "" }: {
  season: "navidad" | "anoNuevo"
  segments?: number
  className?: string
}) {
  const colors = season === "anoNuevo" ? NEW_YEAR_COLORS : XMAS_COLORS
  const SAG = 7
  const PER = 4
  const w = 100 / segments
  let d = "M 0 1"
  for (let s = 0; s < segments; s++) d += ` Q ${s * w + w / 2} ${1 + 2 * SAG} ${(s + 1) * w} 1`
  const bulbs = Array.from({ length: segments * PER }, (_, i) => {
    const t = ((i % PER) + 0.5) / PER
    return { x: ((Math.floor(i / PER) + t) / segments) * 100, y: 1 + 4 * SAG * t * (1 - t), i }
  })

  return (
    <div className={`absolute left-0 right-0 pointer-events-none ${className}`} style={{ height: SAG + 16 }} aria-hidden>
      <style>{DASH_STYLES}</style>
      <svg className="absolute inset-x-0 top-0 w-full" height={SAG + 4} viewBox={`0 0 100 ${SAG + 4}`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke="#14532d" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b) => {
        const color = colors[b.i % colors.length]
        return (
          <div key={b.i} className="absolute flex flex-col items-center" style={{ left: `${b.x}%`, top: b.y, transform: "translateX(-50%)" }}>
            <div className="w-[3px] h-[2px] rounded-[1px] bg-[#3f3f46]" />
            <div
              className="ds-bulb w-[5px] h-[8px]"
              style={{
                borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 45%, ${color} 100%)`,
                boxShadow: `0 0 5px 1px ${color}99`,
                animation: `ds-bulb-glow 2.2s ${(b.i % 3) * 0.7}s ease-in-out infinite`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

/** Gorro navideño (o destello dorado en Año Nuevo) sobre el logo; el padre debe ser `relative` */
export function LogoAccent({ season, size }: { season: "navidad" | "anoNuevo"; size: number }) {
  if (season === "anoNuevo") {
    return (
      <span className="absolute -top-1.5 -right-1.5 pointer-events-none select-none" style={{ fontSize: size * 0.45 }} aria-hidden>
        ✨
      </span>
    )
  }
  const s = size * 0.7
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ width: s, height: s, top: -s * 0.55, right: -s * 0.3, transform: "rotate(18deg)" }}
      viewBox="0 0 40 40"
      aria-hidden
    >
      <path d="M6 30 C10 14 20 4 32 8 C27 12 26 20 30 30 Z" fill="#dc2626" />
      <path d="M6 30 C10 14 20 4 32 8" fill="none" stroke="#991b1b" strokeWidth="1.2" opacity="0.6" />
      <rect x="3" y="28" width="30" height="7" rx="3.5" fill="#f8fafc" />
      <circle cx="33" cy="8" r="4.2" fill="#f8fafc" />
    </svg>
  )
}

const FLAKES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 41 + 7) % 100}%`,
  size: 2 + (i % 3),
  dur: `${14 + (i % 5) * 2.5}s`,
  delay: `-${(i * 2.3) % 18}s`,
  sway: `${5 + (i % 3) * 2}s`,
  opacity: 0.18 + (i % 4) * 0.07,
}))

/** Fondo del panel: resplandores y nieve suave DETRÁS del contenido (z-0) */
export function DashboardSeasonBackdrop() {
  const season = useDashboardSeason()
  if (!season) return null
  const newYear = season === "anoNuevo"

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      <style>{DASH_STYLES}</style>
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: newYear ? "rgba(250,204,21,0.07)" : "rgba(220,38,38,0.08)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: newYear ? "rgba(251,191,36,0.06)" : "rgba(22,163,74,0.08)" }}
      />
      {FLAKES.map((f, i) => {
        const gold = newYear && i % 2 === 0
        return (
          <div key={i} className="ds-flake absolute" style={{ left: f.left, top: -20, animation: `ds-snow-fall ${f.dur} ${f.delay} linear infinite` }}>
            <div style={{ animation: `ds-snow-sway ${f.sway} ease-in-out infinite` }}>
              <div
                className="rounded-full"
                style={{
                  width: f.size,
                  height: f.size,
                  opacity: gold ? 0.5 : f.opacity,
                  background: gold ? "#facc15" : "#fff",
                  boxShadow: gold ? "0 0 5px #f59e0b" : "0 0 3px rgba(255,255,255,0.6)",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Saludo de temporada con cuenta regresiva, para el encabezado del dashboard */
export function SeasonGreeting() {
  const season = useDashboardSeason()
  if (!season) return null

  const year = upcomingYear()
  let text: string
  if (season === "anoNuevo") {
    text = `🎆 ¡Feliz ${year}! Que este año venga lleno de cortes`
  } else {
    const [y, m, d] = getColombiaDateStr(new Date()).split("-").map(Number)
    const toXmas = Math.round((Date.UTC(y, 11, 25) - Date.UTC(y, m - 1, d)) / 86_400_000)
    const toNewYear = daysUntilNewYear()
    text =
      toXmas > 0
        ? `🎄 Faltan ${toXmas} ${toXmas === 1 ? "día" : "días"} para Navidad · ${toNewYear} para el ${year}`
        : toXmas === 0
          ? `🎄 ¡Feliz Navidad! · ${toNewYear} días para el ${year}`
          : `🥂 ${toNewYear === 1 ? "Mañana arranca" : `Faltan ${toNewYear} días para`} el ${year}`
  }

  return (
    <p
      className={`inline-flex items-center mt-2 text-xs font-semibold rounded-full px-3 py-1 border ${
        season === "anoNuevo"
          ? "text-[#facc15] bg-[#facc15]/10 border-[#facc15]/25"
          : "text-emerald-300 bg-emerald-500/10 border-emerald-500/25"
      }`}
    >
      {text}
    </p>
  )
}
