import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/appointments/:path*", "/services/:path*", "/settings/:path*", "/users/:path*", "/blocked-slots/:path*", "/clients/:path*"],
}
