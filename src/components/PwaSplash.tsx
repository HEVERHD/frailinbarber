"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

// Only appears when the installed PWA is cold-launched from the home screen —
// makes the opening moment feel like a native app instead of a browser tab.
export default function PwaSplash() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    if (!standalone) return

    setVisible(true)
    const fadeTimer = setTimeout(() => setFading(true), 650)
    const hideTimer = setTimeout(() => setVisible(false), 950)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <Image src="/logo2.png" alt="" width={88} height={88} className="animate-pulse" />
        <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#e84118] animate-spin" />
      </div>
    </div>
  )
}
