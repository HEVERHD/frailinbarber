import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { to12Hour } from "@/lib/utils"
import LiveQueueBadge from "@/components/LiveQueueBadge"

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
  const [services, settings, gallery] = await Promise.all([getServices(), getSettings(), getGallery()])

  return (
    <div className="min-h-screen bg-[#1a0a0a]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Frailin Studio" width={36} height={36} className="rounded-lg" />
            <h1 className="text-xl font-bold text-white">
              <span className="text-[#e84118]">Frailin</span> Studio
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/booking"
              className="hidden sm:inline-block bg-[#e84118] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#c0392b] transition"
            >
              Agendar Cita
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a]" />
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#e84118]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#f0932b]/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 md:py-40">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-[#e84118]/20 rounded-3xl blur-2xl scale-150" />
            <Image src="/logo.png" alt="Frailin Studio" width={130} height={130} className="relative rounded-3xl shadow-2xl shadow-[#e84118]/20" />
          </div>
          <span className="text-sm font-medium text-[#e84118] tracking-widest uppercase mb-4">Barberia Premium</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Tu estilo, tu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e84118] to-[#f0932b]">
              fuego
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-lg">
            Agenda tu cita en segundos. Sin llamadas, sin esperas. Estilo que arde.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/booking"
              className="bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-semibold px-8 py-4 rounded-xl text-lg hover:shadow-lg hover:shadow-[#e84118]/30 transition-all hover:scale-105"
            >
              Agendar Cita
            </Link>
            <a
              href="#servicios"
              className="border border-white/20 text-white font-medium px-8 py-4 rounded-xl text-lg hover:bg-white/5 transition"
            >
              Ver Servicios
            </a>
          </div>

          {/* Cola en vivo */}
          <div className="mt-6">
            <LiveQueueBadge />
          </div>

          {/* Stats */}
          <div className="flex gap-8 md:gap-16 mt-16">
            {[
              { value: "5+", label: "Experiencia" },
              { value: "1K+", label: "Clientes" },
              { value: "4.9", label: "Calificacion" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-[#e84118]">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="servicios" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-[#e84118] tracking-widest uppercase">Nuestros Servicios</span>
          <h3 className="text-3xl md:text-4xl font-bold text-white mt-3">
            Elige tu <span className="text-[#e84118]">servicio</span>
          </h3>
          <p className="text-white/40 mt-3 max-w-md mx-auto">
            Cada corte es una obra de arte. Elige el que mejor va contigo.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={service.id}
              className={`relative group p-6 rounded-2xl border transition-all hover:scale-105 hover:shadow-xl ${
                i === 1
                  ? "bg-gradient-to-b from-[#e84118]/20 to-[#2d1515] border-[#e84118]/50 shadow-lg shadow-[#e84118]/10"
                  : "bg-[#2d1515] border-[#3d2020] hover:border-[#e84118]/30 hover:shadow-[#e84118]/10"
              }`}
            >
              {i === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e84118] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-4xl mb-4">
                {i === 0 ? "👦" : i === 1 ? "✂️" : "💈"}
              </div>
              <h4 className="text-xl font-bold text-white mb-1">{service.name}</h4>
              {service.description && (
                <p className="text-sm text-white/40 mb-4">{service.description}</p>
              )}
              <p className="text-sm text-white/40 mb-4">{service.duration} minutos</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-[#e84118]">{formatPrice(service.price)}</p>
                <Link
                  href="/booking"
                  className="text-sm font-medium text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-[#e84118] transition"
                >
                  Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#120505] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-[#f0932b] tracking-widest uppercase">Proceso</span>
            <h3 className="text-3xl md:text-4xl font-bold text-white mt-3">
              Agenda en <span className="text-[#f0932b]">3 pasos</span>
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "✂️",
                title: "Elige tu servicio",
                desc: "Selecciona el corte o servicio que quieras",
              },
              {
                step: "02",
                icon: "📅",
                title: "Escoge fecha y hora",
                desc: "Mira los horarios disponibles en tiempo real",
              },
              {
                step: "03",
                icon: "✅",
                title: "Confirma tu cita",
                desc: "Recibe confirmacion instantanea por WhatsApp",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#3d2020] to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#2d1515] border border-[#3d2020] mb-6 text-4xl">
                  {item.icon}
                </div>
                <p className="text-xs font-bold text-[#e84118] mb-2">PASO {item.step}</p>
                <h4 className="text-xl font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-medium text-[#e84118] tracking-widest uppercase">Ventajas</span>
            <h3 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-8">
              La mejor <span className="text-[#e84118]">experiencia</span>
            </h3>
            <div className="space-y-6">
              {[
                {
                  icon: "📲",
                  title: "Recordatorio por WhatsApp",
                  desc: "Te avisamos 1 hora antes para que nunca olvides tu cita",
                },
                {
                  icon: "⏱️",
                  title: "Cero esperas",
                  desc: "Llega a tu hora y pasa directo al sillon. Tu tiempo vale.",
                },
                {
                  icon: "🔄",
                  title: "Agenda 24/7",
                  desc: "Reserva a cualquier hora desde tu celular, sin necesidad de llamar",
                },
                {
                  icon: "💈",
                  title: "Atencion personalizada",
                  desc: "Cada corte es unico, adaptado a tu estilo y preferencias",
                },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#e84118]/10 flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-white/40">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#e84118]/20 rounded-3xl blur-3xl" />
              <div className="relative bg-[#2d1515] border border-[#3d2020] rounded-3xl p-8 w-80">
                <div className="text-center mb-6">
                  <Image src="/logo.png" alt="Frailin Studio" width={80} height={80} className="mx-auto rounded-2xl mb-4" />
                  <p className="font-bold text-white text-lg">Frailin Studio</p>
                  <p className="text-xs text-white/40">Barberia Premium</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#1a0a0a] rounded-xl p-3 border border-[#3d2020]">
                    <p className="text-xs text-white/40">Horario</p>
                    <p className="text-sm font-medium text-white">
                      {to12Hour(settings?.openTime || "09:00")} - {to12Hour(settings?.closeTime || "19:00")}
                    </p>
                  </div>
                  <div className="bg-[#1a0a0a] rounded-xl p-3 border border-[#3d2020]">
                    <p className="text-xs text-white/40">Servicios</p>
                    <p className="text-sm font-medium text-white">{services.length} disponibles</p>
                  </div>
                  <div className="bg-[#1a0a0a] rounded-xl p-3 border border-[#3d2020]">
                    <p className="text-xs text-white/40">Reservas</p>
                    <p className="text-sm font-medium text-[#e84118]">Online 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="bg-[#120505] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-medium text-[#e84118] tracking-widest uppercase">Portafolio</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-3">
                Nuestros <span className="text-[#e84118]">trabajos</span>
              </h3>
              <p className="text-white/40 mt-3 max-w-md mx-auto">
                Cada corte cuenta una historia. Mira lo que podemos hacer por ti.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-[#3d2020]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Trabajo"}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <span className="text-xs text-white/60 capitalize">{item.category}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#e84118] to-[#f0932b]" />
        <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-no-repeat opacity-5 bg-contain" />
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Listo para un nuevo look?
          </h3>
          <p className="text-white/80 mb-8 text-lg">
            Agenda tu cita ahora y recibe confirmacion al instante por WhatsApp
          </p>
          <Link
            href="/booking"
            className="inline-block bg-[#1a0a0a] text-white font-semibold px-10 py-4 rounded-xl text-lg hover:bg-[#2d1515] transition-all hover:scale-105 shadow-xl"
          >
            Agendar Ahora
          </Link>
        </div>
      </section>

      {/* Como llegar */}
      {settings?.address && (
        <section id="ubicacion" className="bg-[#120505] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-medium text-[#e84118] tracking-widest uppercase">Ubicación</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-3">
                Cómo <span className="text-[#e84118]">llegar</span>
              </h3>
              <p className="text-white/40 mt-3 max-w-md mx-auto">
                Te esperamos. Aquí nos encuentras.
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-8 items-stretch">
              {/* Info card */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-[#2d1515] border border-[#3d2020] rounded-2xl p-6 flex flex-col gap-5 flex-1">
                  {/* Address */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#e84118]/15 flex items-center justify-center text-xl">
                      📍
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#e84118] uppercase tracking-wider mb-1">Dirección</p>
                      <p className="text-white font-medium leading-snug">{settings.address}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#e84118]/15 flex items-center justify-center text-xl">
                      🕐
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#e84118] uppercase tracking-wider mb-1">Horario</p>
                      <p className="text-white font-medium">
                        {to12Hour(settings.openTime || "09:00")} – {to12Hour(settings.closeTime || "19:00")}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {settings.phone && (
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#e84118]/15 flex items-center justify-center text-xl">
                        💬
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#e84118] uppercase tracking-wider mb-1">WhatsApp</p>
                        <a
                          href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-[#e84118] transition"
                        >
                          {settings.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Open in Maps button */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#e84118] text-white font-semibold hover:bg-[#c0392b] transition-all hover:scale-[1.02] text-sm"
                  >
                    <span>Abrir en Google Maps</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Map embed */}
              <div className="md:col-span-3 rounded-2xl overflow-hidden border border-[#3d2020] min-h-[340px] shadow-xl shadow-black/30">
                <iframe
                  title="Ubicación Frailin Studio"
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

      {/* Footer */}
      <footer className="bg-[#120505] border-t border-[#3d2020]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Frailin Studio" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-white">
                <span className="text-[#e84118]">Frailin</span> Studio
              </span>
            </div>
            <div className="flex gap-6">
              <Link href="/booking" className="text-sm text-white/50 hover:text-white transition">
                Agendar Cita
              </Link>
              <a href="#servicios" className="text-sm text-white/50 hover:text-white transition">
                Servicios
              </a>
              {settings?.address && (
                <a href="#ubicacion" className="text-sm text-white/50 hover:text-white transition">
                  Ubicación
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#3d2020] text-center">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Frailin Studio. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
