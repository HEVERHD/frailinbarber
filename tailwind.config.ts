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
    },
  },
  plugins: [],
}

export default config
