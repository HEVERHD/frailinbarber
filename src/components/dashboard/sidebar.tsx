"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/appointments", label: "Citas", icon: "📅" },
  { href: "/clients", label: "Clientes", icon: "👥" },
  { href: "/services", label: "Servicios", icon: "✂️" },
  { href: "/blocked-slots", label: "Bloqueos", icon: "🚫" },
  { href: "/users", label: "Usuarios", icon: "🔑" },
  { href: "/profile", label: "Mi Perfil", icon: "👤" },
  { href: "/settings", label: "Configuración", icon: "⚙️" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a0a0a] text-white min-h-screen p-6 border-r border-[#3d2020]">
        <div className="mb-10 flex items-center gap-3">
          <Image src="/logo.png" alt="Frailin Studio" width={36} height={36} className="rounded-lg" />
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-[#e84118]">Frailin</span> Studio
            </h1>
            <p className="text-xs text-white/30">Panel de administración</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-[#e84118]/20 text-[#e84118]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span suppressHydrationWarning>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-[#3d2020]">
          <Link
            href="/booking"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            <span suppressHydrationWarning>🔗</span>
            Link de Booking
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition"
          >
            <span suppressHydrationWarning>🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a0a0a] border-t border-[#3d2020] z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition ${
                pathname === item.href ? "text-[#e84118]" : "text-white/50"
              }`}
            >
              <span className="text-lg" suppressHydrationWarning>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
