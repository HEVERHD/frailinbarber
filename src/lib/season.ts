"use client"

import { useEffect, useState } from "react"
import { getColombiaDateStr } from "@/lib/utils"

// Temporadas del sitio, en hora de Colombia:
// - fiestas:   1–15 nov  (Independencia de Cartagena)
// - navidad:   16 nov – 31 dic
// - anoNuevo:  1–6 ene   (hasta Reyes)
// - default:   resto del año
export type Season = "fiestas" | "navidad" | "anoNuevo" | "default"

const SEASONS: Season[] = ["fiestas", "navidad", "anoNuevo", "default"]

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

/**
 * Temporada activa. Acepta `?tema=navidad` (o fiestas / anoNuevo / default)
 * en la URL para previsualizar un tema antes de su fecha. La vista previa se
 * conserva en la pestaña (sessionStorage) al navegar de home a /booking.
 */
export function useSeason(): Season {
  const [season, setSeason] = useState<Season>(() => getSeason())

  useEffect(() => {
    let override = new URLSearchParams(window.location.search).get("tema") as Season | null
    try {
      if (override) sessionStorage.setItem("tema", override)
      else override = sessionStorage.getItem("tema") as Season | null
    } catch {}
    if (override && SEASONS.includes(override)) setSeason(override)
  }, [])

  return season
}
