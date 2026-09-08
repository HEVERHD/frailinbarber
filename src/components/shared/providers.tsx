"use client"

import { SessionProvider } from "next-auth/react"
import { IconContext } from "@phosphor-icons/react"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IconContext.Provider value={{ weight: "duotone" }}>
        <ToastProvider>{children}</ToastProvider>
      </IconContext.Provider>
    </SessionProvider>
  )
}
