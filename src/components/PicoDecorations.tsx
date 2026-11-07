"use client"

const BEAT = 0.55 // seconds per bass beat (~109 BPM champeta/salsa)

const KEYFRAMES = `
  @keyframes pico-bass-a {
    0%,100% { transform: scale(1);    box-shadow: 0 0 6px 3px rgba(255,140,0,.5); }
    50%      { transform: scale(1.14); box-shadow: 0 0 18px 7px rgba(255,70,0,.85); }
  }
  @keyframes pico-bass-b {
    0%,100% { transform: scale(1);    box-shadow: 0 0 8px 3px rgba(0,80,200,.5); }
    50%      { transform: scale(1.12); box-shadow: 0 0 20px 8px rgba(0,120,255,.8); }
  }
  @keyframes pico-shake {
    0%,100% { transform: translateX(0px)   rotate(0deg); }
    20%     { transform: translateX(-1.5px) rotate(-.25deg); }
    40%     { transform: translateX(1.5px)  rotate(.25deg); }
    70%     { transform: translateX(-1px)   rotate(-.15deg); }
    90%     { transform: translateX(1px)    rotate(.15deg); }
  }
  @keyframes pico-led {
    0%   { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  @keyframes pico-glow-panel {
    0%,100% { opacity:.35; }
    50%     { opacity:.9; }
  }
  @keyframes pico-cadeneta-hue {
    0%   { filter: hue-rotate(0deg)   brightness(1); }
    50%  { filter: hue-rotate(200deg) brightness(1.4); }
    100% { filter: hue-rotate(360deg) brightness(1); }
  }
  @keyframes pico-led-glow {
    0%,100% { text-shadow: 0 0 4px #FFD100, 0 0 8px #FF8C00; }
    50%     { text-shadow: 0 0 8px #FFD100, 0 0 20px #FF5500, 0 0 30px #FF2200; }
  }
`

// Colombian flag + carnival palette for cadenetas
const CADENETA_COLORS = [
  "#FFD100", "#CE1126", "#003087",
  "#FF6B35", "#FF69B4", "#00C49F",
  "#FFD100", "#CE1126", "#003087",
]

function Cadenetas() {
  const count = 52
  return (
    <div
      className="fixed left-0 right-0 z-[63] pointer-events-none flex items-start overflow-hidden"
      style={{ top: 32, height: 30 }}
    >
      {Array.from({ length: count }, (_, i) => {
        const color = CADENETA_COLORS[i % CADENETA_COLORS.length]
        const down = i % 2 === 0
        return (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              ...(down
                ? { borderTop: `24px solid ${color}`, marginTop: 0 }
                : { borderBottom: `24px solid ${color}`, marginTop: "auto" }),
              animation: `pico-cadeneta-hue ${2.4 + (i % 5) * 0.35}s linear infinite`,
              animationDelay: `${(i * 0.09) % 1.6}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// Gradient stripe pattern for decorative box faces
const DECO_A = "repeating-linear-gradient(45deg,#FFD100 0,#FFD100 5px,#CE1126 5px,#CE1126 10px,#003087 10px,#003087 15px)"
const DECO_B = "repeating-linear-gradient(-45deg,#003087 0,#003087 4px,#FFD100 4px,#FFD100 8px,#CE1126 8px,#CE1126 12px)"
const DECO_C = "repeating-linear-gradient(90deg,#CE1126 0,#CE1126 5px,#003087 5px,#003087 10px,#FFD100 10px,#FFD100 15px)"

function Speaker({
  delay = 0,
  variant = "a",
  size = "auto",
}: { delay?: number; variant?: "a" | "b"; size?: string }) {
  const anim = variant === "a" ? "pico-bass-a" : "pico-bass-b"
  return (
    <div
      style={{
        borderRadius: "50%",
        width: size === "auto" ? "100%" : size,
        aspectRatio: "1 / 1",
        background:
          "radial-gradient(circle at 32% 32%, #888 0%, #3a3a3a 25%, #111 55%, #000 100%)",
        boxShadow:
          variant === "a"
            ? "0 0 8px 3px rgba(255,120,0,.5), inset 0 0 6px rgba(0,0,0,.7)"
            : "0 0 8px 3px rgba(0,100,220,.5), inset 0 0 6px rgba(0,0,0,.7)",
        animation: `${anim} ${BEAT}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Dust cap */}
      <div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #666 0%, #333 100%)",
        }}
      />
    </div>
  )
}

function LedStrip({ text }: { text: string }) {
  const doubled = `${text}${text}`
  return (
    <div
      style={{
        background: "#060606",
        borderTop: "1.5px solid #FFD10066",
        borderBottom: "1.5px solid #FFD10066",
        height: 15,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontSize: 6,
          fontWeight: 900,
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          color: "#FFD100",
          paddingLeft: 4,
          animation: `pico-led 7s linear infinite, pico-led-glow ${BEAT * 2}s ease-in-out infinite`,
        }}
      >
        {doubled}
      </span>
    </div>
  )
}

function PicoTower({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left"
  const shakeDelay = isLeft ? "0s" : `${BEAT / 2}s`

  return (
    <div
      className={`fixed bottom-0 ${isLeft ? "left-0" : "right-0"} z-[62] pointer-events-none`}
      style={{
        top: 62,
        width: "clamp(26px, 7vw, 48px)",
        animation: `pico-shake ${BEAT * 1.1}s ease-in-out infinite`,
        animationDelay: shakeDelay,
      }}
    >
      <div className="flex flex-col h-full" style={{ gap: 1 }}>

        {/* ── Top deco box ── */}
        <div style={{ height: 28, flexShrink: 0, background: DECO_A, border: "1px solid #2a2a2a" }} />

        {/* ── Tweeter box ── */}
        <div style={{ background: "#111", padding: 3, border: "1px solid #333", flexShrink: 0, position: "relative" }}>
          <Speaker delay={0} variant="a" />
        </div>

        {/* ── LED strip 1 ── */}
        <LedStrip text="· EL IMPERIO DE FRAILIN STUDIO · FRAILIN EN LA CABINA · SABOR DEL BARRIO · " />

        {/* ── Deco strip ── */}
        <div style={{ height: 16, flexShrink: 0, background: DECO_B, border: "1px solid #222" }} />

        {/* ── Mid speaker ── */}
        <div style={{ background: "#0d0d0d", padding: 4, border: "1px solid #3a3a3a", flexShrink: 0 }}>
          <Speaker delay={BEAT / 3} variant="b" />
        </div>

        {/* ── LED strip 2 ── */}
        <LedStrip text="· FRAILIN STUDIO · CARTAGENA DE INDIAS · FIESTAS DE INDEPENDENCIA · " />

        {/* ── Deco strip ── */}
        <div style={{ height: 12, flexShrink: 0, background: DECO_C, border: "1px solid #222" }} />

        {/* ── Woofer (main, takes remaining height) ── */}
        <div
          style={{
            background: "#0a0a0a",
            padding: 5,
            border: "1.5px solid #444",
            flex: 1,
            minHeight: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Speaker delay={BEAT / 6} variant="a" />
        </div>

        {/* ── Art base panel ── */}
        <div
          style={{
            height: 42,
            flexShrink: 0,
            background:
              "linear-gradient(155deg, #FF6B35 0%, #FFD100 18%, #CE1126 36%, #003087 54%, #00C49F 72%, #FF6B35 90%)",
            border: "1px solid #333",
            borderRadius: "0 0 2px 2px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.25) 50%, transparent 100%)",
              animation: `pico-glow-panel ${BEAT * 2}s ease-in-out infinite`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function PicoDecorations() {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <Cadenetas />
      <PicoTower side="left" />
      <PicoTower side="right" />
    </>
  )
}
