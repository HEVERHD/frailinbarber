"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface SiteNavProps {
  shopName: string
}

export default function SiteNav({ shopName }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-black/25 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo2.png" alt={shopName} width={32} height={32} />
          <span className="font-bold tracking-wide text-white">{shopName}</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#servicios" className="hidden sm:block text-sm text-white/50 hover:text-white transition font-medium">
            Servicios
          </a>
          <a href="#ubicacion" className="hidden sm:block text-sm text-white/50 hover:text-white transition font-medium">
            Ubicación
          </a>
          <Link
            href="/booking"
            className="bg-[#e84118] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#c0392b] transition-all hover:shadow-lg hover:shadow-[#e84118]/20"
          >
            Agendar
          </Link>
          <Link href="/login" className="text-xs text-white/20 hover:text-white/50 transition">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
