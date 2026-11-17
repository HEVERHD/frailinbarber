"use client"

import FiestasCartagenaBanner from "./FiestasCartagenaBanner"
import NavidadBanner from "./NavidadBanner"
import DefaultBanner from "./DefaultBanner"
import { useSeasonInfo } from "@/lib/season"

export default function SeasonalBanner() {
  const { season, cupos } = useSeasonInfo()
  if (season === "fiestas") return <FiestasCartagenaBanner />
  if (season === "navidad") return <NavidadBanner cupos={cupos} />
  if (season === "anoNuevo") return <NavidadBanner newYear />
  return <DefaultBanner />
}
