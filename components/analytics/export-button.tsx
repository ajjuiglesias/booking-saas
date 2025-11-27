"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Papa from "papaparse"
import { format } from "date-fns"

interface ExportButtonProps {
  data: any[]
  filename: string
  label?: string
}

export function ExportButton({ data, filename, label = "Export CSV" }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      return
    }

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
