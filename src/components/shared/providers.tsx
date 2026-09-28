"use client"

import { SessionProvider } from "next-auth/react"
import { IconContext } from "@phosphor-icons/react"
import { ToastProvider } from "@/components/ui/toast"
import PwaSplash from "@/components/PwaSplash"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IconContext.Provider value={{ weight: "duotone" }}>
        <PwaSplash />
        <ToastProvider>{children}</ToastProvider>
      </IconContext.Provider>
    </SessionProvider>
  )
}
