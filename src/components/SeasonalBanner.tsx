"use client"

import FiestasCartagenaBanner from "./FiestasCartagenaBanner"
import DefaultBanner from "./DefaultBanner"

// Fiestas de Independencia de Cartagena — 1 al 15 de noviembre
function isFiestasSeason() {
  const d = new Date()
  return d.getMonth() === 10 && d.getDate() >= 1 && d.getDate() <= 15
}

export default function SeasonalBanner() {
  return isFiestasSeason() ? <FiestasCartagenaBanner /> : <DefaultBanner />
}
