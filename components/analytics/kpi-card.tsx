"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  format?: "currency" | "number" | "percentage"
}

export function KPICard({ title, value, change, icon, format = "number" }: KPICardProps) {
  const formattedValue = typeof value === "number" 
    ? format === "currency" 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
      : format === "percentage"
      ? `${(value * 100).toFixed(1)}%`
      : value.toLocaleString()
    : value

  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            !isPositive && !isNegative && "text-muted-foreground"
          )}>
            {isPositive && <ArrowUpIcon className="h-3 w-3" />}
            {isNegative && <ArrowDownIcon className="h-3 w-3" />}
            {!isPositive && !isNegative && <TrendingUp className="h-3 w-3" />}
            {Math.abs(change * 100).toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
