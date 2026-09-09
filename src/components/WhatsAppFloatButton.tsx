import Link from "next/link"
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr"

interface WhatsAppFloatButtonProps {
  phone?: string | null
}

// Fallback: the barber's number, always active — used only if no phone is configured yet
const DEFAULT_PHONE = "+573023377353"

export default function WhatsAppFloatButton({ phone }: WhatsAppFloatButtonProps) {
  const digits = (phone || DEFAULT_PHONE).replace(/\D/g, "")

  return (
    <Link
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed z-40 bottom-24 right-5 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-2xl shadow-black/40 hover:scale-105 active:scale-95 transition-transform"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping pointer-events-none" />
      <WhatsappLogo weight="fill" size={30} className="relative text-white" />
    </Link>
  )
}
