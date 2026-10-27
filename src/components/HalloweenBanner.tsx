"use client"

export default function HalloweenBanner() {
  return (
    <>
      <style>{`
        @keyframes hw-flicker {
          0%, 91%, 100% { opacity: 1; }
          92%  { opacity: 0.45; }
          93%  { opacity: 1; }
          95%  { opacity: 0.25; }
          96%  { opacity: 0.9; }
        }
        @keyframes hw-bat-wing {
          0%, 100% { transform: rotate(-9deg) translateY(0px); }
          50%       { transform: rotate(9deg) translateY(-3px); }
        }
        @keyframes hw-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .hw-banner-text { animation: hw-flicker 6s ease-in-out infinite; }
        .hw-wing-l      { animation: hw-bat-wing 1.3s ease-in-out infinite; display: inline-block; }
        .hw-wing-r      { animation: hw-bat-wing 1.3s ease-in-out 0.65s infinite; display: inline-block; }
      `}</style>

      <div
        className="fixed top-0 left-0 right-0 z-[300] h-8 flex items-center justify-center overflow-hidden select-none"
        style={{
          background:
            "linear-gradient(90deg, #0a0018 0%, #180040 20%, #2d0066 50%, #180040 80%, #0a0018 100%)",
          borderBottom: "1px solid rgba(139,92,246,0.25)",
        }}
      >
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(167,139,250,0.08) 50%, transparent 60%)",
            animation: "hw-shimmer 4s linear infinite",
            width: "40%",
          }}
        />

        <p className="hw-banner-text relative text-[11px] font-black tracking-[0.16em] text-white/85 flex items-center gap-2.5 whitespace-nowrap">
          <span className="hw-wing-l">🦇</span>
          <span style={{ color: "#fb923c" }}>FELIZ HALLOWEEN</span>
          <span className="text-purple-400/50">·</span>
          <span className="text-white/55">31 de Octubre</span>
          <span className="text-purple-400/50">·</span>
          <span style={{ color: "#c4b5fd" }}>¡El look más terrorífico te espera!</span>
          <span className="hw-wing-r">🦇</span>
        </p>
      </div>
    </>
  )
}
