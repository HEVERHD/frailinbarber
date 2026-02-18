import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token.role !== "BARBER" && token.role !== "ADMIN") {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("error", "unauthorized")
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/appointments",
    "/appointments/:path*",
    "/services",
    "/services/:path*",
    "/settings",
    "/settings/:path*",
    "/users",
    "/users/:path*",
    "/blocked-slots",
    "/blocked-slots/:path*",
    "/clients",
    "/clients/:path*",
    "/profile",
    "/profile/:path*",
  ],
}
