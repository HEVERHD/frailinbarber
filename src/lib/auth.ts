import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Check if user exists and is a BARBER
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email || "" },
          select: { role: true },
        })
        console.log("[signIn] dbUser:", dbUser, "| email:", user.email)
        // If user doesn't exist yet (first login) or is CLIENT, block access
        if (!dbUser || (dbUser.role !== "BARBER" && dbUser.role !== "ADMIN")) {
          return "/login?error=unauthorized"
        }
        return true
      } catch (error) {
        console.error("[signIn] ERROR:", error)
        throw error
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      // Always refresh role from DB so role changes take effect immediately
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
