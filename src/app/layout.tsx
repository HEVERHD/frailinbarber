import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/shared/providers"
import { PWARegister } from "@/components/shared/pwa-register"
import NoiseOverlay from "@/components/NoiseOverlay"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e84118",
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://barberia-demo-eta.vercel.app"

export const metadata: Metadata = {
  title: "Mi Barbería — Agenda tu cita online",
  description: "Agenda tu cita en segundos, confirmación instantánea por WhatsApp. Sin llamadas, sin esperas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mi Barbería",
  },
  openGraph: {
    title: "Mi Barbería — Tu look habla antes que tú.",
    description: "Agenda tu cita en segundos, sin llamadas, sin esperas.",
    url: BASE_URL,
    siteName: "Mi Barbería",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/logo2.png`,
        width: 512,
        height: 512,
        alt: "Mi Barbería — Agenda tu cita online",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Mi Barbería — Tu look habla antes que tú.",
    description: "Agenda tu cita en segundos, sin llamadas, sin esperas.",
    images: [`${BASE_URL}/logo2.png`],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <PWARegister />
        <NoiseOverlay />
      </body>
    </html>
  )
}
