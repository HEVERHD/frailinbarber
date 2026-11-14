"use client"

import FiestasCartagenaDecorations from "./FiestasCartagenaDecorations"
import NavidadDecorations from "./NavidadDecorations"
import { useSeason } from "@/lib/season"

export default function SeasonalDecorations() {
  const season = useSeason()
  if (season === "fiestas") return <FiestasCartagenaDecorations />
  if (season === "navidad") return <NavidadDecorations />
  if (season === "anoNuevo") return <NavidadDecorations newYear />
  return null
}
