"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/toast"
import { Trash2, Pencil, X } from "lucide-react"

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
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" })
  const [saving, setSaving] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const myId = (session?.user as any)?.id
  const myRole = (session?.user as any)?.role

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
      const labels: Record<string, string> = {
        ADMIN: "Usuario promovido a Administrador",
        BARBER: "Usuario promovido a Barbero",
        CLIENT: "Rol cambiado a Cliente",
      }
      toast(labels[newRole] || "Rol actualizado")
      fetchUsers()
    } else {
      const data = await res.json()
      toast(data.error || "Error al cambiar rol", "error")
    }
  }

  const deleteUser = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    const res = await fetch(`/api/users?id=${confirmDelete.id}`, { method: "DELETE" })
    setDeleting(false)
    setConfirmDelete(null)
    if (res.ok) {
      toast("Usuario eliminado")
      fetchUsers()
    } else {
      const data = await res.json()
      toast(data.error || "Error al eliminar", "error")
    }
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
    })
  }

  const saveEdit = async () => {
    if (!editUser) return
    setSaving(true)
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: editUser.id,
        name: editForm.name || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast("Usuario actualizado")
      setEditUser(null)
      fetchUsers()
    } else {
      const data = await res.json()
      toast(data.error || "Error al guardar", "error")
    }
  }

  const canDelete = (user: User) =>
    user.id !== myId && (myRole === "ADMIN" || user.role === "CLIENT")

  const canEdit = (user: User) =>
    myRole === "ADMIN" || user.role === "CLIENT"

  return (
    <div>
      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Editar usuario</h3>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#1a0a0a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e84118]/50"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Teléfono</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#1a0a0a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e84118]/50"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#1a0a0a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e84118]/50"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditUser(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e84118] text-white text-sm font-semibold hover:bg-[#c0392b] transition disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Eliminar usuario</h3>
            <p className="text-sm text-white/40 mb-1">
              ¿Seguro que quieres eliminar a <span className="text-white font-medium">{confirmDelete.name || confirmDelete.email || "este usuario"}</span>?
            </p>
            <p className="text-xs text-red-400/80 mb-6">
              Se eliminarán también todas sus citas ({confirmDelete._count.appointments}). Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-white/40 mt-1">
            {myRole === "ADMIN" ? "Administra los roles de los usuarios" : "Gestiona los clientes"}
          </p>
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
                        user.role === "ADMIN"
                          ? "bg-purple-900/30 text-purple-400"
                          : user.role === "BARBER"
                          ? "bg-[#e84118]/20 text-[#e84118]"
                          : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {user.role === "ADMIN" ? "Admin" : user.role === "BARBER" ? "Barbero" : "Cliente"}
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

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {myRole === "ADMIN" && user.role === "CLIENT" && (
                    <button
                      onClick={() => changeRole(user.id, "BARBER")}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#e84118] text-white hover:bg-[#c0392b] transition"
                    >
                      Hacer Barbero
                    </button>
                  )}
                  {myRole === "ADMIN" && user.role === "BARBER" && (
                    <button
                      onClick={() => changeRole(user.id, "CLIENT")}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#3d2020] text-white/50 hover:bg-[#4d2c2c] transition"
                    >
                      Quitar
                    </button>
                  )}
                  {canEdit(user) && (
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 rounded-lg text-white/20 hover:text-[#e84118] hover:bg-[#e84118]/10 transition"
                      title="Editar usuario"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {canDelete(user) && (
                    <button
                      onClick={() => setConfirmDelete(user)}
                      className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-900/20 transition"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={15} />
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
