import CalendarView from "@/components/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Booking
        </Button>
      </div>
      <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
        <CalendarView />
      </div>
    </div>
  )
}
