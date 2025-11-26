import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            slug: string
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        slug: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        slug: string
    }
}
