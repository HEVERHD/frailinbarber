"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, CaretDown as ChevronDown } from "@phosphor-icons/react"
import LiveQueueBadge from "@/components/LiveQueueBadge"
import { useSeason, upcomingYear } from "@/lib/season"

const PHRASES = [
  "sin esperas.",
  "en segundos.",
  "desde tu celular.",
  "fácil y rápido.",
]

// ── HUD animation configs ─────────────────────────────────────
const HUD_SPARKS = [
  { dur: "3.5s", delay: "0s",    sz: 3 },
  { dur: "3.5s", delay: "1.17s", sz: 2 },
  { dur: "3.5s", delay: "2.33s", sz: 3 },
  { dur: "5s",   delay: "0.5s",  sz: 4 },
  { dur: "5s",   delay: "2.1s",  sz: 2 },
  { dur: "5s",   delay: "3.5s",  sz: 3 },
  { dur: "7s",   delay: "0s",    sz: 5 },
  { dur: "7s",   delay: "3.5s",  sz: 2 },
]

// Barbería (poste / tijeras / navaja) intercaladas con las demás para variar el ritmo
const HUD_PHASES = ["sparks", "poste", "vortex", "heartbeat", "tijeras", "embers", "glitch", "navaja", "pirotecnia", "aurora", "radar", "galaxia", "sonico"] as const

// Tijeras — hair clippings falling inside the circle after each snip
const HUD_HAIR = Array.from({ length: 10 }, (_, i) => ({
  l: `${28 + ((i * 23) % 44)}%`,
  rot: (i * 47) % 180,
  len: 6 + (i % 3) * 3,
  d: `${1.6 + (i % 3) * 0.4}s`,
  dl: `${(i * 0.21) % 1.6}s`,
}))
// Fases de temporada: nevada + bola navideña + reloj de Año Nuevo.
// En temporada salen radar / glitch / galaxia para que el ciclo no se alargue.
type HudPhase = typeof HUD_PHASES[number] | "nevada" | "esfera" | "reloj"
const OFF_SEASON_ONLY: readonly HudPhase[] = ["radar", "glitch", "galaxia"]
const BASE_IN_SEASON = HUD_PHASES.filter((p) => !OFF_SEASON_ONLY.includes(p))
const HUD_PHASES_XMAS: readonly HudPhase[] = ["nevada", "esfera", "reloj", ...BASE_IN_SEASON]
const HUD_PHASES_NEW_YEAR: readonly HudPhase[] = ["reloj", "nevada", ...BASE_IN_SEASON]

// Bola navideña — extra flakes only visible while the globe is being shaken
const GLOBE_STORM = Array.from({ length: 22 }, (_, i) => ({
  l: `${12 + ((i * 41) % 76)}%`,
  s: 2 + (i % 3),
  d: `${0.9 + (i % 4) * 0.25}s`,
  dl: `-${(i * 0.13) % 1}s`,
}))

// Reloj de Año Nuevo — 12 hour ticks + golden fireworks on Dec 31 / Año Nuevo
const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => i * 30)
const GOLD_WAVES = [
  { color: "#FDE68A", glow: "#F59E0B", delay: 0,   pts: _piroRing(58) },
  { color: "#FACC15", glow: "#CA8A04", delay: 0.6, pts: _piroRing(48) },
  { color: "#FFFFFF", glow: "#FDE68A", delay: 1.2, pts: _piroRing(64) },
]

// Nevada — flakes falling inside the HUD circle
const HUD_SNOW = Array.from({ length: 16 }, (_, i) => ({
  l: `${18 + ((i * 29) % 64)}%`,
  s: 2 + (i % 3),
  d: `${2.6 + (i % 4) * 0.5}s`,
  dl: `-${(i * 0.37) % 3}s`,
}))

const HUD_EMBERS = [
  { l: "50%", b: "28%", s: 3, d: "2.2s", dl: "0s",    an: "hw-ember-c" },
  { l: "47%", b: "30%", s: 4, d: "2.8s", dl: "0.4s",  an: "hw-ember-l" },
  { l: "53%", b: "26%", s: 2, d: "2.0s", dl: "0.8s",  an: "hw-ember-r" },
  { l: "45%", b: "32%", s: 3, d: "3.1s", dl: "1.2s",  an: "hw-ember-l" },
  { l: "55%", b: "29%", s: 4, d: "2.5s", dl: "0.2s",  an: "hw-ember-r" },
  { l: "48%", b: "27%", s: 2, d: "1.9s", dl: "1.6s",  an: "hw-ember-c" },
  { l: "52%", b: "31%", s: 5, d: "2.7s", dl: "0.6s",  an: "hw-ember-r" },
  { l: "46%", b: "33%", s: 3, d: "2.3s", dl: "1.0s",  an: "hw-ember-l" },
  { l: "54%", b: "28%", s: 2, d: "3.0s", dl: "1.4s",  an: "hw-ember-c" },
  { l: "49%", b: "25%", s: 4, d: "2.1s", dl: "0.3s",  an: "hw-ember-l" },
  { l: "51%", b: "30%", s: 3, d: "2.6s", dl: "1.8s",  an: "hw-ember-r" },
  { l: "50%", b: "26%", s: 2, d: "2.4s", dl: "0.9s",  an: "hw-ember-c" },
]

// Pirotecnia — 3 burst waves (Colombian flag: yellow / blue / red) × 10 particles
function _piroRing(dist: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2
    return { px: Math.round(Math.cos(a) * dist), py: Math.round(Math.sin(a) * dist) }
  })
}
const PIRO_WAVES = [
  { color: "#FCD34D", glow: "#F59E0B", delay: 0,   pts: _piroRing(55) },
  { color: "#3B82F6", glow: "#2563EB", delay: 0.5, pts: _piroRing(63) },
  { color: "#EF4444", glow: "#DC2626", delay: 1.0, pts: _piroRing(50) },
]

// Galaxy — 4 orbital layers at different radii and angular velocities
const GALAXY_LAYERS = [
  { n: 7, top: "7%",  dur: 9,  anim: "hw-spark-orbit",  sz: 2, color: "#FCD34D", glow: "#F59E0B" },
  { n: 5, top: "17%", dur: 7,  anim: "hw-vortex-spin2", sz: 2, color: "#93C5FD", glow: "#3B82F6" },
  { n: 6, top: "27%", dur: 5,  anim: "hw-spark-orbit",  sz: 3, color: "#FDA4AF", glow: "#F43F5E" },
  { n: 4, top: "37%", dur: 11, anim: "hw-vortex-spin2", sz: 2, color: "#6EE7B7", glow: "#10B981" },
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
  const season = useSeason()
  const isXmas = season === "navidad" || season === "anoNuevo"
  const hudPhases: readonly HudPhase[] =
    season === "navidad" ? HUD_PHASES_XMAS : season === "anoNuevo" ? HUD_PHASES_NEW_YEAR : HUD_PHASES
  const [hudPhase, setHudPhase] = useState<HudPhase>("sparks")
  const [hudFading, setHudFading] = useState(false)
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [globeShaking, setGlobeShaking] = useState(false)
  // Reloj: fraction of the day elapsed (0 → 1 at midnight) + hand angles, Colombia time
  const [clock, setClock] = useState<{ dayFrac: number; hourDeg: number; minDeg: number; dec31: boolean } | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  // Temporada abre con su fase: nevada en Navidad, reloj en Año Nuevo
  useEffect(() => {
    if (season === "navidad") setHudPhase("nevada")
    else if (season === "anoNuevo") setHudPhase("reloj")
  }, [season])

  const advanceHud = useCallback(() => {
    setHudFading(true)
    setTimeout(() => {
      setHudPhase(p => hudPhases[(hudPhases.indexOf(p) + 1) % hudPhases.length])
      setHudFading(false)
    }, 700)
  }, [hudPhases])

  const restartCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current)
    cycleRef.current = setInterval(advanceHud, 5500)
  }, [advanceHud])

  const handleHudClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Onda expansiva desde el punto tocado
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 800)

    // iOS only fires deviceorientation after an explicit permission request from a gesture
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    DOE?.requestPermission?.().catch(() => {})

    if (hudPhase === "esfera") {
      // La bola se sacude en vez de cambiar de fase; da tiempo de verla nevar
      setGlobeShaking(true)
      setTimeout(() => setGlobeShaking(false), 1600)
      restartCycle()
      return
    }
    advanceHud()
    restartCycle()
  }, [hudPhase, advanceHud, restartCycle])

  useEffect(() => {
    cycleRef.current = setInterval(advanceHud, 5500)
    return () => { if (cycleRef.current) clearInterval(cycleRef.current) }
  }, [advanceHud])

  // Reloj — refresh every 20s while the clock phase is on screen
  useEffect(() => {
    if (hudPhase !== "reloj") return
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Bogota", hour: "numeric", minute: "numeric", second: "numeric",
        month: "numeric", day: "numeric", hourCycle: "h23",
      }).formatToParts(new Date())
      const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0)
      const h = get("hour"), m = get("minute"), s = get("second")
      setClock({
        dayFrac: (h * 3600 + m * 60 + s) / 86400,
        hourDeg: ((h % 12) + m / 60) * 30,
        minDeg: (m + s / 60) * 6,
        dec31: get("month") === 12 && get("day") === 31,
      })
    }
    tick()
    const id = setInterval(tick, 20_000)
    return () => clearInterval(id)
  }, [hudPhase])

  // Inclinación 3D — mouse on desktop, gyroscope on phones. Written straight to the
  // DOM (no re-render per frame)
  useEffect(() => {
    const el = hudRef.current
    if (!el || reducedMotion) return
    const MAX = 12
    let frame = 0
    const apply = (rx: number, ry: number) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
      })
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      apply(Math.max(-1, Math.min(1, ny)) * -MAX, Math.max(-1, Math.min(1, nx)) * MAX)
    }
    const onLeave = () => apply(0, 0)
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      // beta ~45° is how a phone is usually held; tilt relative to that
      const rx = Math.max(-MAX, Math.min(MAX, (e.beta - 45) / 3))
      const ry = Math.max(-MAX, Math.min(MAX, e.gamma / 3))
      apply(-rx, ry)
    }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    window.addEventListener("deviceorientation", onOrient)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("deviceorientation", onOrient)
    }
  }, [reducedMotion])

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
          background: linear-gradient(90deg, #e84118 0%, #f05428 35%, #ff7a50 65%, #e84118 100%);
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

        /* ── HUD: electric sparks ── */
        @keyframes hw-spark-orbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes hw-spark-blink {
          0%, 100% { opacity: 1; transform: scale(1) translateX(-50%); }
          40%       { opacity: 0.15; transform: scale(0.3) translateX(-165%); }
          70%       { opacity: 0.8; transform: scale(1.4) translateX(-35%); }
        }

        /* ── HUD: vortex portal ── */
        @keyframes hw-vortex-spin  { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
        @keyframes hw-vortex-spin2 { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }
        @keyframes hw-vortex-pulse { 0%,100% { opacity:.55; transform: scale(1) }  50% { opacity:.8; transform: scale(1.06) } }

        /* ── HUD: heartbeat pulse ── */
        @keyframes hw-hb-ring1 {
          0%,100%  { transform: scale(1);    opacity: 0; }
          5%       { transform: scale(1.02); opacity: 0.85; }
          45%      { transform: scale(1.55); opacity: 0; }
        }
        @keyframes hw-hb-ring2 {
          0%,100%  { transform: scale(1);    opacity: 0; }
          18%      { transform: scale(1.02); opacity: 0.7; }
          58%      { transform: scale(1.5);  opacity: 0; }
        }
        @keyframes hw-hb-logo {
          0%,100%  { transform: scale(1); }
          6%       { transform: scale(1.10); }
          11%      { transform: scale(1); }
          20%      { transform: scale(1.07); }
          25%      { transform: scale(1); }
        }
        @keyframes hw-hb-glow {
          0%,100%  { opacity: 0.3; transform: scale(1); }
          6%       { opacity: 0.9; transform: scale(1.2); }
          11%      { opacity: 0.3; transform: scale(1); }
          20%      { opacity: 0.7; transform: scale(1.15); }
          25%      { opacity: 0.3; transform: scale(1); }
        }

        /* ── HUD: glitch ── */
        @keyframes hw-glitch-flicker {
          0%,78%,100% { opacity: 1; }
          79%  { opacity: 0.15; }
          80%  { opacity: 1; }
          82%  { opacity: 0.4; }
          83%  { opacity: 1; }
          91%  { opacity: 0.05; }
          92%  { opacity: 1; }
        }
        @keyframes hw-glitch-r {
          0%,76%,100% { transform: translate(0,0);   opacity: 0; }
          77%  { transform: translate(5px,  1px); opacity: 0.45; }
          79%  { transform: translate(-3px, 0px); opacity: 0.3; }
          81%  { transform: translate(0,0);        opacity: 0; }
          89%  { transform: translate(6px, -2px); opacity: 0.35; }
          91%  { transform: translate(0,0);        opacity: 0; }
        }
        @keyframes hw-glitch-b {
          0%,76%,100% { transform: translate(0,0);   opacity: 0; }
          77%  { transform: translate(-4px, 2px); opacity: 0.4; }
          79%  { transform: translate(3px, -1px); opacity: 0.25; }
          81%  { transform: translate(0,0);        opacity: 0; }
          89%  { transform: translate(-5px, 1px); opacity: 0.3; }
          91%  { transform: translate(0,0);        opacity: 0; }
        }
        @keyframes hw-glitch-scan {
          0%   { transform: translateY(-110%); opacity: 0.6; }
          100% { transform: translateY(210%);  opacity: 0.1; }
        }
        @keyframes hw-glitch-bar {
          0%,74%,100% { opacity: 0; transform: scaleY(0); }
          75%  { opacity: 1; transform: scaleY(1); }
          78%  { opacity: 0; transform: scaleY(1); }
        }

        /* ── HUD: ember / fire particles ── */
        @keyframes hw-ember-c {
          0%   { transform: translateY(0)     translateX(0);     opacity: 0.95; }
          60%  { opacity: 0.5; }
          100% { transform: translateY(-80px) translateX(3px);   opacity: 0; }
        }
        @keyframes hw-ember-l {
          0%   { transform: translateY(0)     translateX(0);     opacity: 0.95; }
          60%  { opacity: 0.5; }
          100% { transform: translateY(-78px) translateX(-16px); opacity: 0; }
        }
        @keyframes hw-ember-r {
          0%   { transform: translateY(0)     translateX(0);     opacity: 0.95; }
          60%  { opacity: 0.5; }
          100% { transform: translateY(-78px) translateX(16px);  opacity: 0; }
        }

        /* ── HUD: pirotecnia / fireworks ── */
        @keyframes hw-piro-burst {
          0%, 65%, 100% { transform: translate(0,0) scale(0); opacity: 0; }
          4%  { transform: translate(0,0) scale(1); opacity: 1; }
          35% { transform: translate(var(--px,50px), var(--py,-50px)) scale(0.15); opacity: 0; }
        }
        @keyframes hw-piro-flash {
          0%, 65%, 100% { opacity: 0; transform: scale(0); }
          2%  { opacity: 1; transform: scale(2.5); }
          12% { opacity: 0.4; transform: scale(1); }
          22% { opacity: 0; }
        }

        /* ── HUD: aurora boreal ── */
        @keyframes hw-aurora-hue {
          from { filter: hue-rotate(0deg) blur(5px); }
          to   { filter: hue-rotate(360deg) blur(5px); }
        }
        @keyframes hw-aurora-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.95; }
        }
        @keyframes hw-aurora-inner {
          from { filter: hue-rotate(180deg) blur(10px); }
          to   { filter: hue-rotate(540deg) blur(10px); }
        }

        /* ── HUD: radar sweep ── */
        @keyframes hw-radar-sweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hw-radar-blip {
          0%  { opacity: 0; }
          3%  { opacity: 1; }
          18% { opacity: 0.4; }
          30% { opacity: 0; }
          100%{ opacity: 0; }
        }

        /* ── HUD: nevada ── */
        @keyframes hw-snow-fall {
          0%   { transform: translateY(-10%) translateX(0);    opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translateY(45%)  translateX(6px);  }
          85%  { opacity: 0.8; }
          100% { transform: translateY(100%) translateX(-4px); opacity: 0; }
        }

        /* ── HUD: poste de barbero ── */
        @keyframes hw-pole-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

        /* ── HUD: tijeras ── */
        @keyframes hw-snip-a {
          0%, 60%, 100% { transform: rotate(-16deg); }
          75%           { transform: rotate(0deg); }
        }
        @keyframes hw-snip-b {
          0%, 60%, 100% { transform: rotate(16deg); }
          75%           { transform: rotate(0deg); }
        }
        @keyframes hw-hair-fall {
          0%   { transform: translateY(0) rotate(var(--hr, 0deg));   opacity: 0; }
          15%  { opacity: 0.9; }
          100% { transform: translateY(70%) rotate(calc(var(--hr, 0deg) + 90deg)); opacity: 0; }
        }

        /* ── HUD: brillo de navaja ── */
        @keyframes hw-razor-sweep {
          0%, 15%   { transform: translateX(-75%); }
          55%, 100% { transform: translateX(75%); }
        }

        /* ── HUD: bola navideña ── */
        @keyframes hw-globe-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
        @keyframes hw-globe-shake {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25%       { transform: rotate(-7deg) translateX(-4px); }
          75%       { transform: rotate(7deg) translateX(4px); }
        }

        /* ── HUD: onda al tocar ── */
        @keyframes hw-ripple {
          from { transform: scale(0.4); opacity: 1; }
          to   { transform: scale(7);   opacity: 0; }
        }

        /* Reducir movimiento: HUD estático, sin ondas */
        @media (prefers-reduced-motion: reduce) {
          .fs-hud-root, .fs-hud-root * { animation: none !important; }
        }

        /* ── HUD: sonic pulse rings ── */
        @keyframes hw-sonic-ring {
          0%   { transform: scale(0.35); opacity: 0.9; }
          60%  { opacity: 0.35; }
          100% { transform: scale(1.12); opacity: 0; }
        }
      `}</style>

      <section className="relative pt-24 min-h-screen flex items-center overflow-hidden">

        {/* ── Background ── */}
        {/* Gradient vignette so hero text stays readable over parallax bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000a1a]/70 via-[#00050f]/25 to-[#000a1a]/70 pointer-events-none" />
        {/* Extra directional darkening — desktop left, mobile bottom */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#000a1a]/60 via-transparent to-transparent pointer-events-none hidden lg:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000a1a]/80 via-[#00050f]/30 to-transparent pointer-events-none lg:hidden" />
        <div className="absolute inset-0 fs-dot-grid pointer-events-none" />
        <div className="fs-orb-1 absolute -top-[15%] -left-[5%]  w-[700px] h-[700px] rounded-full bg-[#e84118]/6 blur-[140px] pointer-events-none" />
        {/* Navidad: orbes verde pino en vez de violeta */}
        <div className={`fs-orb-2 absolute  top-[5%]  right-[-10%] w-[550px] h-[550px] rounded-full blur-[110px] pointer-events-none ${isXmas ? "bg-[#16a34a]/8" : "bg-[#7c3aed]/6"}`} />
        <div className={`absolute bottom-[15%] right-[20%]          w-[350px] h-[350px] rounded-full blur-[90px]  pointer-events-none ${isXmas ? "bg-[#facc15]/5" : "bg-[#7c3aed]/4"}`} />

        {/* Scan line */}
        <div className="fs-scan absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e84118]/25 to-transparent pointer-events-none z-10" />

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 transition-opacity duration-700 pointer-events-none ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-[9px] text-white/20 tracking-[0.3em] font-bold uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1">
            <div
              className="w-[3px] h-[6px] rounded-full bg-[#e84118]/60"
              style={{ animation: "fs-scroll-dot 1.8s ease-in-out infinite" }}
            />
          </div>
          <ChevronDown weight="duotone" size={12} className="text-white/15" />
        </div>

        {/* Top / bottom fades */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#000a1a] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#000a1a] to-transparent pointer-events-none z-10" />

        {/* ── Content ── */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-10 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">

            {/* ─── HUD Logo — top on mobile, right on desktop ─── */}
            {/* Tilt target is this wrapper: .fs-hud's entrance animation pins its own transform */}
            <div
              ref={hudRef}
              className="order-1 lg:order-2 flex items-center justify-center"
              style={{ transition: "transform 0.25s ease-out", transformStyle: "preserve-3d" }}
            >
              <div
                className={`fs-logo-in fs-hud fs-hud-root relative flex items-center justify-center mx-auto w-[240px] h-[240px] lg:w-[400px] lg:h-[400px] cursor-pointer select-none`}
                onClick={handleHudClick}
                title={hudPhase === "esfera" ? "Toca para sacudir la bola" : "Toca para siguiente fase"}
              >
                {/* ── Ondas al tocar ── */}
                {ripples.map((rp) => (
                  <span
                    key={rp.id}
                    className="absolute rounded-full pointer-events-none z-30"
                    style={{
                      left: rp.x, top: rp.y, width: 24, height: 24, marginLeft: -12, marginTop: -12,
                      border: "2px solid rgba(232,65,24,0.8)",
                      boxShadow: "0 0 12px rgba(245,200,66,0.5)",
                      animation: "hw-ripple 0.8s ease-out forwards",
                    }}
                  />
                ))}


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
                    <div className="absolute inset-0 bg-[#e84118]/10" />
                  </div>
                )}

                {/* Same HUD scaled via percentage-based insets */}

                {/* Corner brackets */}
                <div className="absolute top-0 left-0   w-7 h-7 lg:w-10 lg:h-10 border-t-2 border-l-2 border-[#e84118]/45" />
                <div className="absolute top-0 right-0  w-7 h-7 lg:w-10 lg:h-10 border-t-2 border-r-2 border-[#e84118]/45" />
                <div className="absolute bottom-0 left-0  w-7 h-7 lg:w-10 lg:h-10 border-b-2 border-l-2 border-[#e84118]/45" />
                <div className="absolute bottom-0 right-0 w-7 h-7 lg:w-10 lg:h-10 border-b-2 border-r-2 border-[#e84118]/45" />

                {/* HUD labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] tracking-[0.3em] font-bold text-[#e84118]/35 uppercase whitespace-nowrap">
                  {shopName}
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] tracking-[0.25em] font-bold text-white/20 uppercase whitespace-nowrap">
                  {shopName}
                </div>

                {/* Side tick marks */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[5, 3, 10, 3, 5].map((w, i) => (
                    <div key={i} className="h-px bg-[#e84118]/30" style={{ width: w }} />
                  ))}
                </div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end">
                  {[5, 3, 10, 3, 5].map((w, i) => (
                    <div key={i} className="h-px bg-[#e84118]/30" style={{ width: w }} />
                  ))}
                </div>

                {/* Spinning rings (% inset so they scale with parent) */}
                <div
                  className="fs-ring-cw absolute rounded-full border border-[#e84118]/12 border-dashed"
                  style={{ inset: "5%" }}
                />
                <div
                  className="fs-ring-ccw absolute rounded-full border border-[#e84118]/18"
                  style={{ inset: "13%" }}
                />

                {/* ── Electric sparks phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: hudPhase === "sparks" && !hudFading ? 1 : 0,
                    transition: "opacity 0.7s ease",
                  }}
                >
                  {HUD_SPARKS.map((sp, i) => (
                    <div
                      key={i}
                      className="absolute inset-0"
                      style={{ animation: `hw-spark-orbit ${sp.dur} ${sp.delay} linear infinite` }}
                    >
                      <div
                        className="absolute top-[5%] left-1/2 rounded-full"
                        style={{
                          width: sp.sz,
                          height: sp.sz * 2.5,
                          marginTop: -sp.sz,
                          animation: `hw-spark-blink ${parseFloat(sp.dur) * 0.55}s ${sp.delay} ease-in-out infinite`,
                          background: "linear-gradient(to bottom, #fff, #a78bfa)",
                          filter: "drop-shadow(0 0 3px #7c3aed) drop-shadow(0 0 7px #fff)",
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* ── Ember / fire particles phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
                  style={{
                    opacity: hudPhase === "embers" && !hudFading ? 1 : 0,
                    transition: "opacity 0.7s ease",
                  }}
                >
                  {HUD_EMBERS.map((em, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: em.l,
                        bottom: em.b,
                        width: em.s,
                        height: em.s,
                        transform: "translateX(-50%)",
                        background: `radial-gradient(circle, ${i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f97316" : "#ef4444"} 0%, transparent 100%)`,
                        filter: `blur(0.5px) drop-shadow(0 0 ${em.s + 2}px ${i % 2 === 0 ? "#f97316" : "#e84118"})`,
                        animation: `${em.an} ${em.d} ${em.dl} ease-out infinite`,
                      }}
                    />
                  ))}
                  {/* Warm ember glow at base */}
                  <div
                    className="absolute bottom-[22%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                    style={{
                      width: "40%", height: "15%",
                      background: "radial-gradient(ellipse, rgba(249,115,22,0.35) 0%, transparent 70%)",
                      filter: "blur(6px)",
                    }}
                  />
                </div>

                {/* ── Vortex / portal phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "vortex" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  <div className="absolute rounded-full overflow-hidden" style={{ inset: "14%", animation: "hw-vortex-spin 9s linear infinite" }}>
                    <div className="absolute inset-0" style={{ background: "conic-gradient(from 0deg,#050018,#2d0060,#4c1d95,#0d0035,#1a0050,#7c3aed,#050018)", animation: "hw-vortex-pulse 3s ease-in-out infinite" }} />
                  </div>
                  <div className="absolute rounded-full overflow-hidden" style={{ inset: "28%", animation: "hw-vortex-spin2 6s linear infinite" }}>
                    <div className="absolute inset-0" style={{ background: "conic-gradient(from 180deg,#0a0025,#3b0082,#0d0035,#2d0060,#0a0025)" }} />
                  </div>
                  <div className="absolute inset-[40%] rounded-full" style={{ background: "radial-gradient(circle,rgba(167,139,250,0.65) 0%,rgba(109,40,217,0.3) 50%,transparent 100%)", animation: "hw-vortex-pulse 2.5s ease-in-out infinite" }} />
                </div>

                {/* ── Heartbeat pulse phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "heartbeat" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Lub — first ring burst */}
                  <div className="absolute rounded-full border-2 border-[#e84118]" style={{ inset: "13%", animation: "hw-hb-ring1 2.5s ease-out infinite" }} />
                  {/* Dub — second ring burst */}
                  <div className="absolute rounded-full border border-[#f97316]/70" style={{ inset: "13%", animation: "hw-hb-ring2 2.5s ease-out infinite" }} />
                  {/* Throb glow */}
                  <div className="absolute rounded-full" style={{ inset: "20%", background: "radial-gradient(circle,rgba(232,65,24,0.55) 0%,transparent 70%)", animation: "hw-hb-glow 2.5s ease-out infinite" }} />
                </div>

                {/* ── Glitch / corrupted signal phase ── */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
                  style={{ opacity: hudPhase === "glitch" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Red channel offset */}
                  <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,0,60,0.12)", mixBlendMode: "screen", animation: "hw-glitch-r 3.5s ease-in-out infinite" }} />
                  {/* Cyan channel offset */}
                  <div className="absolute inset-0 rounded-full" style={{ background: "rgba(0,180,255,0.10)", mixBlendMode: "screen", animation: "hw-glitch-b 3.5s ease-in-out 0.05s infinite" }} />
                  {/* Scanline sweep */}
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0f0]/40 to-transparent" style={{ animation: "hw-glitch-scan 2.8s linear infinite" }} />
                  {/* Horizontal glitch bars */}
                  <div className="absolute left-0 right-0 bg-white/8" style={{ top: "35%", height: "4px", transformOrigin: "left", animation: "hw-glitch-bar 3.5s steps(1) infinite" }} />
                  <div className="absolute left-0 right-0 bg-white/5" style={{ top: "62%", height: "2px", transformOrigin: "left", animation: "hw-glitch-bar 3.5s steps(1) 0.2s infinite" }} />
                </div>

                {/* ── Pirotecnia / fireworks burst phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "pirotecnia" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {PIRO_WAVES.map((wave, wi) => wave.pts.map((p, pi) => (
                    <div
                      key={`${wi}-${pi}`}
                      className="absolute rounded-full"
                      style={{
                        width: 3, height: 3,
                        top: "50%", left: "50%",
                        marginTop: -1.5, marginLeft: -1.5,
                        background: wave.color,
                        filter: `drop-shadow(0 0 3px ${wave.glow})`,
                        "--px": p.px + "px",
                        "--py": p.py + "px",
                        animation: `hw-piro-burst 2.8s ${wave.delay + pi * 0.025}s ease-out infinite`,
                      } as any}
                    />
                  )))}
                  {PIRO_WAVES.map((wave, wi) => (
                    <div
                      key={wi}
                      className="absolute rounded-full"
                      style={{
                        width: 10, height: 10,
                        top: "50%", left: "50%",
                        marginTop: -5, marginLeft: -5,
                        background: wave.color,
                        filter: `blur(2px) drop-shadow(0 0 6px ${wave.glow})`,
                        animation: `hw-piro-flash 2.8s ${wave.delay}s ease-out infinite`,
                      }}
                    />
                  ))}
                </div>

                {/* ── Aurora boreal phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  // Toned down: the pulse keyframes animate opacity, so the cap lives on this wrapper
                  style={{ opacity: hudPhase === "aurora" && !hudFading ? 0.7 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Rings with a clear centre (radial mask) so the logo stays readable */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "5%",
                      background: "conic-gradient(#ff0066,#ff9900,#ffff00,#00ff66,#0099ff,#cc00ff,#ff0066)",
                      animation: "hw-aurora-hue 7s linear infinite, hw-aurora-pulse 3.5s ease-in-out infinite",
                      WebkitMask: "radial-gradient(circle, transparent 58%, #000 72%)",
                      mask: "radial-gradient(circle, transparent 58%, #000 72%)",
                    }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "16%",
                      background: "conic-gradient(#00ffcc,#0066ff,#cc00ff,#ff6600,#00ffcc)",
                      animation: "hw-aurora-inner 9s linear infinite, hw-aurora-pulse 4s ease-in-out 1s infinite",
                      WebkitMask: "radial-gradient(circle, transparent 62%, #000 78%)",
                      mask: "radial-gradient(circle, transparent 62%, #000 78%)",
                    }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "30%",
                      background: "radial-gradient(circle, rgba(100,200,255,0.4) 0%, rgba(150,0,255,0.2) 50%, transparent 70%)",
                      animation: "hw-aurora-pulse 2.5s ease-in-out 0.5s infinite",
                      filter: "blur(6px)",
                    }}
                  />
                </div>

                {/* ── Radar sweep phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "radar" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  <div className="absolute rounded-full border border-[#0f9]/10" style={{ inset: "12%" }} />
                  <div className="absolute rounded-full border border-[#0f9]/8"  style={{ inset: "28%" }} />
                  <div className="absolute rounded-full border border-[#0f9]/6"  style={{ inset: "42%" }} />
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{ animation: "hw-radar-sweep 3.5s linear infinite" }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "conic-gradient(from -55deg, transparent 0deg, rgba(0,255,100,0.04) 20deg, rgba(0,255,100,0.18) 55deg, transparent 56deg)",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        top: "50%", left: "50%",
                        width: "43%", height: 2,
                        marginTop: -1,
                        transformOrigin: "0 50%",
                        background: "linear-gradient(to right, rgba(0,255,100,0.9), transparent)",
                        filter: "drop-shadow(0 0 3px rgba(0,255,100,0.6))",
                      }}
                    />
                  </div>
                  {[
                    { top: "7%",  left: "50%", delay: "2.625s" },
                    { top: "50%", left: "92%", delay: "0s"     },
                    { top: "92%", left: "50%", delay: "0.875s" },
                    { top: "50%", left: "7%",  delay: "1.75s"  },
                  ].map((blip, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        top: blip.top, left: blip.left,
                        width: 5, height: 5,
                        marginTop: -2.5, marginLeft: -2.5,
                        background: "#0f9",
                        filter: "drop-shadow(0 0 5px #0f9)",
                        animation: `hw-radar-blip 3.5s ${blip.delay} ease-out infinite`,
                      }}
                    />
                  ))}
                </div>

                {/* ── Galaxy orbits phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "galaxia" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {GALAXY_LAYERS.map((layer, li) =>
                    Array.from({ length: layer.n }, (_, pi) => (
                      <div
                        key={`${li}-${pi}`}
                        className="absolute inset-0"
                        style={{
                          animation: `${layer.anim} ${layer.dur}s ${-(pi / layer.n) * layer.dur}s linear infinite`,
                        }}
                      >
                        <div
                          className="absolute left-1/2 rounded-full"
                          style={{
                            top: layer.top,
                            width: layer.sz,
                            height: layer.sz * 1.8,
                            marginLeft: -layer.sz / 2,
                            marginTop: -layer.sz / 2,
                            background: layer.color,
                            filter: `drop-shadow(0 0 3px ${layer.glow})`,
                          }}
                        />
                      </div>
                    ))
                  )}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "35%",
                      background: "radial-gradient(circle, rgba(252,211,77,0.2) 0%, rgba(59,130,246,0.1) 50%, transparent 100%)",
                      filter: "blur(8px)",
                      animation: "hw-aurora-pulse 4s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* ── Nevada / snowfall phase (Navidad) ── */}
                <div
                  className="absolute pointer-events-none overflow-hidden rounded-full"
                  style={{ inset: "13%", opacity: hudPhase === "nevada" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Each flake rides a full-size layer so translateY(%) spans the whole circle */}
                  {HUD_SNOW.map((f, i) => (
                    <div
                      key={i}
                      className="absolute inset-0"
                      style={{ animation: `hw-snow-fall ${f.d} ${f.dl} linear infinite` }}
                    >
                      <div
                        className="absolute top-0 rounded-full bg-white"
                        style={{
                          left: f.l,
                          width: f.s,
                          height: f.s,
                          boxShadow: "0 0 5px rgba(255,255,255,0.8)",
                        }}
                      />
                    </div>
                  ))}
                  {/* Cold glow at the bottom, like snow piling up */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1/4"
                    style={{ background: "radial-gradient(ellipse at bottom, rgba(220,240,255,0.25) 0%, transparent 70%)" }}
                  />
                </div>

                {/* ── Poste de barbero phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "poste" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Candy-stripe ring: spinning conic stripes read as the pole's spiral */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "6%",
                      background: "repeating-conic-gradient(#e84118 0deg 12deg, #ffffff 12deg 24deg, #1d4ed8 24deg 36deg, #ffffff 36deg 48deg)",
                      WebkitMask: "radial-gradient(circle closest-side, transparent 76%, #000 77%, #000 88%, transparent 89%)",
                      mask: "radial-gradient(circle closest-side, transparent 76%, #000 77%, #000 88%, transparent 89%)",
                      animation: "hw-pole-spin 6s linear infinite",
                      filter: "drop-shadow(0 0 6px rgba(232,65,24,0.5))",
                    }}
                  />
                  {/* Chrome caps — thin silver rims on both sides of the stripes */}
                  <div className="absolute rounded-full border border-white/40" style={{ inset: "6%" }} />
                  <div className="absolute rounded-full border border-white/25" style={{ inset: "11.5%" }} />
                  {/* Thin counter-spinning inner ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "18%",
                      background: "repeating-conic-gradient(rgba(232,65,24,0.6) 0deg 8deg, transparent 8deg 30deg)",
                      WebkitMask: "radial-gradient(circle closest-side, transparent 93%, #000 95%, #000 99%, transparent 100%)",
                      mask: "radial-gradient(circle closest-side, transparent 93%, #000 95%, #000 99%, transparent 100%)",
                      animation: "hw-pole-spin 9s linear infinite reverse",
                    }}
                  />
                </div>

                {/* ── Tijeras phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "tijeras" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Scissors orbit the ring, snipping as they go */}
                  <div className="absolute inset-0" style={{ animation: "hw-spark-orbit 6s linear infinite" }}>
                    <svg
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{ top: "3%", width: "17%", height: "17%", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}
                      viewBox="0 0 40 40"
                    >
                      {[{ anim: "hw-snip-a", cy: 31 }, { anim: "hw-snip-b", cy: 9 }].map((b) => (
                        <g
                          key={b.anim}
                          style={{ transformOrigin: "20px 20px", transformBox: "view-box", animation: `${b.anim} 1.2s ease-in-out infinite` }}
                        >
                          {/* Blade */}
                          <path d="M20 20 L39 20" stroke="#e5e7eb" strokeWidth={2.6} strokeLinecap="round" />
                          {/* Shank + ring handle */}
                          <path d={`M20 20 L10 ${b.cy > 20 ? 27 : 13}`} stroke="#e84118" strokeWidth={2.2} strokeLinecap="round" />
                          <circle cx={7} cy={b.cy} r={4.5} fill="none" stroke="#e84118" strokeWidth={2.2} />
                        </g>
                      ))}
                      <circle cx={20} cy={20} r={1.6} fill="#F5C842" />
                    </svg>
                  </div>
                  {/* Falling hair clippings */}
                  <div className="absolute rounded-full overflow-hidden" style={{ inset: "14%" }}>
                    {HUD_HAIR.map((h, i) => (
                      <div key={i} className="absolute inset-0" style={{ animation: `hw-hair-fall ${h.d} ${h.dl} ease-in infinite`, ["--hr" as string]: `${h.rot}deg` } as React.CSSProperties}>
                        <div
                          className="absolute rounded-full"
                          style={{ left: h.l, top: "8%", width: 1.5, height: h.len, background: i % 3 === 0 ? "#f5f5f4" : "#a8a29e" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Brillo de navaja phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "navaja" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Steel ring with a travelling glint */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "13%",
                      background: "conic-gradient(from 0deg, #6b7280, #e5e7eb 20deg, #9ca3af 60deg, #4b5563 180deg, #d1d5db 300deg, #6b7280)",
                      WebkitMask: "radial-gradient(circle closest-side, transparent 94%, #000 96%, #000 99%, transparent 100%)",
                      mask: "radial-gradient(circle closest-side, transparent 94%, #000 96%, #000 99%, transparent 100%)",
                      animation: "hw-pole-spin 4s linear infinite",
                    }}
                  />
                  {/* Diagonal light sweep across the logo, like light running along a blade */}
                  <div className="absolute rounded-full overflow-hidden z-20" style={{ inset: "14%" }}>
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: "-75%", width: "250%",
                        background: "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.08) 54%, transparent 58%)",
                        animation: "hw-razor-sweep 2.4s ease-in-out infinite",
                        mixBlendMode: "screen",
                      }}
                    />
                  </div>
                </div>

                {/* ── Bola navideña phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "esfera" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transformOrigin: "50% 8%",
                      animation: globeShaking ? "hw-globe-shake 0.4s ease-in-out 4" : "hw-globe-sway 4s ease-in-out infinite",
                    }}
                  >
                    {/* Gold cap + hook */}
                    <div className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-[#FACC15]" style={{ top: "5%", width: "7%", height: "6%" }} />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 rounded-t-md"
                      style={{ top: "10%", width: "16%", height: "5.5%", background: "linear-gradient(90deg,#a16207,#fde68a 45%,#ca8a04)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
                    />
                    {/* Glass sphere */}
                    <div
                      className="absolute rounded-full overflow-hidden"
                      style={{
                        inset: "14%",
                        background: "radial-gradient(circle at 50% 60%, rgba(185,28,28,0.18) 0%, rgba(20,83,45,0.22) 60%, rgba(255,255,255,0.06) 100%)",
                        border: "1.5px solid rgba(255,255,255,0.25)",
                        boxShadow: "inset 0 0 30px rgba(255,255,255,0.12), inset -10px -14px 30px rgba(0,0,0,0.35), 0 0 24px rgba(250,204,21,0.15)",
                      }}
                    >
                      {/* Gentle snow inside */}
                      {HUD_SNOW.map((f, i) => (
                        <div key={i} className="absolute inset-0" style={{ animation: `hw-snow-fall ${f.d} ${f.dl} linear infinite` }}>
                          <div className="absolute top-0 rounded-full bg-white" style={{ left: f.l, width: f.s, height: f.s, opacity: 0.85 }} />
                        </div>
                      ))}
                      {/* Storm — only while shaken */}
                      <div className="absolute inset-0" style={{ opacity: globeShaking ? 1 : 0, transition: "opacity 0.4s ease" }}>
                        {GLOBE_STORM.map((f, i) => (
                          <div key={i} className="absolute inset-0" style={{ animation: `hw-snow-fall ${f.d} ${f.dl} linear infinite` }}>
                            <div className="absolute top-0 rounded-full bg-white" style={{ left: f.l, width: f.s, height: f.s, boxShadow: "0 0 4px #fff" }} />
                          </div>
                        ))}
                      </div>
                      {/* Snow pile at the bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-[16%]" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 55%, transparent 75%)" }} />
                      {/* Glass reflections */}
                      <div className="absolute rounded-full" style={{ top: "9%", left: "16%", width: "30%", height: "18%", background: "radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, transparent 70%)", transform: "rotate(-30deg)" }} />
                      <div className="absolute rounded-full" style={{ bottom: "14%", right: "14%", width: "10%", height: "6%", background: "rgba(255,255,255,0.25)", filter: "blur(2px)" }} />
                    </div>
                  </div>
                </div>

                {/* ── Reloj de Año Nuevo phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "reloj" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {/* Gold ring fills as the day runs toward midnight */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "9%",
                      background: `conic-gradient(#FACC15 0deg, #FDE68A ${(clock?.dayFrac ?? 0) * 360}deg, rgba(255,255,255,0.06) ${(clock?.dayFrac ?? 0) * 360}deg)`,
                      WebkitMask: "radial-gradient(circle, transparent 64%, #000 65%)",
                      mask: "radial-gradient(circle, transparent 64%, #000 65%)",
                      filter: "drop-shadow(0 0 6px rgba(250,204,21,0.5))",
                    }}
                  />
                  {/* Hour ticks — 12 o'clock bigger */}
                  {CLOCK_TICKS.map((deg) => (
                    <div key={deg} className="absolute inset-[14%]" style={{ transform: `rotate(${deg}deg)` }}>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-0 rounded-full"
                        style={{ width: deg === 0 ? 3 : 2, height: deg === 0 ? "9%" : "5%", background: deg === 0 ? "#FACC15" : "rgba(255,255,255,0.55)" }}
                      />
                    </div>
                  ))}
                  {/* Hands — drawn only between the logo (r≈25%) and the ring so they never cross it */}
                  {clock && (
                    <>
                      <div className="absolute inset-0" style={{ transform: `rotate(${clock.hourDeg}deg)`, transition: "transform 1s ease" }}>
                        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#FDE68A]" style={{ top: "17%", width: 4, height: "8%", boxShadow: "0 0 6px rgba(250,204,21,0.8)" }} />
                      </div>
                      <div className="absolute inset-0" style={{ transform: `rotate(${clock.minDeg}deg)`, transition: "transform 1s ease" }}>
                        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white" style={{ top: "11%", width: 2, height: "14%", boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
                      </div>
                    </>
                  )}
                  {/* Golden fireworks — Dec 31 and Año Nuevo */}
                  {(clock?.dec31 || season === "anoNuevo") && (
                    <>
                      {GOLD_WAVES.map((wave, wi) => wave.pts.map((p, pi) => (
                        <div
                          key={`${wi}-${pi}`}
                          className="absolute rounded-full"
                          style={{
                            width: 3, height: 3, top: "50%", left: "50%", marginTop: -1.5, marginLeft: -1.5,
                            background: wave.color,
                            filter: `drop-shadow(0 0 4px ${wave.glow})`,
                            "--px": p.px + "px",
                            "--py": p.py + "px",
                            animation: `hw-piro-burst 2.6s ${wave.delay + pi * 0.025}s ease-out infinite`,
                          } as any}
                        />
                      )))}
                    </>
                  )}
                </div>

                {/* ── Sonic pulse rings phase ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: hudPhase === "sonico" && !hudFading ? 1 : 0, transition: "opacity 0.7s ease" }}
                >
                  {[
                    { delay: "0s",   color: "rgba(255,255,255,0.7)", w: 2   },
                    { delay: "0.6s", color: "rgba(252,211,77,0.55)", w: 1.5 },
                    { delay: "1.2s", color: "rgba(255,255,255,0.4)", w: 1   },
                    { delay: "1.8s", color: "rgba(59,130,246,0.5)",  w: 1.5 },
                    { delay: "2.4s", color: "rgba(255,255,255,0.3)", w: 1   },
                  ].map((ring, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        inset: "13%",
                        border: `${ring.w}px solid ${ring.color}`,
                        animation: `hw-sonic-ring 3s ${ring.delay} ease-out infinite`,
                      }}
                    />
                  ))}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: "35%",
                      background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
                      animation: "hw-sonic-ring 3s ease-out infinite",
                      filter: "blur(4px)",
                    }}
                  />
                </div>

                {/* Radial glow — color follows active phase */}
                <div
                  className="fs-glow absolute rounded-full pointer-events-none"
                  style={{
                    inset: "20%",
                    background:
                      hudPhase === "embers"     ? "radial-gradient(circle,rgba(249,115,22,0.25) 0%,transparent 70%)" :
                      hudPhase === "vortex"     ? "radial-gradient(circle,rgba(109,40,217,0.40) 0%,transparent 70%)" :
                      hudPhase === "heartbeat"  ? "radial-gradient(circle,rgba(232,65,24,0.22) 0%,transparent 70%)" :
                      hudPhase === "glitch"     ? "radial-gradient(circle,rgba(0,220,100,0.18) 0%,transparent 70%)" :
                      hudPhase === "pirotecnia" ? "radial-gradient(circle,rgba(252,211,77,0.30) 0%,transparent 70%)" :
                      hudPhase === "aurora"     ? "radial-gradient(circle,rgba(100,200,255,0.25) 0%,transparent 70%)" :
                      hudPhase === "radar"      ? "radial-gradient(circle,rgba(0,220,100,0.20) 0%,transparent 70%)" :
                      hudPhase === "galaxia"    ? "radial-gradient(circle,rgba(252,211,77,0.15) 0%,transparent 70%)" :
                      hudPhase === "sonico"     ? "radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 70%)" :
                      hudPhase === "nevada"     ? "radial-gradient(circle,rgba(220,38,38,0.22) 0%,rgba(22,163,74,0.12) 45%,transparent 70%)" :
                      hudPhase === "esfera"     ? "radial-gradient(circle,rgba(250,204,21,0.18) 0%,rgba(185,28,28,0.12) 50%,transparent 70%)" :
                      hudPhase === "poste"      ? "radial-gradient(circle,rgba(232,65,24,0.18) 0%,rgba(29,78,216,0.12) 50%,transparent 70%)" :
                      hudPhase === "tijeras"    ? "radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%)" :
                      hudPhase === "navaja"     ? "radial-gradient(circle,rgba(209,213,219,0.18) 0%,transparent 70%)" :
                      hudPhase === "reloj"      ? "radial-gradient(circle,rgba(250,204,21,0.25) 0%,transparent 70%)" :
                                                  "radial-gradient(circle,rgba(139,92,246,0.32) 0%,transparent 70%)",
                    transition: "background 0.7s ease",
                  }}
                />

                {/* Logo — floating, tint adapts to phase */}
                <div className="fs-float relative z-10" style={{ width: "46%", height: "46%" }}>
                  <Image
                    src="/logo2.png"
                    alt="Mi Barbería"
                    fill
                    className="object-contain drop-shadow-2xl"
                    style={{
                      filter:
                        hudPhase === "glitch"     ? "drop-shadow(0 0 14px rgba(0,255,80,0.45)) hue-rotate(90deg)" :
                        hudPhase === "heartbeat"  ? "drop-shadow(0 0 20px rgba(232,65,24,0.65))" :
                        hudPhase === "vortex"     ? "drop-shadow(0 0 18px rgba(167,139,250,0.6))" :
                        hudPhase === "embers"     ? "drop-shadow(0 0 18px rgba(249,115,22,0.55))" :
                        hudPhase === "pirotecnia" ? "drop-shadow(0 0 20px rgba(252,211,77,0.65))" :
                        hudPhase === "aurora"     ? "drop-shadow(0 0 20px rgba(100,200,255,0.55))" :
                        hudPhase === "radar"      ? "drop-shadow(0 0 16px rgba(0,255,100,0.5))" :
                        hudPhase === "galaxia"    ? "drop-shadow(0 0 18px rgba(252,211,77,0.4)) saturate(1.3)" :
                        hudPhase === "sonico"     ? "drop-shadow(0 0 22px rgba(255,255,255,0.5))" :
                        hudPhase === "nevada"     ? "drop-shadow(0 0 20px rgba(255,255,255,0.55)) drop-shadow(0 0 8px rgba(220,38,38,0.4))" :
                        hudPhase === "esfera"     ? "drop-shadow(0 0 16px rgba(255,255,255,0.45))" :
                        hudPhase === "poste"      ? "drop-shadow(0 0 18px rgba(232,65,24,0.55))" :
                        hudPhase === "tijeras"    ? "drop-shadow(0 0 14px rgba(255,255,255,0.4))" :
                        hudPhase === "navaja"     ? "drop-shadow(0 0 16px rgba(229,231,235,0.6)) brightness(1.08)" :
                        hudPhase === "reloj"      ? "drop-shadow(0 0 20px rgba(250,204,21,0.6))" :
                                                    "drop-shadow(0 0 18px rgba(139,92,246,0.5))",
                      transition: "filter 0.7s ease",
                    }}
                  />
                </div>

                {/* Brand line inside HUD */}
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="h-px w-16 lg:w-24 mx-auto mb-1.5 bg-gradient-to-r from-transparent via-[#e84118]/40 to-transparent" />
                  <p className="text-[9px] lg:text-[11px] tracking-[0.35em] font-black text-white/45 uppercase">
                    {shopName}
                  </p>
                </div>
              </div>

            </div>

            {/* ─── Text — bottom on mobile, left on desktop ─── */}
            <div className="order-2 lg:order-1 text-center lg:text-left">

              {/* Seasonal badge */}
              {season === "fiestas" && (
                <div className="flex w-fit mx-auto sm:mx-0 sm:inline-flex items-center gap-2 border border-[#F5C842]/40 bg-[#F5C842]/12 text-[#FDE68A] text-[10px] font-black px-3 py-1.5 rounded-full mb-3 tracking-[0.22em] uppercase"
                  style={{ animation: "fs-dot-blink 2.5s ease-in-out infinite" }}>
                  🎊 Fiestas de Independencia · 11 Nov
                </div>
              )}
              {season === "navidad" && (
                <div className="flex w-fit mx-auto sm:mx-0 sm:inline-flex items-center gap-2 border border-[#dc2626]/40 bg-gradient-to-r from-[#14532d]/40 to-[#7f1d1d]/40 text-[#FDE68A] text-[10px] font-black px-3 py-1.5 rounded-full mb-3 tracking-[0.22em] uppercase"
                  style={{ animation: "fs-dot-blink 2.5s ease-in-out infinite" }}>
                  🎄 <span className="hidden sm:inline">Temporada navideña</span><span className="sm:hidden">Navidad</span> · Reserva tu 24 y 31
                </div>
              )}
              {season === "anoNuevo" && (
                <div className="flex w-fit mx-auto sm:mx-0 sm:inline-flex items-center gap-2 border border-[#F5C842]/40 bg-[#F5C842]/12 text-[#FDE68A] text-[10px] font-black px-3 py-1.5 rounded-full mb-3 tracking-[0.22em] uppercase"
                  style={{ animation: "fs-dot-blink 2.5s ease-in-out infinite" }}>
                  🎆 Feliz {upcomingYear()}<span className="hidden sm:inline"> · Tu primer corte del año</span>
                </div>
              )}

              {/* Location badge */}
              <div className="fs-badge inline-flex items-center gap-2.5 border border-[#e84118]/25 bg-[#e84118]/8 text-[#e84118] text-[11px] font-bold px-4 py-2 rounded-full mb-6 lg:mb-8 tracking-[0.2em]">
                <span className="fs-dot inline-block w-1.5 h-1.5 rounded-full bg-[#e84118]" />
                {city || "Tu ciudad"}
              </div>

              {/* Headline — staggered lines */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black leading-[0.88] tracking-tight mb-6 lg:mb-8">
                <span className="fs-t1 block">Agenda</span>
                <span className="fs-t2 block">tu cita</span>
                {/* Typewriter line */}
                <span className="fs-t3 block min-h-[1em]">
                  <span className="fs-accent">{displayed}</span>
                  <span className="fs-cursor inline-block w-[3px] h-[0.7em] bg-[#e84118] align-middle rounded-sm ml-0.5" />
                </span>
              </h1>

              {/* Thin red divider */}
              <div className="fs-divline h-px bg-gradient-to-r from-transparent via-[#e84118]/40 to-transparent mb-6 lg:mb-8" />

              {/* Subtext */}
              <p className="fs-sub text-base md:text-lg text-white/35 mb-8 lg:mb-10 max-w-sm leading-relaxed font-light mx-auto lg:mx-0">
                Reserva en línea, confirmación instantánea por WhatsApp. Sin llamadas, sin filas.
              </p>

              {/* CTAs */}
              <div className="fs-cta flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-10 lg:mb-12">
                <Link
                  href="/booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#e84118] to-[#c0392b] text-white font-bold px-8 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-[#e84118]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Agendar mi cita
                  <ArrowUpRight weight="duotone" size={18} />
                </Link>
                <a
                  href="#servicios"
                  className="group/services w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white/45 font-medium px-4 py-4 text-base hover:text-white transition-colors"
                >
                  Ver servicios
                  <ChevronDown weight="duotone" size={16} className="group-hover/services:translate-y-0.5 transition-transform" />
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
