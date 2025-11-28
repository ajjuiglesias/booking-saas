import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "@/components/providers/session-provider"
import { PageTransition } from "@/components/ui/page-transition"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
