import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Public endpoint — returns only names (no phone, no email) for booking autocomplete
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") || ""

  if (search.length < 1) {
    return NextResponse.json([])
  }

  const results = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      name: { contains: search, mode: "insensitive" },
    },
    select: { name: true },
    take: 6,
  })

  return NextResponse.json(results.map((r) => r.name).filter(Boolean))
}
