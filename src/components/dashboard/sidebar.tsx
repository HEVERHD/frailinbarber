"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
  Bell,
  BellOff,
} from "lucide-react"

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, roles: ["ADMIN", "BARBER"] },
  { href: "/appointments", label: "Citas", Icon: CalendarDays, roles: ["ADMIN", "BARBER"] },
  { href: "/clients", label: "Clientes", Icon: Users, roles: ["ADMIN"] },
  { href: "/services", label: "Servicios", Icon: Scissors, roles: ["ADMIN"] },
  { href: "/gallery", label: "Galería", Icon: ImageIcon, roles: ["ADMIN"] },
  { href: "/waitlist", label: "Lista espera", Icon: Clock, roles: ["ADMIN"] },
  { href: "/blocked-slots", label: "Bloqueos", Icon: Ban, roles: ["ADMIN", "BARBER"] },
  { href: "/users", label: "Usuarios", Icon: KeyRound, roles: ["ADMIN"] },
  { href: "/profile", label: "Mi Perfil", Icon: UserCircle, roles: ["ADMIN", "BARBER"] },
  { href: "/settings", label: "Configuración", Icon: Settings, roles: ["ADMIN", "BARBER"] },
]

const allMobileNavItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, roles: ["ADMIN", "BARBER"] },
  { href: "/appointments", label: "Citas", Icon: CalendarDays, roles: ["ADMIN", "BARBER"] },
  { href: "/clients", label: "Clientes", Icon: Users, roles: ["ADMIN"] },
  { href: "/services", label: "Servicios", Icon: Scissors, roles: ["ADMIN"] },
  { href: "/blocked-slots", label: "Bloqueos", Icon: Ban, roles: ["BARBER"] },
]

type PushState = "unsupported" | "denied" | "subscribed" | "unsubscribed"

async function subscribeToPush(): Promise<boolean> {
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    // Already subscribed, just save to DB
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: existing.endpoint, keys: { p256dh: arrayBufferToBase64(existing.getKey("p256dh")!), auth: arrayBufferToBase64(existing.getKey("auth")!) } }),
    })
    return true
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  })
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64(sub.getKey("p256dh")!), auth: arrayBufferToBase64(sub.getKey("auth")!) } }),
  })
  return true
}

async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  await sub.unsubscribe()
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}


export function Sidebar() {
  const [ready, setReady] = useState(false)
  const [pushState, setPushState] = useState<PushState>("unsubscribed")
  const [pushLoading, setPushLoading] = useState(false)
  const [showPwaHint, setShowPwaHint] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || "BARBER"

  useEffect(() => {
    setReady(true)
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushState("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setPushState("denied")
      return
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setPushState(sub ? "subscribed" : "unsubscribed")
      })
    )
  }, [])

  const handlePushToggle = async () => {
    if (pushLoading) return
    // On unsupported (iOS not installed as PWA), show hint instead
    if (pushState === "unsupported") {
      setShowPwaHint(true)
      setTimeout(() => setShowPwaHint(false), 5000)
      return
    }
    if (pushState === "denied") return
    setPushLoading(true)
    try {
      if (pushState === "subscribed") {
        await unsubscribeFromPush()
        setPushState("unsubscribed")
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") { setPushState("denied"); return }
        await subscribeToPush()
        setPushState("subscribed")
      }
    } catch (e) {
      console.error("Push error:", e)
    } finally {
      setPushLoading(false)
    }
  }

  // Return nothing on server - avoids ALL hydration issues
  if (!ready) return null

  const navItems = allNavItems.filter((item) => item.roles.includes(role))
  const mobileNavItems = allMobileNavItems.filter((item) => item.roles.includes(role))

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
          <div className="flex items-center gap-1 relative">
            {/* PWA install hint tooltip */}
            {showPwaHint && (
              <div className="absolute right-0 top-10 z-50 bg-[#2d1515] border border-[#e84118]/40 rounded-xl p-3 w-56 text-xs text-white/80 shadow-xl">
                <p className="font-semibold text-[#e84118] mb-1">Instala la app primero</p>
                <p>En Safari → <span className="font-medium">Compartir</span> → <span className="font-medium">Añadir a pantalla de inicio</span> → luego activa las notificaciones.</p>
              </div>
            )}
            {/* Push notification bell — always visible */}
            <button
              onClick={handlePushToggle}
              disabled={pushLoading || pushState === "denied"}
              title={
                pushState === "subscribed" ? "Desactivar notificaciones"
                : pushState === "denied" ? "Notificaciones bloqueadas"
                : pushState === "unsupported" ? "Instala la app para activar notificaciones"
                : "Activar notificaciones"
              }
              className={`p-2.5 rounded-xl transition ${
                pushState === "subscribed"
                  ? "text-[#e84118] bg-[#e84118]/15"
                  : pushState === "denied"
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {pushState === "subscribed" ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            {role === "ADMIN" && (
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
            )}
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
            <p className="text-xs text-white/30">
              {role === "ADMIN" ? "Administrador" : "Barbero"}
            </p>
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
          {/* Push notification toggle — always visible */}
          <button
            onClick={handlePushToggle}
            disabled={pushLoading || pushState === "denied"}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
              pushState === "subscribed"
                ? "text-[#e84118] hover:bg-[#e84118]/10"
                : pushState === "denied"
                ? "text-white/20 cursor-not-allowed"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {pushState === "subscribed" ? <Bell size={18} /> : <BellOff size={18} />}
            {pushState === "subscribed"
              ? "Notificaciones activas"
              : pushState === "denied"
              ? "Notificaciones bloqueadas"
              : pushState === "unsupported"
              ? "Notificaciones (instala la app)"
              : "Activar notificaciones"}
          </button>
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
