import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const DEMO_PASSWORD = "barberia2024"

const ADMINS = [
  { email: "hever11.hdgd@gmail.com", name: "Hever" },
  { email: "arnulfoadg@gmail.com",   name: "Arnulfo" },
]

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10)

  // 1. Crear los dos usuarios admin con contraseña
  for (const admin of ADMINS) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { role: "ADMIN", password: hashedPassword },
      create: { name: admin.name, email: admin.email, role: "ADMIN", password: hashedPassword },
    })
    console.log("Admin creado:", admin.email)
  }

  // 2. Configuración de barberSettings para ambos admins
  for (const admin of ADMINS) {
    const user = await prisma.user.findUnique({ where: { email: admin.email } })
    if (!user) continue
    await prisma.barberSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        shopName: "StyleCut Barbería",
        openTime: "09:00",
        closeTime: "19:00",
        slotDuration: 30,
        daysOff: "0",
        userId: user.id,
      },
    })
    console.log("Configuración creada para:", admin.email)
  }

  // 3. Servicios (precios en USD)
  const services = [
    { id: "corte-clasico",       name: "Corte Clásico",       description: "Corte de cabello tradicional con tijera y máquina", price: 15, duration: 30 },
    { id: "corte-degradado",     name: "Corte Degradado",     description: "Fade y degradado profesional con máquina",           price: 18, duration: 40 },
    { id: "corte-barba",         name: "Corte + Barba",       description: "Corte de cabello más arreglo y perfilado de barba",  price: 25, duration: 50 },
    { id: "arreglo-barba",       name: "Arreglo de Barba",    description: "Perfilado y arreglo profesional de barba",           price: 10, duration: 20 },
    { id: "tratamiento-capilar", name: "Tratamiento Capilar", description: "Lavado, masaje capilar y tratamiento hidratante",    price: 20, duration: 35 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { price: service.price, name: service.name, description: service.description, duration: service.duration },
      create: service,
    })
  }
  console.log("Servicios creados:", services.length)
  console.log("\n✅ Demo listo")
  console.log(`   Login email/contraseña: cualquier admin + "${DEMO_PASSWORD}"`)
  console.log("   Login Google: cualquiera de los dos emails")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
