"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ArrowLeft, ArrowRight } from "@phosphor-icons/react"

interface GallerySectionProps {
  images: string[]
}

export default function GallerySection({ images }: GallerySectionProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  const prev = () => setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null)
  const next = () => setLightbox(i => i !== null ? (i + 1) % images.length : null)

  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
            Portfolio
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Nuestros trabajos
          </h2>
        </div>

        {/* Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {images.map((url, i) => (
            <div
              key={i}
              className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={() => setLightbox(i)}
            >
              <div className="relative w-full" style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "4/3" : "1/1" }}>
                <Image
                  src={url}
                  alt={`Trabajo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ArrowRight weight="bold" size={16} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition z-10"
            onClick={() => setLightbox(null)}
          >
            <X weight="bold" size={18} className="text-white" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition z-10"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <ArrowLeft weight="bold" size={18} className="text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]}
              alt={`Trabajo ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition z-10"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <ArrowRight weight="bold" size={18} className="text-white" />
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </section>
  )
}
