"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useSeason } from "@/lib/season"

export default function ParallaxBg() {
  const season = useSeason()
  const isXmas = season === "navidad" || season === "anoNuevo"
  const imgRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (!imgRef.current) return

      // Zoom out from 1.15 → 1.0 over first 800px of scroll (depth illusion)
      const scale = Math.max(1.0, 1.15 - y * 0.00019)
      // Slight upward drift as page scrolls (slow parallax)
      const translateY = y * 0.18
      imgRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`

      // Overlay darkens a bit as you scroll past the hero
      if (overlayRef.current) {
        const extraDark = Math.min(0.16, y * 0.00016)
        overlayRef.current.style.opacity = String(0.65 + extraDark)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    // Run once to set initial state
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        ref={imgRef}
        className="absolute inset-[-15%]"
        style={{ willChange: "transform", transformOrigin: "center center" }}
      >
        <Image
          src="/barberia.jpg"
          alt=""
          fill
          className="object-cover"
          style={{ filter: "saturate(0.85) brightness(0.8)" }}
          priority
        />
      </div>
      {/* Dark navy night-sky overlay — starts at 65% opacity, darkens on scroll */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #000a1a 0%, #000510 45%, #001025 100%)",
          opacity: 0.65,
        }}
      />
      {/* Color bleed — blue night sky by default; Navidad adds warm red + pine green light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isXmas
            ? "radial-gradient(ellipse at 15% 10%, rgba(185,28,28,0.22) 0%, transparent 55%), radial-gradient(ellipse at 90% 85%, rgba(21,128,61,0.22) 0%, transparent 55%), rgba(0,15,40,0.15)"
            : "rgba(0,15,60,0.20)",
        }}
      />
    </div>
  )
}
