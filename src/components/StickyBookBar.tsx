"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "@phosphor-icons/react"

export default function StickyBookBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/95 to-transparent transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/booking"
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-bold py-4 rounded-2xl text-base shadow-2xl shadow-[#e84118]/30 active:scale-[0.98] transition-transform"
      >
        Agendar mi cita
        <ArrowUpRight weight="duotone" size={18} />
      </Link>
    </div>
  )
}
