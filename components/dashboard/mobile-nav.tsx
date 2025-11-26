"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Calendar } from "lucide-react"
import { Sidebar } from "./sidebar"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden p-0 w-10 h-10">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <div className="px-6 py-6 border-b">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
             </div>
            <h2 className="text-lg font-bold tracking-tight">BookingSaaS</h2>
          </div>
        </div>
        <div className="px-2 py-4">
           {/* Re-implementing sidebar logic here for mobile to close on click */}
           <Sidebar className="block w-full border-none bg-transparent min-h-0 relative" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
