"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import LiveQueueBadge from "@/components/LiveQueueBadge"

const PHRASES = [
  "sin esperas.",
  "en segundos.",
  "desde tu celular.",
  "fácil y rápido.",
]

interface HeroSectionProps {
  galleryImages?: string[]
  shopName?: string
  city?: string
}

export default function HeroSection({ galleryImages = [], shopName = "Mi Barbería", city = "" }: HeroSectionProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [started, setStarted] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  // Hide scroll indicator on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Auto-advance photo slider
  useEffect(() => {
    if (galleryImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % galleryImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [galleryImages.length])

  // Start typewriter after entrance animations finish (~1.8s)
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started) return

    const currentPhrase = PHRASES[phraseIndex]

    // Finished typing — pause then start deleting
    if (!isDeleting && displayed === currentPhrase) {
      const t = setTimeout(() => setIsDeleting(true), 2400)
      return () => clearTimeout(t)
    }
    // Finished deleting — advance to next phrase then retype
    if (isDeleting && displayed === "") {
      const t = setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length)
        setIsDeleting(false)
      }, 500)
      return () => clearTimeout(t)
    }

    const speed = isDeleting ? 65 : 105
    const t = setTimeout(() => {
      setDisplayed(
        isDeleting
          ? displayed.slice(0, -1)
          : currentPhrase.slice(0, displayed.length + 1)
      )
    }, speed)
    return () => clearTimeout(t)
  }, [displayed, isDeleting, started, phraseIndex])

  return (
    <>
      <style>{`
        @keyframes fs-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(0.4deg); }
          66%       { transform: translateY(-6px) rotate(-0.3deg); }
        }
        @keyframes fs-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.18); }
        }
        @keyframes fs-scan {
          0%   { transform: translateY(-2px); opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 0.5; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes fs-orb1 {
          0%, 100% { transform: translate(0px, 0px); }
          50%       { transform: translate(-25px, 18px); }
        }
        @keyframes fs-orb2 {
          0%, 100% { transform: translate(0px, 0px); }
          50%       { transform: translate(18px, -22px); }
        }
        @keyframes fs-dot-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes fs-ring-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fs-ring-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes fs-reveal {
          from { opacity: 0; transform: translateY(52px) skewY(2.5deg); filter: blur(10px); }
          to   { opacity: 1; transform: translateY(0) skewY(0deg); filter: blur(0px); }
        }
        @keyframes fs-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fs-slide-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fs-badge-in {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fs-gradient-shift {
          0%, 100% { background-position: 0% center; }
          50%       { background-position: 100% center; }
        }
        @keyframes fs-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes fs-hud-appear {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fs-line-grow {
          from { width: 0; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
        @keyframes fs-scroll-dot {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          60%       { transform: translateY(10px); opacity: 0.15; }
        }
        @keyframes fs-kenburns {
          0%   { transform: scale(1.05) translate(0%, 0%); }
          50%  { transform: scale(1.18) translate(-2%, -1.5%); }
          100% { transform: scale(1.05) translate(1%, 1%); }
        }
        .fs-kenburns { animation: fs-kenburns 8s ease-in-out infinite alternate; }

        .fs-float    { animation: fs-float 5.5s ease-in-out infinite; }
        .fs-glow     { animation: fs-glow-pulse 3s ease-in-out infinite; }
        .fs-scan     { animation: fs-scan 12s linear infinite; }
        .fs-orb-1    { animation: fs-orb1 15s ease-in-out infinite; }
        .fs-orb-2    { animation: fs-orb2 11s ease-in-out infinite; }
        .fs-dot      { animation: fs-dot-blink 1.6s ease-in-out infinite; }
        .fs-ring-cw  { animation: fs-ring-cw 22s linear infinite; }
        .fs-ring-ccw { animation: fs-ring-ccw 16s linear infinite; }
        .fs-cursor   { animation: fs-cursor-blink 0.9s step-end infinite; }

        .fs-badge   { animation: fs-badge-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .fs-t1      { animation: fs-reveal 1s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .fs-t2      { animation: fs-reveal 1s cubic-bezier(0.16,1,0.3,1) 0.45s both; }
        .fs-t3      { animation: fs-reveal 1s cubic-bezier(0.16,1,0.3,1) 0.65s both; }
        .fs-sub     { animation: fs-fade 1s ease 0.95s both; }
        .fs-cta     { animation: fs-slide-up 0.85s cubic-bezier(0.16,1,0.3,1) 1.15s both; }
        .fs-queue   { animation: fs-fade 0.8s ease 1.45s both; }
        .fs-stats   { animation: fs-slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 1.75s both; }
        .fs-logo-in { animation: fs-fade 0.9s ease 0.05s both; }
        .fs-hud     { animation: fs-hud-appear 1s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .fs-divline { animation: fs-line-grow 1s ease 0.75s both; }

        .fs-accent {
          background: linear-gradient(90deg, #d97706 0%, #f05428 35%, #ff7a50 65%, #d97706 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fs-gradient-shift 3.5s ease-in-out infinite;
        }
        .fs-dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">

        {/* ── Background ── */}
        {/* Gradient vignette so hero text stays readable over parallax bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/55 pointer-events-none" />
        <div className="absolute inset-0 fs-dot-grid pointer-events-none" />
        <div className="fs-orb-1 absolute -top-[15%] -left-[5%]  w-[700px] h-[700px] rounded-full bg-[#d97706]/6 blur-[140px] pointer-events-none" />
        <div className="fs-orb-2 absolute  top-[5%]  right-[-10%] w-[550px] h-[550px] rounded-full bg-[#d97706]/4 blur-[110px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[20%]          w-[350px] h-[350px] rounded-full bg-[#d97706]/3 blur-[90px]  pointer-events-none" />

        {/* Scan line */}
        <div className="fs-scan absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d97706]/25 to-transparent pointer-events-none z-10" />

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 transition-opacity duration-700 pointer-events-none ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-[9px] text-white/20 tracking-[0.3em] font-bold uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1">
            <div
              className="w-[3px] h-[6px] rounded-full bg-[#d97706]/60"
              style={{ animation: "fs-scroll-dot 1.8s ease-in-out infinite" }}
            />
          </div>
          <ChevronDown size={12} className="text-white/15" />
        </div>

        {/* Top / bottom fades */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />

        {/* ── Content ── */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-10 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">

            {/* ─── HUD Logo — top on mobile, right on desktop ─── */}
            <div className="order-1 lg:order-2 flex items-center justify-center">
              <div
                className="fs-logo-in fs-hud relative flex items-center justify-center mx-auto w-[240px] h-[240px] lg:w-[400px] lg:h-[400px]"
              >

                {/* ── Photo slider (behind everything) ── */}
                {galleryImages.length > 0 && (
                  <div className="absolute rounded-full overflow-hidden z-0" style={{ inset: "14%" }}>
                    {galleryImages.slice(0, 8).map((url, i) => (
                      <div
                        key={i}
                        className="absolute inset-0"
                        style={{
                          opacity: i === currentPhoto ? 1 : 0,
                          transition: "opacity 1.4s ease-in-out",
                        }}
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className={`object-cover ${i === currentPhoto ? "fs-kenburns" : ""}`}
                          style={{ opacity: 0.55, filter: "saturate(0.85) brightness(0.9)" }}
                          sizes="200px"
                        />
                      </div>
                    ))}
                    {/* Vignette suave — solo oscurece los bordes, centro más abierto */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.05) 45%, rgba(10,10,10,0.55) 100%)",
                      }}
                    />
                    {/* Tinte rojo de marca */}
                    <div className="absolute inset-0 bg-[#d97706]/10" />
                  </div>
                )}

                {/* Same HUD scaled via percentage-based insets */}

                {/* Corner brackets */}
                <div className="absolute top-0 left-0   w-7 h-7 lg:w-10 lg:h-10 border-t-2 border-l-2 border-[#d97706]/45" />
                <div className="absolute top-0 right-0  w-7 h-7 lg:w-10 lg:h-10 border-t-2 border-r-2 border-[#d97706]/45" />
                <div className="absolute bottom-0 left-0  w-7 h-7 lg:w-10 lg:h-10 border-b-2 border-l-2 border-[#d97706]/45" />
                <div className="absolute bottom-0 right-0 w-7 h-7 lg:w-10 lg:h-10 border-b-2 border-r-2 border-[#d97706]/45" />

                {/* HUD labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] tracking-[0.3em] font-bold text-[#d97706]/35 uppercase whitespace-nowrap">
                  {shopName}
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] tracking-[0.25em] font-bold text-white/20 uppercase whitespace-nowrap">
                  {shopName}
                </div>

                {/* Side tick marks */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[5, 3, 10, 3, 5].map((w, i) => (
                    <div key={i} className="h-px bg-[#d97706]/30" style={{ width: w }} />
                  ))}
                </div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end">
                  {[5, 3, 10, 3, 5].map((w, i) => (
                    <div key={i} className="h-px bg-[#d97706]/30" style={{ width: w }} />
                  ))}
                </div>

                {/* Spinning rings (% inset so they scale with parent) */}
                <div
                  className="fs-ring-cw absolute rounded-full border border-[#d97706]/12 border-dashed"
                  style={{ inset: "5%" }}
                />
                <div
                  className="fs-ring-ccw absolute rounded-full border border-[#d97706]/18"
                  style={{ inset: "13%" }}
                />

                {/* Radial glow */}
                <div
                  className="fs-glow absolute rounded-full pointer-events-none"
                  style={{
                    inset: "20%",
                    background: "radial-gradient(circle, rgba(217,119,6,0.28) 0%, transparent 70%)",
                  }}
                />

                {/* Logo — floating */}
                <div className="fs-float relative z-10" style={{ width: "46%", height: "46%" }}>
                  <Image
                    src="/logo2.png"
                    alt="Mi Barbería"
                    fill
                    className="object-contain drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 18px rgba(217,119,6,0.4))" }}
                  />
                </div>

                {/* Brand line inside HUD */}
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="h-px w-16 lg:w-24 mx-auto mb-1.5 bg-gradient-to-r from-transparent via-[#d97706]/40 to-transparent" />
                  <p className="text-[9px] lg:text-[11px] tracking-[0.35em] font-black text-white/45 uppercase">
                    {shopName}
                  </p>
                </div>
              </div>

            </div>

            {/* ─── Text — bottom on mobile, left on desktop ─── */}
            <div className="order-2 lg:order-1 text-center lg:text-left">

              {/* Location badge */}
              <div className="fs-badge inline-flex items-center gap-2.5 border border-[#d97706]/25 bg-[#d97706]/8 text-[#d97706] text-[11px] font-bold px-4 py-2 rounded-full mb-6 lg:mb-8 tracking-[0.2em]">
                <span className="fs-dot inline-block w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                {city || "Tu ciudad"}
              </div>

              {/* Headline — staggered lines */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-black leading-[0.88] tracking-tight mb-6 lg:mb-8">
                <span className="fs-t1 block">Agenda</span>
                <span className="fs-t2 block">tu cita</span>
                {/* Typewriter line */}
                <span className="fs-t3 block min-h-[1em]">
                  <span className="fs-accent">{displayed}</span>
                  <span className="fs-cursor inline-block w-[3px] h-[0.7em] bg-[#d97706] align-middle rounded-sm ml-0.5" />
                </span>
              </h1>

              {/* Thin red divider */}
              <div className="fs-divline h-px bg-gradient-to-r from-transparent via-[#d97706]/40 to-transparent mb-6 lg:mb-8" />

              {/* Subtext */}
              <p className="fs-sub text-base md:text-lg text-white/35 mb-8 lg:mb-10 max-w-sm leading-relaxed font-light mx-auto lg:mx-0">
                Reserva en línea, confirmación instantánea por WhatsApp. Sin llamadas, sin filas.
              </p>

              {/* CTAs */}
              <div className="fs-cta flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-10 lg:mb-12">
                <Link
                  href="/booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#d97706] to-[#b45309] text-white font-bold px-8 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-[#d97706]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Agendar mi cita
                  <ArrowUpRight size={18} />
                </Link>
                <a
                  href="#servicios"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/10 text-white/50 font-medium px-8 py-4 rounded-2xl text-base hover:bg-white/5 hover:text-white hover:border-[#d97706]/30 transition-all"
                >
                  Ver servicios
                </a>
              </div>

              {/* Live queue badge */}
              <div className="fs-queue mb-10 lg:mb-12 flex justify-center lg:justify-start">
                <LiveQueueBadge />
              </div>

              {/* Stats */}
              <div className="fs-stats flex justify-center lg:justify-start gap-8 md:gap-14 pt-6 border-t border-white/5">
                {[
                  { value: "5+",  label: "Años de experiencia" },
                  { value: "1K+", label: "Clientes atendidos" },
                  { value: "4.9", label: "Calificación promedio" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white">{stat.value}</p>
                    <p className="text-[11px] text-white/25 mt-1 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
