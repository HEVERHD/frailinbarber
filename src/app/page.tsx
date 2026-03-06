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
  Zap,
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
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo2.png" alt="Frailin Studio" width={32} height={32} />
            <span className="font-bold tracking-wide">
              <span className="text-[#e84118]">Frailin</span> Studio
            </span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#servicios" className="hidden sm:block text-sm text-white/50 hover:text-white transition font-medium">
              Servicios
            </a>
            <a href="#ubicacion" className="hidden sm:block text-sm text-white/50 hover:text-white transition font-medium">
              Ubicación
            </a>
            <Link
              href="/booking"
              className="bg-[#e84118] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#c0392b] transition-all hover:shadow-lg hover:shadow-[#e84118]/20"
            >
              Agendar
            </Link>
            <Link href="/login" className="text-xs text-white/20 hover:text-white/50 transition">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-screen flex items-center">
        {/* Deep glow effects */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute top-0 left-0 right-0 h-[70%] bg-gradient-to-b from-[#1a0808] to-transparent pointer-events-none" />
        <div className="absolute top-[20%] left-[5%] w-[500px] h-[500px] bg-[#e84118]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-[#e84118]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32 w-full">
          {/* Location badge */}
          <div className="inline-flex items-center gap-2 border border-[#e84118]/30 bg-[#e84118]/10 text-[#e84118] text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-widest uppercase">
            <MapPin size={12} />
            Vista Hermosa &nbsp;·&nbsp; Cartagena
          </div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black leading-[0.9] tracking-tight mb-8">
            Tu look
            <br />
            habla antes
            <br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e84118] via-[#f0532b] to-[#f0932b]">
                que tú.
              </span>
              <span className="absolute -inset-4 bg-[#e84118]/15 blur-2xl rounded-full pointer-events-none" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 mb-12 max-w-lg leading-relaxed font-light">
            Barbería de confianza en Vista Hermosa. Agenda tu cita en segundos, sin llamadas, sin esperas.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-bold px-8 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-[#e84118]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Agendar mi cita
              <ArrowUpRight size={18} />
            </Link>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 border border-white/10 text-white/60 font-medium px-8 py-4 rounded-2xl text-base hover:bg-white/5 hover:text-white hover:border-white/20 transition-all"
            >
              Ver servicios
            </a>
          </div>

          {/* Live queue */}
          <div className="mb-20">
            <LiveQueueBadge />
          </div>

          {/* Stats */}
          <div className="flex gap-12 md:gap-20 pt-8 border-t border-white/5">
            {[
              { value: "5+", label: "Años de experiencia" },
              { value: "1K+", label: "Clientes atendidos" },
              { value: "4.9", label: "Calificación promedio" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/30 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" className="py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
                Nuestros servicios
              </p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                Elige tu corte
              </h2>
            </div>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition font-medium group"
            >
              Ver todos los servicios
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <div
                key={service.id}
                className={`relative group rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${
                  i === 1
                    ? "bg-gradient-to-b from-[#1f0a0a] to-[#140505] border-[#e84118]/40 shadow-xl shadow-[#e84118]/10"
                    : "bg-[#111] border-white/8 hover:border-white/15 hover:bg-[#161616]"
                }`}
              >
                {i === 1 && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-[#e84118]/5 pointer-events-none" />
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e84118] text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                      Popular
                    </span>
                  </>
                )}
                <div className="mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
                    i === 1 ? "bg-[#e84118]/20" : "bg-white/5"
                  }`}>
                    <Scissors size={18} className={i === 1 ? "text-[#e84118]" : "text-white/50"} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-white/35 leading-relaxed">{service.description}</p>
                  )}
                </div>
                <div className="flex items-end justify-between mt-auto pt-5 border-t border-white/5">
                  <div>
                    <p className="text-2xl font-black text-white">{formatPrice(service.price)}</p>
                    <p className="text-xs text-white/25 mt-0.5">{service.duration} minutos</p>
                  </div>
                  <Link
                    href="/booking"
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                      i === 1
                        ? "bg-[#e84118] text-white hover:bg-[#c0392b]"
                        : "bg-white/8 text-white/60 hover:bg-[#e84118] hover:text-white"
                    }`}
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
      <section className="py-28 bg-[#080808] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
              Proceso
            </p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Agenda en 3 pasos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Elige tu servicio",
                desc: "Selecciona el corte que buscas: sencillo, con barba o corte de niño.",
                icon: <Scissors size={22} />,
              },
              {
                step: "02",
                title: "Escoge fecha y hora",
                desc: "Mira los horarios disponibles en tiempo real y reserva el que te quede.",
                icon: <Calendar size={22} />,
              },
              {
                step: "03",
                title: "Confirmacion al instante",
                desc: "Recibes confirmacion por WhatsApp y recordatorio 1 hora antes de tu cita.",
                icon: <Zap size={22} />,
              },
            ].map((item, i) => (
              <div key={item.step} className="relative group">
                <div className="bg-[#111] border border-white/8 rounded-2xl p-8 hover:border-[#e84118]/30 hover:bg-[#130606] transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#e84118]/10 flex items-center justify-center text-[#e84118]">
                      {item.icon}
                    </div>
                    <span className="text-5xl font-black text-white/5 leading-none select-none">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-white/15 z-10 text-center">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
                Por que elegirnos
              </p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-12">
                La experiencia<br />que tu look merece
              </h2>
              <div className="space-y-7">
                {[
                  {
                    icon: <MessageCircle size={20} />,
                    title: "Recordatorio por WhatsApp",
                    desc: "Te avisamos 1 hora antes para que nunca pierdas tu cita.",
                  },
                  {
                    icon: <Clock size={20} />,
                    title: "Cero esperas",
                    desc: "Llega a tu hora y pasa directo al sillón. Tu tiempo vale.",
                  },
                  {
                    icon: <Calendar size={20} />,
                    title: "Agenda 24/7",
                    desc: "Reserva desde tu celular en cualquier momento, sin llamadas.",
                  },
                  {
                    icon: <CheckCircle size={20} />,
                    title: "Atencion personalizada",
                    desc: "Cada corte es único, adaptado a tu estilo y preferencias.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-5 group">
                    <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#e84118]/10 border border-[#e84118]/20 flex items-center justify-center text-[#e84118] group-hover:bg-[#e84118]/20 transition">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                      <p className="text-sm text-white/35 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#e84118]/8 rounded-3xl blur-3xl pointer-events-none" />
                <div className="relative bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-7 border-b border-white/8 flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#e84118]/30 rounded-full blur-md" />
                      <Image src="/logo2.png" alt="Frailin Studio" width={52} height={52} className="relative" />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg">Frailin Studio</p>
                      <p className="text-xs text-white/35 mt-0.5">Vista Hermosa, Cartagena</p>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    <div className="p-5 flex items-center gap-4">
                      <Clock size={16} className="text-[#e84118] flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/30 mb-0.5">Horario de atención</p>
                        <p className="text-sm font-bold text-white">
                          {to12Hour(settings?.openTime || "09:00")} – {to12Hour(settings?.closeTime || "19:00")}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 flex items-center gap-4">
                      <Scissors size={16} className="text-[#e84118] flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/30 mb-0.5">Servicios disponibles</p>
                        <p className="text-sm font-bold text-white">{services.length} servicios</p>
                      </div>
                    </div>
                    <div className="p-5 flex items-center gap-4">
                      <Zap size={16} className="text-[#e84118] flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white/30 mb-0.5">Reservas</p>
                        <p className="text-sm font-bold text-[#e84118]">Online 24/7</p>
                      </div>
                    </div>
                    {settings?.phone && (
                      <div className="p-5 flex items-center gap-4">
                        <Phone size={16} className="text-[#e84118] flex-shrink-0" />
                        <div>
                          <p className="text-xs text-white/30 mb-0.5">WhatsApp</p>
                          <a
                            href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-white hover:text-[#e84118] transition"
                          >
                            {settings.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <Link
                      href="/booking"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#e84118]/25 transition-all text-sm"
                    >
                      Agendar mi cita
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      {gallery.length > 0 && (
        <section className="py-28 bg-[#080808] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
              <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
                Portafolio
              </p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                Nuestros trabajos
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/15 transition"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Trabajo"}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-white font-bold text-sm">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="relative py-32 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0808] via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#e84118]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-6">
            Agenda ahora
          </p>
          <h2 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Listo para un<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e84118] to-[#f0932b]">
              nuevo look?
            </span>
          </h2>
          <p className="text-white/35 mb-12 text-base max-w-md mx-auto leading-relaxed">
            Agenda tu cita ahora. Confirmacion instantanea por WhatsApp.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-black px-10 py-5 rounded-2xl text-lg hover:shadow-2xl hover:shadow-[#e84118]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Agendar mi cita
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Location ── */}
      {settings?.address && (
        <section id="ubicacion" className="py-28 bg-[#080808] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
              <p className="text-xs font-bold text-[#e84118] tracking-[0.25em] uppercase mb-4">
                Ubicacion
              </p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">Como llegar</h2>
            </div>

            <div className="grid md:grid-cols-5 gap-6 items-stretch">
              <div className="md:col-span-2 bg-[#111] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
                <div className="divide-y divide-white/8 flex-1">
                  <div className="p-6 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#e84118]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[#e84118]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Direccion</p>
                      <p className="text-sm font-semibold text-white leading-snug">{settings.address}</p>
                    </div>
                  </div>
                  <div className="p-6 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#e84118]/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-[#e84118]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Horario</p>
                      <p className="text-sm font-semibold text-white">
                        {to12Hour(settings.openTime || "09:00")} – {to12Hour(settings.closeTime || "19:00")}
                      </p>
                    </div>
                  </div>
                  {settings.phone && (
                    <div className="p-6 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#e84118]/10 flex items-center justify-center flex-shrink-0">
                        <Phone size={18} className="text-[#e84118]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">WhatsApp</p>
                        <a
                          href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-white hover:text-[#e84118] transition"
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
                    className="w-full flex items-center justify-center gap-2 bg-[#e84118] text-white font-bold py-3.5 rounded-xl hover:bg-[#c0392b] transition-all text-sm"
                  >
                    Abrir en Google Maps
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              <div className="md:col-span-3 rounded-2xl overflow-hidden border border-white/8 min-h-[340px] shadow-2xl">
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
      <footer className="border-t border-white/5 py-10 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo2.png" alt="Frailin Studio" width={28} height={28} className="opacity-70" />
              <span className="font-bold text-white/70">
                <span className="text-[#e84118]">Frailin</span> Studio
              </span>
            </div>
            <div className="flex gap-8">
              <Link href="/booking" className="text-sm text-white/30 hover:text-white transition font-medium">
                Agendar
              </Link>
              <a href="#servicios" className="text-sm text-white/30 hover:text-white transition font-medium">
                Servicios
              </a>
              {settings?.address && (
                <a href="#ubicacion" className="text-sm text-white/30 hover:text-white transition font-medium">
                  Ubicacion
                </a>
              )}
            </div>
            <p className="text-xs text-white/15">
              &copy; {new Date().getFullYear()} Frailin Studio. Cartagena, Colombia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
