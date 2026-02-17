"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useToast } from "@/components/ui/toast"
import { Trash2, Plus, X } from "lucide-react"

type GalleryItem = {
  id: string
  imageUrl: string
  title: string | null
  description: string | null
  category: string
  orderIndex: number
  active: boolean
}

const CATEGORIES = ["corte", "barba", "combo", "color", "otro"]

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", category: "corte" })
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const res = await fetch("/api/gallery")
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast("La imagen no puede superar 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!preview) {
      toast("Selecciona una imagen")
      return
    }

    setUploading(true)
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preview,
          title: form.title || null,
          description: form.description || null,
          category: form.category,
        }),
      })

      if (!res.ok) throw new Error("Error al subir")

      toast("Imagen agregada")
      setShowForm(false)
      setPreview(null)
      setForm({ title: "", description: "", category: "corte" })
      fetchItems()
    } catch {
      toast("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta imagen?")) return

    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" })
    toast("Imagen eliminada")
    fetchItems()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Galería</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setPreview(null)
            setForm({ title: "", description: "", category: "corte" })
          }}
          className="bg-[#e84118] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#c0392b] transition text-sm flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Agregar"}
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020] mb-6">
          <h3 className="font-semibold mb-4 text-white">Nueva imagen</h3>

          {/* File input + preview */}
          <div className="mb-4">
            {preview ? (
              <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden mb-3">
                <Image src={preview} alt="Preview" fill className="object-cover" />
                <button
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-xs aspect-square border-2 border-dashed border-[#3d2020] rounded-xl cursor-pointer hover:border-[#e84118] transition">
                <Plus size={32} className="text-white/30 mb-2" />
                <span className="text-sm text-white/40">Seleccionar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título (opcional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-4 w-full p-3 border border-[#3d2020] rounded-xl focus:border-[#e84118] focus:outline-none bg-[#1a0a0a] text-white placeholder-white/40"
          />

          <button
            onClick={handleSubmit}
            disabled={uploading || !preview}
            className="mt-4 px-6 py-2 rounded-xl bg-[#e84118] text-white text-sm hover:bg-[#c0392b] transition disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#2d1515] rounded-xl animate-pulse border border-[#3d2020]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-lg mb-2">Sin imágenes</p>
          <p className="text-sm">Agrega fotos de tus trabajos para mostrar en tu portafolio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-[#3d2020]">
              <Image
                src={item.imageUrl}
                alt={item.title || "Trabajo"}
                fill
                className="object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="self-end bg-red-500/80 rounded-full p-2 hover:bg-red-500 transition"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
                <div>
                  {item.title && <p className="text-white text-sm font-medium">{item.title}</p>}
                  <span className="text-xs text-white/60 capitalize">{item.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
