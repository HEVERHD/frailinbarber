import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getColombiaDateStr, parseColombia } from "@/lib/utils"
import { countBookableSlots } from "@/lib/availability"
import { isSeason } from "@/lib/season-shared"

export const dynamic = "force-dynamic"

// Public: theme forced from settings + remaining "cupos" on Dec 24 and 31.
// No personal data — only counts. Cached briefly at the edge to absorb traffic.
export async function GET() {
  const now = new Date()
  const today = getColombiaDateStr(now)
  const year = today.slice(0, 4)
  const hotDates = [`${year}-12-24`, `${year}-12-31`].filter((d) => d >= today)

  // Same shop-level record the public pages use for shop info
  const shopSettings =
    (await prisma.barberSettings.findFirst({ where: { user: { role: "BARBER" } } })) ??
    (await prisma.barberSettings.findFirst({ where: { user: { role: "ADMIN" } } })) ??
    (await prisma.barberSettings.findFirst())
  const override = isSeason(shopSettings?.seasonOverride) ? shopSettings!.seasonOverride : null

  // Cupos only matter in Nov–Dec (Navidad season), while those dates are still ahead
  let cupos: Record<string, number> | null = null
  if (["11", "12"].includes(today.slice(5, 7)) && hotDates.length > 0) {
    const rangeStart = parseColombia(hotDates[0] + "T00:00:00")
    const rangeEnd = parseColombia(hotDates[hotDates.length - 1] + "T23:59:59")

    const barbers = await prisma.user.findMany({
      where: { role: "BARBER", barberSettings: { isNot: null } },
      select: {
        barberSettings: true,
        barberAppointments: {
          where: { date: { gte: rangeStart, lte: rangeEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
          select: { date: true, service: { select: { duration: true } } },
        },
        blockedSlots: { where: { date: { in: hotDates } } },
        recurringBlocks: true,
      },
    })

    cupos = {}
    for (const date of hotDates) {
      cupos[date] = barbers.reduce((sum, b) => {
        const s = b.barberSettings!
        return sum + countBookableSlots(date, s.slotDuration, s, b.barberAppointments, b.blockedSlots, b.recurringBlocks, now)
      }, 0)
    }
  }

  return NextResponse.json(
    { override, cupos },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  )
}
