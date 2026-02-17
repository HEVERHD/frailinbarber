import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadImage, deleteImage } from "@/lib/cloudinary"

export const dynamic = "force-dynamic"

export async function GET() {
  const items = await prisma.galleryItem.findMany({
    where: { active: true },
    orderBy: { orderIndex: "asc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { image, title, description, category } = body

  if (!image) {
    return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })
  }

  const { url, publicId } = await uploadImage(image)

  const maxOrder = await prisma.galleryItem.aggregate({ _max: { orderIndex: true } })
  const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1

  const item = await prisma.galleryItem.create({
    data: {
      imageUrl: url,
      title: title || null,
      description: description || null,
      category: category || "corte",
      orderIndex: nextOrder,
    },
  })

  return NextResponse.json(item, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })
  }

  const item = await prisma.galleryItem.update({
    where: { id },
    data,
  })

  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })
  }

  const item = await prisma.galleryItem.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  // Extract publicId from Cloudinary URL
  const urlParts = item.imageUrl.split("/")
  const folderAndFile = urlParts.slice(urlParts.indexOf("frailin-studio")).join("/")
  const publicId = folderAndFile.replace(/\.[^.]+$/, "")

  try {
    await deleteImage(publicId)
  } catch (err) {
    console.error("Error deleting from Cloudinary:", err)
  }

  await prisma.galleryItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
