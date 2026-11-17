import { getColombiaDateStr } from "@/lib/utils"

// Temporadas del sitio, en hora de Colombia:
// - fiestas:   1–15 nov  (Independencia de Cartagena)
// - navidad:   16 nov – 31 dic
// - anoNuevo:  1–6 ene   (hasta Reyes)
// - default:   resto del año
// Shared by server routes and client hooks (no "use client" here).
export type Season = "fiestas" | "navidad" | "anoNuevo" | "default"

export const SEASONS: readonly Season[] = ["fiestas", "navidad", "anoNuevo", "default"]

export const SEASON_LABELS: Record<Season, string> = {
  fiestas: "Fiestas de Independencia",
  navidad: "Navidad",
  anoNuevo: "Año Nuevo",
  default: "Sin tema",
}

export function isSeason(value: unknown): value is Season {
  return typeof value === "string" && (SEASONS as readonly string[]).includes(value)
}

export function getSeason(date: Date = new Date()): Season {
  const [, m, d] = getColombiaDateStr(date).split("-").map(Number)
  if (m === 11 && d <= 15) return "fiestas"
  if ((m === 11 && d >= 16) || m === 12) return "navidad"
  if (m === 1 && d <= 6) return "anoNuevo"
  return "default"
}

/** Días que faltan para el 1 de enero (0 si ya llegó) */
export function daysUntilNewYear(date: Date = new Date()): number {
  const [y, m, d] = getColombiaDateStr(date).split("-").map(Number)
  if (m === 1) return 0
  const today = Date.UTC(y, m - 1, d)
  const newYear = Date.UTC(y + 1, 0, 1)
  return Math.round((newYear - today) / 86_400_000)
}

/** Año que arranca: en diciembre es el siguiente, en enero el actual */
export function upcomingYear(date: Date = new Date()): number {
  const [y, m] = getColombiaDateStr(date).split("-").map(Number)
  return m === 1 ? y : y + 1
}
