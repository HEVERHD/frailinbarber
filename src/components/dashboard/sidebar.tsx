"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Ban,
  ImageIcon,
  Clock,
  KeyRound,
  UserCircle,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/appointments", label: "Citas", Icon: CalendarDays },
  { href: "/clients", label: "Clientes", Icon: Users },
  { href: "/services", label: "Servicios", Icon: Scissors },
  { href: "/gallery", label: "Galería", Icon: ImageIcon },
  { href: "/waitlist", label: "Lista espera", Icon: Clock },
  { href: "/blocked-slots", label: "Bloqueos", Icon: Ban },
  { href: "/users", label: "Usuarios", Icon: KeyRound },
  { href: "/profile", label: "Mi Perfil", Icon: UserCircle },
  { href: "/settings", label: "Configuración", Icon: Settings },
]

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/appointments", label: "Citas", Icon: CalendarDays },
  { href: "/clients", label: "Clientes", Icon: Users },
  { href: "/services", label: "Servicios", Icon: Scissors },
  { href: "/gallery", label: "Galería", Icon: ImageIcon },
]

export function Sidebar() {
  const [ready, setReady] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setReady(true)
  }, [])

  // Return nothing on server - avoids ALL hydration issues
  if (!ready) return null

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a0a0a] border-b border-[#3d2020] z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Frailin Studio" width={28} height={28} className="rounded-lg" />
            <h1 className="text-sm font-bold text-white">
              <span className="text-[#e84118]">Frailin</span> Studio
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/users"
              className={`p-2.5 rounded-xl transition ${
                pathname === "/users"
                  ? "text-[#e84118] bg-[#e84118]/15"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <KeyRound size={18} />
            </Link>
            <Link
              href="/settings"
              className={`p-2.5 rounded-xl transition ${
                pathname === "/settings"
                  ? "text-[#e84118] bg-[#e84118]/15"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={18} />
            </Link>
            <Link
              href="/profile"
              className={`p-1.5 rounded-xl transition ${
                pathname === "/profile"
                  ? "bg-[#e84118]/15 ring-2 ring-[#e84118]/50"
                  : "hover:bg-white/5"
              }`}
            >
              <UserCircle size={24} className="text-white/60" />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a0a0a] text-white min-h-screen p-6 border-r border-[#3d2020]">
        <div className="mb-10 flex items-center gap-3">
          <img src="/logo.png" alt="Frailin Studio" width={36} height={36} className="rounded-lg" />
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
              <item.Icon size={18} />
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
            <ExternalLink size={18} />
            Link de Booking
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a0a0a] border-t border-[#3d2020] z-50">
        <div className="flex justify-around py-2">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-2 text-xs transition ${
                pathname === item.href ? "text-[#e84118]" : "text-white/50"
              }`}
            >
              <item.Icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
