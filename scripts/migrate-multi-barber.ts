// Data migration script: assign existing data to the first BARBER (now ADMIN)
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // 1. Find the first BARBER user → make them ADMIN
  const firstBarber = await prisma.user.findFirst({
    where: { role: "BARBER" },
    orderBy: { createdAt: "asc" },
  })

  if (!firstBarber) {
    console.log("No BARBER user found. Nothing to migrate.")
    return
  }

  console.log(`Promoting ${firstBarber.name || firstBarber.email} (${firstBarber.id}) to ADMIN`)

  await prisma.user.update({
    where: { id: firstBarber.id },
    data: { role: "ADMIN" },
  })

  // 2. Link existing BarberSettings to the ADMIN user
  const existingSettings = await prisma.barberSettings.findFirst()
  if (existingSettings) {
    console.log(`Linking BarberSettings (${existingSettings.id}) to ADMIN user`)
    await prisma.barberSettings.update({
      where: { id: existingSettings.id },
      data: { userId: firstBarber.id },
    })
  } else {
    console.log("No BarberSettings found. Creating default for ADMIN user")
    await prisma.barberSettings.create({
      data: {
        shopName: "Frailin Studio",
        openTime: "09:00",
        closeTime: "19:00",
        slotDuration: 30,
        daysOff: "0",
        userId: firstBarber.id,
      },
    })
  }

  // 3. Assign all existing appointments to the ADMIN barber
  const updatedAppointments = await prisma.appointment.updateMany({
    where: { barberId: null },
    data: { barberId: firstBarber.id },
  })
  console.log(`Assigned ${updatedAppointments.count} appointments to ADMIN barber`)

  // 4. Assign all existing blocked slots to the ADMIN barber
  const updatedSlots = await prisma.blockedSlot.updateMany({
    where: { barberId: null },
    data: { barberId: firstBarber.id },
  })
  console.log(`Assigned ${updatedSlots.count} blocked slots to ADMIN barber`)

  console.log("Migration complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
