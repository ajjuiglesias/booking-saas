import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AvailabilitySkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>
      
      {/* Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[180px] mb-2" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              {/* Switch and day name */}
              <div className="w-40 flex items-center gap-3">
                <Skeleton className="h-6 w-11 rounded-full" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
              
              {/* Time inputs */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-10 w-32" />
                </div>
                
                {/* Copy button */}
                <Skeleton className="h-9 w-9 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
