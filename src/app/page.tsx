import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { to12Hour } from "@/lib/utils"
import LiveQueueBadge from "@/components/LiveQueueBadge"
import {
  Clock,
  Calendar,
  Scissors,
  MapPin,
  Phone,
  MessageCircle,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react"

export const dynamic = "force-dynamic"

async function getServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  })
}

async function getSettings() {
  return prisma.barberSettings.findFirst()
}

async function getGallery() {
  return prisma.galleryItem.findMany({
    where: { active: true },
    orderBy: { orderIndex: "asc" },
    take: 6,
  })
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

export default async function Home() {
  const [services, settings, gallery] = await Promise.all([
    getServices(),
    getSettings(),
    getGallery(),
  ])

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#0d0d0d]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo2.png" alt="Frailin Studio" width={28} height={28} className="opacity-90" />
            <span className="font-semibold text-sm tracking-wide">
              <span className="text-[#e84118]">Frailin</span> Studio
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#servicios" className="hidden sm:block text-sm text-white/40 hover:text-white transition">
              Servicios
            </a>
            <a href="#ubicacion" className="hidden sm:block text-sm text-white/40 hover:text-white transition">
              Ubicación
            </a>
            <Link
              href="/booking"
              className="text-sm font-medium bg-[#e84118] text-white px-4 py-2 rounded-lg hover:bg-[#c0392b] transition"
            >
              Agendar
            </Link>
            <Link href="/login" className="text-xs text-white/25 hover:text-white/60 transition">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-14 min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#150a0a] to-[#0d0d0d] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#e84118]/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Label */}
            <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-8">
              Vista Hermosa &nbsp;·&nbsp; Cartagena
            </p>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
              Del barrio,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e84118] to-[#f0932b]">
                bien puesto.
              </span>
            </h1>

            {/* Sub */}
            <p className="text-base md:text-lg text-white/45 mb-12 max-w-md leading-relaxed">
              Barbería de confianza en Vista Hermosa. Agenda tu cita en segundos, sin llamadas, sin colas.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-16">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 bg-[#e84118] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#c0392b] transition-all hover:scale-[1.02] text-sm"
              >
                Agendar cita
                <ArrowUpRight size={16} />
              </Link>
              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/70 font-medium px-7 py-3.5 rounded-xl hover:bg-white/5 hover:text-white transition-all text-sm"
              >
                Ver servicios
              </a>
            </div>

            {/* Live queue */}
            <div className="mb-16">
              <LiveQueueBadge />
            </div>

            {/* Stats */}
            <div className="flex gap-10 md:gap-16 pt-8 border-t border-white/8">
              {[
                { value: "5+", label: "Años de experiencia" },
                { value: "1K+", label: "Clientes atendidos" },
                { value: "4.9", label: "Calificación promedio" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/35 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" className="border-t border-white/8 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-3">
                Servicios
              </p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Elige tu corte
              </h2>
            </div>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
            >
              Ver todos
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {services.map((service, i) => (
              <div
                key={service.id}
                className="bg-[#0d0d0d] p-8 flex flex-col justify-between gap-6 hover:bg-[#140808] transition group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <Scissors size={20} className="text-[#e84118] opacity-70" />
                    {i === 1 && (
                      <span className="text-[10px] font-semibold text-[#e84118] border border-[#e84118]/40 px-2 py-0.5 rounded-full tracking-wide uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-white/35 leading-relaxed">{service.description}</p>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{formatPrice(service.price)}</p>
                    <p className="text-xs text-white/30 mt-0.5">{service.duration} min</p>
                  </div>
                  <Link
                    href="/booking"
                    className="text-xs font-medium text-white/50 group-hover:text-[#e84118] transition flex items-center gap-1"
                  >
                    Reservar
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-white/8 py-24 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-3">
              Proceso
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">Agenda en 3 pasos</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {[
              {
                step: "01",
                title: "Elige tu servicio",
                desc: "Selecciona el corte que quieres. Corte sencillo, con barba o corte de niño.",
              },
              {
                step: "02",
                title: "Escoge fecha y hora",
                desc: "Mira los horarios disponibles en tiempo real y reserva el que más te convenga.",
              },
              {
                step: "03",
                title: "Confirmación al instante",
                desc: "Recibes confirmación inmediata por WhatsApp y recordatorio 1 hora antes.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-[#080808] p-8 hover:bg-[#100505] transition">
                <p className="text-5xl font-bold text-white/8 mb-6 leading-none">{item.step}</p>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-white/8 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-3">
                Por que elegirnos
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-12 leading-tight">
                La experiencia que<br />tu look merece
              </h2>

              <div className="space-y-8">
                {[
                  {
                    icon: <MessageCircle size={18} />,
                    title: "Recordatorio por WhatsApp",
                    desc: "Te avisamos 1 hora antes para que nunca pierdas tu cita.",
                  },
                  {
                    icon: <Clock size={18} />,
                    title: "Cero esperas",
                    desc: "Llega a tu hora y pasa directo al sillón. Tu tiempo vale.",
                  },
                  {
                    icon: <Calendar size={18} />,
                    title: "Agenda 24/7",
                    desc: "Reserva desde tu celular en cualquier momento, sin llamadas.",
                  },
                  {
                    icon: <CheckCircle size={18} />,
                    title: "Atencion personalizada",
                    desc: "Cada corte es único, adaptado a tu estilo y lo que buscas.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#e84118]/10 flex items-center justify-center text-[#e84118]">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                      <p className="text-sm text-white/35 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="hidden md:block">
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/8 flex items-center gap-4">
                  <Image src="/logo2.png" alt="Frailin Studio" width={40} height={40} className="opacity-80" />
                  <div>
                    <p className="font-bold text-white">Frailin Studio</p>
                    <p className="text-xs text-white/35">Vista Hermosa, Cartagena</p>
                  </div>
                </div>
                <div className="divide-y divide-white/8">
                  <div className="p-5 flex items-center gap-4">
                    <Clock size={16} className="text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/35 mb-0.5">Horario</p>
                      <p className="text-sm font-medium text-white">
                        {to12Hour(settings?.openTime || "09:00")} – {to12Hour(settings?.closeTime || "19:00")}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 flex items-center gap-4">
                    <Scissors size={16} className="text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/35 mb-0.5">Servicios</p>
                      <p className="text-sm font-medium text-white">{services.length} disponibles</p>
                    </div>
                  </div>
                  <div className="p-5 flex items-center gap-4">
                    <Calendar size={16} className="text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/35 mb-0.5">Reservas</p>
                      <p className="text-sm font-medium text-[#e84118]">Online 24/7</p>
                    </div>
                  </div>
                  {settings?.phone && (
                    <div className="p-5 flex items-center gap-4">
                      <Phone size={16} className="text-white/30 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/35 mb-0.5">WhatsApp</p>
                        <a
                          href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-white hover:text-[#e84118] transition"
                        >
                          {settings.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <Link
                    href="/booking"
                    className="w-full flex items-center justify-center gap-2 bg-[#e84118] text-white font-semibold py-3 rounded-xl hover:bg-[#c0392b] transition text-sm"
                  >
                    Agendar cita
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      {gallery.length > 0 && (
        <section className="border-t border-white/8 py-24 bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14">
              <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-3">
                Portafolio
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">Nuestros trabajos</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Trabajo"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white font-medium text-sm">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="border-t border-white/8 py-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-6">
            Reserva tu turno
          </p>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Listo para un<br />nuevo look?
          </h2>
          <p className="text-white/35 mb-10 text-base max-w-sm mx-auto">
            Agenda ahora y recibe confirmacion al instante por WhatsApp.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-[#e84118] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#c0392b] transition-all hover:scale-[1.02] text-base"
          >
            Agendar cita
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Location ── */}
      {settings?.address && (
        <section id="ubicacion" className="border-t border-white/8 py-24 bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14">
              <p className="text-xs font-semibold text-[#e84118] tracking-[0.2em] uppercase mb-3">
                Ubicacion
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">Como llegar</h2>
            </div>

            <div className="grid md:grid-cols-5 gap-6 items-stretch">
              {/* Info */}
              <div className="md:col-span-2 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="divide-y divide-white/8 flex-1">
                  <div className="p-6 flex gap-4 items-start">
                    <MapPin size={18} className="text-[#e84118] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-wider mb-1">Direccion</p>
                      <p className="text-sm font-medium text-white leading-snug">{settings.address}</p>
                    </div>
                  </div>
                  <div className="p-6 flex gap-4 items-start">
                    <Clock size={18} className="text-[#e84118] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-wider mb-1">Horario</p>
                      <p className="text-sm font-medium text-white">
                        {to12Hour(settings.openTime || "09:00")} – {to12Hour(settings.closeTime || "19:00")}
                      </p>
                    </div>
                  </div>
                  {settings.phone && (
                    <div className="p-6 flex gap-4 items-start">
                      <Phone size={18} className="text-[#e84118] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-white/35 uppercase tracking-wider mb-1">WhatsApp</p>
                        <a
                          href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-white hover:text-[#e84118] transition"
                        >
                          {settings.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-white/8">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-white/15 text-white font-medium py-3 rounded-xl hover:bg-white/5 transition text-sm"
                  >
                    Abrir en Google Maps
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="md:col-span-3 rounded-2xl overflow-hidden border border-white/10 min-h-[340px]">
                <iframe
                  title="Ubicacion Frailin Studio"
                  width="100%"
                  height="100%"
                  style={{ minHeight: 340, border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(settings.address)}&zoom=16&language=es&maptype=roadmap`}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo2.png" alt="Frailin Studio" width={24} height={24} className="opacity-60" />
              <span className="text-sm font-semibold text-white/60">
                <span className="text-[#e84118]">Frailin</span> Studio
              </span>
            </div>
            <div className="flex gap-6">
              <Link href="/booking" className="text-xs text-white/35 hover:text-white transition">
                Agendar Cita
              </Link>
              <a href="#servicios" className="text-xs text-white/35 hover:text-white transition">
                Servicios
              </a>
              {settings?.address && (
                <a href="#ubicacion" className="text-xs text-white/35 hover:text-white transition">
                  Ubicacion
                </a>
              )}
            </div>
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} Frailin Studio
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
