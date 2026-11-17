"use client"

import { useEffect, useState } from "react"
import { getSeason, isSeason, type Season } from "@/lib/season-shared"

export {
  getSeason, daysUntilNewYear, upcomingYear, isSeason, SEASONS, SEASON_LABELS, type Season,
} from "@/lib/season-shared"

export type SeasonInfo = {
  // Tema forzado desde Ajustes del dashboard (null = automático por fecha)
  override: Season | null
  // Cupos libres por fecha (YYYY-MM-DD) para el 24 y el 31 de diciembre
  cupos: Record<string, number> | null
}

// One request per page load, shared by every component that asks
let infoPromise: Promise<SeasonInfo> | null = null
function loadSeasonInfo(): Promise<SeasonInfo> {
  infoPromise ??= fetch("/api/season")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((d) => ({ override: isSeason(d?.override) ? d.override : null, cupos: d?.cupos ?? null }))
  return infoPromise
}

function readPreviewParam(): Season | null {
  let preview: string | null = new URLSearchParams(window.location.search).get("tema")
  try {
    if (preview) sessionStorage.setItem("tema", preview)
    else preview = sessionStorage.getItem("tema")
  } catch {}
  return isSeason(preview) ? preview : null
}

/**
 * Temporada activa. Prioridad: `?tema=` en la URL (vista previa, se conserva en
 * la pestaña) → tema forzado desde Ajustes → fecha.
 */
export function useSeasonInfo(): { season: Season; cupos: SeasonInfo["cupos"] } {
  const [season, setSeason] = useState<Season>(() => getSeason())
  const [cupos, setCupos] = useState<SeasonInfo["cupos"]>(null)

  useEffect(() => {
    const preview = readPreviewParam()
    if (preview) setSeason(preview)
    let alive = true
    loadSeasonInfo().then((info) => {
      if (!alive) return
      setCupos(info.cupos)
      if (!preview && info.override) setSeason(info.override)
    })
    return () => { alive = false }
  }, [])

  return { season, cupos }
}

export function useSeason(): Season {
  return useSeasonInfo().season
}
