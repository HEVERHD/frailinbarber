"use client"

import FiestasCartagenaBanner from "./FiestasCartagenaBanner"
import NavidadBanner from "./NavidadBanner"
import DefaultBanner from "./DefaultBanner"
import { useSeason } from "@/lib/season"

export default function SeasonalBanner() {
  const season = useSeason()
  if (season === "fiestas") return <FiestasCartagenaBanner />
  if (season === "navidad") return <NavidadBanner />
  if (season === "anoNuevo") return <NavidadBanner newYear />
  return <DefaultBanner />
}
