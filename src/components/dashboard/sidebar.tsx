"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/appointments", label: "Citas", icon: "📅" },
  { href: "/services", label: "Servicios", icon: "✂️" },
  { href: "/settings", label: "Configuración", icon: "⚙️" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1a2e] text-white min-h-screen p-6">
        <div className="mb-10">
          <h1 className="text-xl font-bold">
            <span className="text-[#c9a96e]">Barber</span>App
          </h1>
          <p className="text-xs text-white/40 mt-1">Panel de administración</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-[#c9a96e]/20 text-[#c9a96e]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <Link
            href="/booking"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            <span>🔗</span>
            Link de Booking
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition"
          >
            <span>🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition ${
                pathname === item.href ? "text-[#c9a96e]" : "text-white/50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
