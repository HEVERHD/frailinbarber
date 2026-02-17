import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const barbers = await prisma.user.findMany({
    where: { role: { in: ["BARBER", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      image: true,
      avatarUrl: true,
      specialty: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(barbers)
}
