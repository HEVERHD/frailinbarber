"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

export default function ParallaxBg() {
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
        overlayRef.current.style.opacity = String(0.55 + extraDark)
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
          src="/hallowenpaper.webp"
          alt=""
          fill
          className="object-cover"
          style={{ filter: "saturate(0.75) brightness(0.85)" }}
          priority
        />
      </div>
      {/* Dark purple horror overlay — starts at 55% opacity, darkens on scroll */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #0a0018 0%, #050010 45%, #110008 100%)",
          opacity: 0.55,
        }}
      />
      {/* Subtle purple color bleed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(60,0,90,0.18)" }}
      />
    </div>
  )
}
