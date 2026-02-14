import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-[#c9a96e]">Barber</span>App
          </h1>
          <Link
            href="/login"
            className="text-sm text-white/80 hover:text-white transition"
          >
            Acceso Barbero
          </Link>
        </nav>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 md:py-36">
          <div className="text-6xl mb-6">💈</div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Tu estilo, tu <span className="text-[#c9a96e]">tiempo</span>
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Agenda tu cita en segundos. Sin llamadas, sin esperas.
          </p>
          <Link
            href="/booking"
            className="bg-[#c9a96e] text-[#1a1a2e] font-semibold px-8 py-4 rounded-lg text-lg hover:bg-[#b8944f] transition shadow-lg"
          >
            Agendar Cita
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">
          ¿Por qué <span className="text-[#c9a96e]">elegirnos</span>?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📅",
              title: "Reserva Online",
              desc: "Elige tu servicio, fecha y hora desde tu celular",
            },
            {
              icon: "📲",
              title: "Recordatorio WhatsApp",
              desc: "Te avisamos 1 hora antes para que no olvides tu cita",
            },
            {
              icon: "⏱️",
              title: "Sin Esperas",
              desc: "Llega a tu hora y pasa directo al sillón",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-xl border border-[var(--border)] hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
              <p className="text-[var(--muted-foreground)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a1a2e] py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para un nuevo look?
          </h3>
          <p className="text-white/60 mb-8">
            Agenda tu cita ahora y recibe confirmación al instante por WhatsApp
          </p>
          <Link
            href="/booking"
            className="inline-block bg-[#c9a96e] text-[#1a1a2e] font-semibold px-8 py-4 rounded-lg text-lg hover:bg-[#b8944f] transition"
          >
            Agendar Ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-[var(--muted-foreground)]">
        <p>© 2026 BarberApp. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
