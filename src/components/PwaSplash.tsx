"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

// Only appears when the installed PWA is cold-launched from the home screen —
// deliberately held for a few seconds so the brand moment actually registers,
// instead of flashing by unnoticed.
const DISPLAY_MS = 3000
const FADE_MS = 350

export default function PwaSplash() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [shopName, setShopName] = useState("")

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    if (!standalone) return

    setVisible(true)
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => { if (s?.shopName) setShopName(s.shopName) })
      .catch(() => {})

    const fadeTimer = setTimeout(() => setFading(true), DISPLAY_MS - FADE_MS)
    const hideTimer = setTimeout(() => setVisible(false), DISPLAY_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes splash-ring-cw  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes splash-ring-ccw { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }
        @keyframes splash-glow     { 0%, 100% { opacity: .35; transform: scale(1) } 50% { opacity: .7; transform: scale(1.15) } }
        @keyframes splash-logo-in  { from { opacity: 0; transform: scale(.7) } to { opacity: 1; transform: scale(1) } }
        @keyframes splash-text-in  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes splash-bar-fill { from { width: 0% } to { width: 100% } }
        .splash-ring-cw  { animation: splash-ring-cw 3s linear infinite; }
        .splash-ring-ccw { animation: splash-ring-ccw 2.2s linear infinite; }
        .splash-glow     { animation: splash-glow 1.8s ease-in-out infinite; }
        .splash-logo     { animation: splash-logo-in .6s cubic-bezier(.16,1,.3,1) both; }
        .splash-text     { animation: splash-text-in .6s ease .4s both; }
        .splash-bar-fill { animation: splash-bar-fill ${DISPLAY_MS - FADE_MS}ms linear forwards; }
      `}</style>
      <div
        className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0505] transition-opacity duration-300 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Ambient glow */}
        <div className="absolute w-72 h-72 rounded-full bg-[#e84118]/10 blur-[100px] pointer-events-none" />

        {/* HUD circle around the logo — echoes the hero's visual language */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-7">
          <div className="splash-ring-cw absolute inset-0 rounded-full border border-dashed border-[#e84118]/25" />
          <div className="splash-ring-ccw absolute inset-[10%] rounded-full border border-[#e84118]/35" />
          <div
            className="splash-glow absolute inset-[18%] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(232,65,24,0.35) 0%, transparent 70%)" }}
          />

          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#e84118]/50 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#e84118]/50 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#e84118]/50 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#e84118]/50 rounded-br-lg" />

          <div className="splash-logo relative z-10 w-16 h-16">
            <Image
              src="/logo2.png"
              alt=""
              fill
              className="object-contain"
              style={{ filter: "drop-shadow(0 0 14px rgba(232,65,24,0.5))" }}
            />
          </div>
        </div>

        {/* Shop name */}
        <p className="splash-text text-white/70 text-xs font-bold tracking-[0.3em] uppercase mb-8">
          {shopName || "Frailin Studio"}
        </p>

        {/* Progress bar — fills across the whole display window */}
        <div className="splash-text w-40 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="splash-bar-fill h-full bg-gradient-to-r from-[#e84118] to-[#f59e0b] rounded-full" />
        </div>
      </div>
    </>
  )
}
