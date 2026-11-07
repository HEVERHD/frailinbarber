"use client"

export default function FiestasCartagenaBanner() {
  return (
    <>
      <style>{`
        @keyframes fc-banner-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes fc-banner-bounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-3px); }
        }
        @keyframes fc-banner-flag {
          0%, 100% { transform: rotate(-4deg) scale(1); }
          50%       { transform: rotate(4deg) scale(1.1); }
        }
        .fc-banner-gold {
          background: linear-gradient(90deg,
            #c8860a, #f5c842, #ffe899, #f5c842,
            #ffffff, #f5c842, #3b82f6, #f5c842, #c8860a);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fc-banner-shimmer 5s linear infinite;
        }
        .fc-bb1 { animation: fc-banner-bounce 1.4s ease-in-out infinite; display: inline-block; }
        .fc-bb2 { animation: fc-banner-bounce 1.4s ease-in-out 0.7s infinite; display: inline-block; }
        .fc-flag { animation: fc-banner-flag 2s ease-in-out infinite; display: inline-block; }
      `}</style>

      <div
        className="fixed top-0 left-0 right-0 z-[300] h-8 flex items-center justify-center overflow-hidden select-none"
        style={{
          background:
            "linear-gradient(90deg, #150800 0%, #3a1c00 20%, #7c4700 50%, #3a1c00 80%, #150800 100%)",
          borderBottom: "1px solid rgba(245,200,66,0.3)",
        }}
      >
        {/* Gold shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(245,200,66,0.14) 50%, transparent 65%)",
            backgroundSize: "300% 100%",
            animation: "fc-banner-shimmer 3.5s linear infinite",
          }}
        />
        <p className="relative text-[11px] font-black tracking-[0.13em] flex items-center gap-2 whitespace-nowrap">
          <span className="fc-bb1">🎊</span>
          <span className="fc-banner-gold">
            11 DE NOVIEMBRE · INDEPENDENCIA DE CARTAGENA DE INDIAS
          </span>
          <span className="fc-flag">🇨🇴</span>
          <span style={{ color: "#f5c842", opacity: 0.85 }}>¡Viva Cartagena!</span>
          <span className="fc-bb2">🎆</span>
        </p>
      </div>
    </>
  )
}
