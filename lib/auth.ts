import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/helpers"

export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const business = await prisma.business.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!business) {
                    return null
                }

                const isValid = await verifyPassword(
                    credentials.password as string,
                    business.password
                )

                if (!isValid) {
                    return null
                }

                return {
                    id: business.id,
                    email: business.email,
                    name: business.name,
                    slug: business.slug,
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.slug = (user as any).slug
                token.email = user.email
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.email) {
                // Fetch latest business data from database
                const business = await prisma.business.findUnique({
                    where: { email: token.email as string },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        slug: true,
                        logoUrl: true,
                    }
                })

                if (business) {
                    session.user.id = business.id
                    session.user.name = business.name
                    session.user.email = business.email
                    session.user.slug = business.slug
                    session.user.logoUrl = business.logoUrl
                }
            }
            return session
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
