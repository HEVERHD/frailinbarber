import Link from "next/link"

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">¡Cita Agendada!</h1>
        <p className="text-gray-500 mb-6">
          Recibirás una confirmación por WhatsApp y un recordatorio 1 hora antes de tu cita.
        </p>
        <Link
          href="/booking"
          className="inline-block bg-[#c9a96e] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#b8944f] transition"
        >
          Agendar otra cita
        </Link>
        <br />
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
