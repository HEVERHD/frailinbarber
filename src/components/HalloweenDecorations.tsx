"use client"

const BATS = [
  { top: "11%", left: "3%",  size: 17, delay: "0s",   dur: "13s" },
  { top: "7%",  left: "29%", size: 13, delay: "2.8s", dur: "18s" },
  { top: "19%", left: "63%", size: 19, delay: "5.5s", dur: "11s" },
  { top: "6%",  left: "81%", size: 15, delay: "1.2s", dur: "15s" },
  { top: "15%", left: "47%", size: 12, delay: "4.2s", dur: "14s" },
  { top: "23%", left: "91%", size: 14, delay: "7s",   dur: "12s" },
]

export default function HalloweenDecorations() {
  return (
    <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes hw-bat-drift {
          0%, 100% { transform: translate(0px,   0px)  rotate(-8deg); opacity: 0.45; }
          20%       { transform: translate(15px, -10px) rotate(2deg);  opacity: 0.65; }
          40%       { transform: translate(24px,  5px)  rotate(-5deg); opacity: 0.5;  }
          60%       { transform: translate(9px,  11px)  rotate(7deg);  opacity: 0.55; }
          80%       { transform: translate(-11px, -5px) rotate(-3deg); opacity: 0.45; }
        }
        @keyframes hw-ghost-float {
          0%, 100% { transform: translateY(0px)   scale(1);    opacity: 0.18; }
          50%       { transform: translateY(-16px) scale(1.04); opacity: 0.28; }
        }
        @keyframes hw-spider-drop {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(12px); }
        }
      `}</style>

      {/* Floating bats */}
      {BATS.map((b, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            top: b.top,
            left: b.left,
            fontSize: b.size,
            animation: `hw-bat-drift ${b.dur} ${b.delay} ease-in-out infinite`,
            filter: "drop-shadow(0 0 5px rgba(139,92,246,0.55))",
          }}
        >
          🦇
        </span>
      ))}

      {/* Ghosts — faint right side */}
      <span
        className="absolute select-none"
        style={{
          top: "38%", right: "2.5%",
          fontSize: 30,
          animation: "hw-ghost-float 5.5s ease-in-out infinite",
          filter: "drop-shadow(0 0 10px rgba(255,255,255,0.12))",
        }}
      >
        👻
      </span>
      <span
        className="absolute select-none"
        style={{
          top: "65%", left: "1.5%",
          fontSize: 22,
          animation: "hw-ghost-float 4.5s 1.5s ease-in-out infinite",
          filter: "drop-shadow(0 0 8px rgba(255,255,255,0.08))",
        }}
      >
        👻
      </span>

      {/* Spiderweb — top-right corner (appears below banner) */}
      <svg
        viewBox="0 0 180 180"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute right-0 w-40 h-40 opacity-[0.11]"
        style={{ top: "32px" }}
        aria-hidden="true"
      >
        {/* Spokes radiating from top-right corner (180, 0) */}
        <g stroke="white" strokeWidth="0.6">
          <line x1="180" y1="0" x2="0"   y2="0" />
          <line x1="180" y1="0" x2="180" y2="180" />
          <line x1="180" y1="0" x2="0"   y2="180" />
          <line x1="180" y1="0" x2="55"  y2="180" />
          <line x1="180" y1="0" x2="0"   y2="58" />
          <line x1="180" y1="0" x2="115" y2="180" />
          <line x1="180" y1="0" x2="0"   y2="118" />
        </g>
        {/* Silk rings */}
        <polyline
          points="135,0 156,24 168,50 160,76 140,95 110,104 80,98 56,80 43,56"
          fill="none" stroke="white" strokeWidth="0.55"
        />
        <polyline
          points="90,0 138,42 163,92 146,134 108,158 66,166 30,152 7,118 0,80"
          fill="none" stroke="white" strokeWidth="0.45"
        />
        <polyline
          points="44,0 118,58 162,144 126,178 74,180 24,170 0,138"
          fill="none" stroke="white" strokeWidth="0.35"
        />
      </svg>

      {/* Spider dropping from web */}
      <span
        className="absolute select-none"
        style={{
          top: "calc(32px + 136px)",
          right: "16px",
          fontSize: 14,
          animation: "hw-spider-drop 3s ease-in-out infinite",
          opacity: 0.35,
          filter: "drop-shadow(0 0 4px rgba(139,92,246,0.4))",
        }}
      >
        🕷️
      </span>
    </div>
  )
}
