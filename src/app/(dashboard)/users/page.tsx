"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"

type User = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  image: string | null
  role: string
  createdAt: string
  _count: { appointments: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  const changeRole = async (userId: string, newRole: string) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      toast(newRole === "BARBER" ? "Usuario promovido a Barbero" : "Rol cambiado a Cliente")
      fetchUsers()
    } else {
      const data = await res.json()
      toast(data.error || "Error al cambiar rol", "error")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-white/40 mt-1">Administra los roles de los usuarios</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#3d2020] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-36 bg-[#3d2020] rounded mb-2" />
                  <div className="h-3 w-48 bg-[#3d2020] rounded" />
                </div>
                <div className="h-8 w-24 bg-[#3d2020] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-[#2d1515] rounded-xl border border-[#3d2020]">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-white/30">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020]"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || ""}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#e84118]/20 rounded-full flex items-center justify-center text-lg font-bold text-[#e84118]">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">
                      {user.name || "Sin nombre"}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        user.role === "BARBER"
                          ? "bg-[#e84118]/20 text-[#e84118]"
                          : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {user.role === "BARBER" ? "Barbero" : "Cliente"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {user.email || "Sin email"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {user.phone && (
                      <p className="text-xs text-white/30">{user.phone}</p>
                    )}
                    <p className="text-xs text-white/30">
                      {user._count.appointments} citas
                    </p>
                    <p className="text-xs text-white/20">
                      Registro: {new Date(user.createdAt).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                </div>

                {/* Role toggle */}
                <div className="flex-shrink-0">
                  {user.role === "CLIENT" ? (
                    <button
                      onClick={() => changeRole(user.id, "BARBER")}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#e84118] text-white hover:bg-[#c0392b] transition"
                    >
                      Hacer Barbero
                    </button>
                  ) : (
                    <button
                      onClick={() => changeRole(user.id, "CLIENT")}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#3d2020] text-white/50 hover:bg-[#4d2c2c] transition"
                    >
                      Quitar Barbero
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
