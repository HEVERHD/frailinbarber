"use client"

export default function DefaultBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[300] h-8 flex items-center justify-center overflow-hidden select-none"
      style={{
        background: "linear-gradient(90deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <p className="text-[11px] text-white/35 font-medium tracking-[0.18em] flex items-center gap-3">
        <span className="text-[#e84118]">⚡</span>
        Agenda online
        <span className="text-white/15">·</span>
        Sin esperas
        <span className="text-white/15">·</span>
        Confirmación instantánea por WhatsApp
        <span className="text-[#e84118]">⚡</span>
      </p>
    </div>
  )
}
