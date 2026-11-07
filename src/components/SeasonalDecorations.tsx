"use client"

import FiestasCartagenaDecorations from "./FiestasCartagenaDecorations"

function isFiestasSeason() {
  const d = new Date()
  return d.getMonth() === 10 && d.getDate() >= 1 && d.getDate() <= 15
}

export default function SeasonalDecorations() {
  return isFiestasSeason() ? <FiestasCartagenaDecorations /> : null
}
