"use client"

interface NavidadDecorationsProps {
  // anoNuevo = 1–6 de enero: luces doradas y destellos en vez de solo nieve
  newYear?: boolean
}

// String of lights: the wire hangs in scallops between hooks, 4 bulbs per scallop
const SEGMENTS = 7
const BULBS_PER_SEGMENT = 4
const SAG = 10 // px the wire drops at the middle of each scallop

const XMAS_COLORS = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#f8fafc"]
const NEW_YEAR_COLORS = ["#facc15", "#fde68a", "#f8fafc", "#fbbf24"]

function getBulbs() {
  const bulbs: Array<{ x: number; y: number; delay: string }> = []
  for (let s = 0; s < SEGMENTS; s++) {
    for (let b = 0; b < BULBS_PER_SEGMENT; b++) {
      const t = (b + 0.5) / BULBS_PER_SEGMENT
      bulbs.push({
        x: ((s + t) / SEGMENTS) * 100,
        // Quadratic Bézier with the control point at 2·SAG → peak drop of SAG
        y: 2 + 4 * SAG * t * (1 - t),
        delay: `${(bulbs.length % 3) * 0.6}s`,
      })
    }
  }
  return bulbs
}

function getWirePath() {
  const w = 100 / SEGMENTS
  let d = "M 0 2"
  for (let s = 0; s < SEGMENTS; s++) {
    d += ` Q ${s * w + w / 2} ${2 + 2 * SAG} ${(s + 1) * w} 2`
  }
  return d
}

const BULBS = getBulbs()
const WIRE_PATH = getWirePath()

// Snowflakes: deterministic so server and client render the same markup
const FLAKES = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 2 + (i % 4),
  glyph: i % 6 === 0,
  dur: `${9 + (i % 7) * 1.5}s`,
  // Negative delay: it's already snowing when the page loads
  delay: `-${(i * 1.7) % 14}s`,
  sway: `${4 + (i % 3) * 2}s`,
  opacity: 0.35 + (i % 5) * 0.12,
}))

export default function NavidadDecorations({ newYear = false }: NavidadDecorationsProps) {
  const bulbColors = newYear ? NEW_YEAR_COLORS : XMAS_COLORS

  return (
    <>
      <style>{`
        @keyframes nv-bulb-glow {
          0%, 100% { opacity: 1;    filter: brightness(1.15); }
          50%      { opacity: 0.35; filter: brightness(0.6); }
        }
        @keyframes nv-snow-fall {
          0%   { transform: translateY(-20px); }
          100% { transform: translateY(105vh); }
        }
        @keyframes nv-snow-sway {
          0%, 100% { transform: translateX(-10px); }
          50%      { transform: translateX(10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nv-flake { display: none; }
          .nv-bulb  { animation: none !important; }
        }
      `}</style>

      {/* ── Luces navideñas colgando bajo el banner ── */}
      <div
        className="fixed left-0 right-0 z-[63] pointer-events-none"
        style={{ top: 32, height: SAG + 22 }}
      >
        <svg
          className="absolute inset-x-0 top-0 w-full"
          height={SAG + 6}
          viewBox={`0 0 100 ${SAG + 6}`}
          preserveAspectRatio="none"
        >
          <path d={WIRE_PATH} fill="none" stroke="#14532d" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        </svg>
        {BULBS.map((b, i) => {
          const color = bulbColors[i % bulbColors.length]
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: `${b.x}%`, top: b.y, transform: "translateX(-50%)" }}
            >
              {/* Socket */}
              <div className="w-[4px] h-[3px] rounded-[1px] bg-[#3f3f46]" />
              {/* Bulb */}
              <div
                className="nv-bulb w-[6px] h-[10px] sm:w-[7px] sm:h-[11px]"
                style={{
                  borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                  background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 45%, ${color} 100%)`,
                  boxShadow: `0 0 6px 2px ${color}99, 0 0 14px 4px ${color}44`,
                  animation: `nv-bulb-glow 1.8s ${b.delay} ease-in-out infinite`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ── Nieve (y destellos dorados en año nuevo) ── */}
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">
        {FLAKES.map((f, i) => {
          const gold = newYear && i % 3 === 0
          return (
            <div
              key={i}
              className="nv-flake absolute"
              style={{ left: f.left, top: -20, animation: `nv-snow-fall ${f.dur} ${f.delay} linear infinite` }}
            >
              <div style={{ animation: `nv-snow-sway ${f.sway} ease-in-out infinite` }}>
                {f.glyph && !gold ? (
                  <span style={{ fontSize: 10 + f.size * 2, color: "#fff", opacity: f.opacity, textShadow: "0 0 6px rgba(255,255,255,0.6)" }}>
                    ❄
                  </span>
                ) : (
                  <div
                    className="rounded-full"
                    style={{
                      width: f.size,
                      height: f.size,
                      opacity: gold ? 0.9 : f.opacity,
                      background: gold ? "#facc15" : "#fff",
                      boxShadow: gold ? "0 0 6px #f59e0b" : "0 0 4px rgba(255,255,255,0.7)",
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
