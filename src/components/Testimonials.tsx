import { Star } from "@phosphor-icons/react/dist/ssr"

interface Testimonial {
  name: string
  service: string
  rating: number
  quote: string
}

// ⚠️ PLACEHOLDER — reemplaza estos 3 testimonios por reseñas reales de tus
// clientes antes de publicar. Mostrar reseñas inventadas como si fueran reales
// es engañoso para quien las lea. Si aún no tienes reseñas escritas, quita esta
// sección de page.tsx hasta que las consigas (pídelas por WhatsApp después de
// cada cita — es el momento en que más fácil las dan).
const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    name: "Reemplazar con nombre real",
    service: "Corte con Barba",
    rating: 5,
    quote: "Escribe aquí la reseña real de un cliente — cita textual, no inventada.",
  },
  {
    name: "Reemplazar con nombre real",
    service: "Corte Sencillo",
    rating: 5,
    quote: "Escribe aquí la reseña real de un cliente — cita textual, no inventada.",
  },
  {
    name: "Reemplazar con nombre real",
    service: "Corte de Niño",
    rating: 5,
    quote: "Escribe aquí la reseña real de un cliente — cita textual, no inventada.",
  },
]

export default function Testimonials() {
  return (
    <section className="py-28 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
            Lo que dicen
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">Clientes felices</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLACEHOLDER_TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-7">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} weight="fill" size={14} className="text-[#e84118]" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e84118]/15 flex items-center justify-center text-[#e84118] font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-white/30">{t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
