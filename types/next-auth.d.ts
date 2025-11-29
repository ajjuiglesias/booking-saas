import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            slug: string
            logoUrl?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        slug: string
        logoUrl?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        slug: string
        logoUrl?: string | null
    }
}
