import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#e84118",
        "accent-hover": "#c0392b",
        "accent-warm": "#f0932b",
        dark: "#1a0a0a",
        "dark-card": "#2d1515",
        "dark-border": "#3d2020",
        "dark-deep": "#120505",
      },
      // Tailwind 3 only ships opacity steps of 5 — without these, classes like
      // bg-white/8 or bg-[#000a1a]/78 used across the app are silently dropped
      opacity: {
        2: "0.02",
        3: "0.03",
        4: "0.04",
        6: "0.06",
        8: "0.08",
        12: "0.12",
        18: "0.18",
        78: "0.78",
        96: "0.96",
      },
    },
  },
  plugins: [],
}

export default config
