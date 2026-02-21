import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/shared/providers"
import { PWARegister } from "@/components/shared/pwa-register"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e84118",
}

export const metadata: Metadata = {
  title: "Frailin Studio - Barberia Premium",
  description: "Agenda tu cita en Frailin Studio. Reserva en segundos, sin llamadas, sin esperas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frailin Studio",
  },
  openGraph: {
    title: "Frailin Studio - Barberia Premium",
    description: "Agenda tu cita en Frailin Studio. Reserva en segundos.",
    type: "website",
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
      </body>
    </html>
  )
}
