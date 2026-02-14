import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create default barber settings
  const settings = await prisma.barberSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "Mi Barbería",
      openTime: "09:00",
      closeTime: "19:00",
      slotDuration: 30,
      daysOff: "0",
    },
  })
  console.log("Settings created:", settings.shopName)

  // Create default services
  const services = [
    { name: "Corte Clásico", description: "Corte de cabello tradicional", price: 150, duration: 30 },
    { name: "Corte + Barba", description: "Corte de cabello y arreglo de barba", price: 250, duration: 45 },
    { name: "Barba", description: "Arreglo y perfilado de barba", price: 100, duration: 20 },
    { name: "Corte Degradado", description: "Fade / degradado con máquina", price: 180, duration: 40 },
    { name: "Tratamiento Capilar", description: "Lavado, masaje y tratamiento", price: 200, duration: 30 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: service.name.toLowerCase().replace(/\s+/g, "-"),
        ...service,
      },
    })
  }
  console.log("Services created:", services.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
