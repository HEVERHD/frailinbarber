"use client"

import PicoDecorations from "./PicoDecorations"

// Firework burst positions: x%, y%, colors (yellow/blue/red = Colombian flag), delay, repeat duration
const FIREWORKS: Array<{
  x: number; y: number
  colors: string[]
  delay: string
  dur: string
  numParticles: number
  dist: number
}> = [
  { x: 14, y: 22, colors: ["#FCD34D", "#F59E0B", "#FBBF24"], delay: "0s",    dur: "6s",   numParticles: 10, dist: 58 },
  { x: 82, y: 16, colors: ["#3B82F6", "#60A5FA", "#93C5FD"], delay: "1.1s",  dur: "7.5s", numParticles: 10, dist: 62 },
  { x: 48, y: 26, colors: ["#EF4444", "#F87171", "#FCA5A5"], delay: "2.3s",  dur: "5.8s", numParticles: 12, dist: 55 },
  { x: 90, y: 30, colors: ["#FCD34D", "#FBBF24", "#FDE68A"], delay: "3.5s",  dur: "6.5s", numParticles: 10, dist: 60 },
  { x:  7, y: 32, colors: ["#FFFFFF", "#E0E7FF", "#FCD34D"], delay: "4.4s",  dur: "7.0s", numParticles: 8,  dist: 50 },
  { x: 65, y: 18, colors: ["#F59E0B", "#FCD34D", "#FFFFFF"], delay: "5.6s",  dur: "6.2s", numParticles: 10, dist: 58 },
  { x: 33, y: 12, colors: ["#A855F7", "#C084FC", "#FCD34D"], delay: "1.9s",  dur: "8.0s", numParticles: 10, dist: 65 },
]

// Confetti pieces in Colombian flag colors
const CONFETTI: Array<{ left: string; color: string; w: number; h: number; dur: string; delay: string; rot: string }> = [
  { left: "4%",  color: "#FCD34D", w: 8, h: 4, dur: "4.1s",  delay: "0s",    rot: "360deg" },
  { left: "11%", color: "#2563EB", w: 6, h: 3, dur: "3.6s",  delay: "0.5s",  rot: "480deg" },
  { left: "18%", color: "#EF4444", w: 9, h: 4, dur: "5.0s",  delay: "1.1s",  rot: "540deg" },
  { left: "26%", color: "#FCD34D", w: 5, h: 3, dur: "3.8s",  delay: "0.3s",  rot: "300deg" },
  { left: "33%", color: "#1D4ED8", w: 7, h: 4, dur: "4.5s",  delay: "1.6s",  rot: "420deg" },
  { left: "41%", color: "#DC2626", w: 8, h: 3, dur: "3.3s",  delay: "0.8s",  rot: "360deg" },
  { left: "49%", color: "#FBBF24", w: 6, h: 4, dur: "4.8s",  delay: "2.1s",  rot: "540deg" },
  { left: "57%", color: "#FFFFFF", w: 5, h: 3, dur: "3.6s",  delay: "0.4s",  rot: "480deg" },
  { left: "64%", color: "#3B82F6", w: 8, h: 3, dur: "4.3s",  delay: "1.3s",  rot: "360deg" },
  { left: "71%", color: "#EF4444", w: 7, h: 4, dur: "3.9s",  delay: "0.7s",  rot: "420deg" },
  { left: "79%", color: "#FCD34D", w: 6, h: 3, dur: "4.6s",  delay: "1.9s",  rot: "300deg" },
  { left: "87%", color: "#2563EB", w: 9, h: 4, dur: "3.4s",  delay: "0.2s",  rot: "540deg" },
  { left: "94%", color: "#DC2626", w: 5, h: 3, dur: "5.2s",  delay: "2.6s",  rot: "480deg" },
  { left: "8%",  color: "#FBBF24", w: 7, h: 3, dur: "4.0s",  delay: "3.0s",  rot: "360deg" },
  { left: "23%", color: "#1D4ED8", w: 6, h: 4, dur: "3.7s",  delay: "2.2s",  rot: "420deg" },
  { left: "55%", color: "#EF4444", w: 8, h: 3, dur: "4.4s",  delay: "1.4s",  rot: "540deg" },
  { left: "75%", color: "#FCD34D", w: 5, h: 4, dur: "3.3s",  delay: "0.9s",  rot: "300deg" },
  { left: "92%", color: "#3B82F6", w: 7, h: 3, dur: "5.0s",  delay: "1.7s",  rot: "480deg" },
]

// Generate burst particle positions deterministically
function getParticles(numParticles: number, dist: number) {
  return Array.from({ length: numParticles }, (_, i) => {
    const angle = (i / numParticles) * Math.PI * 2
    const d = dist + (i % 3) * 10
    return { tx: Math.cos(angle) * d, ty: Math.sin(angle) * d }
  })
}

export default function FiestasCartagenaDecorations() {
  return (
    <>
      <style>{`
        @keyframes fc-fw-burst {
          0%, 84%, 100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          2% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          28% {
            transform: translate(var(--fc-tx, 50px), var(--fc-ty, -50px)) scale(0.25);
            opacity: 0;
          }
        }
        @keyframes fc-fw-trail {
          0%, 83%, 100% { opacity: 0; transform: scale(0); }
          2%  { opacity: 0.9; transform: scale(1); }
          15% { opacity: 0.5; transform: scale(0.6); }
          28% { opacity: 0;   transform: scale(0.1); }
        }
        @keyframes fc-confetti-fall {
          0%   { transform: translateY(-30px) rotate(0deg);    opacity: 1; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(100vh) rotate(var(--fc-rot, 360deg)); opacity: 0; }
        }
      `}</style>

      {/* Fixed decoration layer — behind nav but above the page background */}
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">

        {/* ── Firework bursts ── */}
        {FIREWORKS.map((fw, fi) => {
          const particles = getParticles(fw.numParticles, fw.dist)
          return (
            <div
              key={fi}
              className="absolute"
              style={{ left: fw.x + "%", top: fw.y + "%" }}
            >
              {/* Central flash */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 8, height: 8,
                  marginLeft: -4, marginTop: -4,
                  background: fw.colors[0],
                  boxShadow: `0 0 10px 4px ${fw.colors[0]}`,
                  animation: `fc-fw-trail ${fw.dur} ${fw.delay} ease-out infinite`,
                }}
              />
              {/* Radiating particles */}
              {particles.map((p, pi) => (
                <div
                  key={pi}
                  className="absolute rounded-full"
                  style={{
                    width: 3 + (pi % 2),
                    height: 3 + (pi % 2),
                    marginLeft: -(1.5 + (pi % 2) / 2),
                    marginTop:  -(1.5 + (pi % 2) / 2),
                    background: fw.colors[pi % fw.colors.length],
                    filter: `drop-shadow(0 0 3px ${fw.colors[pi % fw.colors.length]})`,
                    // CSS custom props for animation translation
                    ["--fc-tx" as string]: p.tx + "px",
                    ["--fc-ty" as string]: p.ty + "px",
                    animation: `fc-fw-burst ${fw.dur} ${fw.delay} ease-out infinite`,
                    animationDelay: `calc(${fw.delay} + ${pi * 0.025}s)`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )
        })}

        {/* ── Falling confetti ── */}
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: c.left,
              top: "-20px",
              width: c.w,
              height: c.h,
              background: c.color,
              borderRadius: 1,
              ["--fc-rot" as string]: c.rot,
              animation: `fc-confetti-fall ${c.dur} ${c.delay} linear infinite`,
              opacity: 0.85,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Pico sound systems + cadenetas ── */}
      <PicoDecorations />
    </>
  )
}
