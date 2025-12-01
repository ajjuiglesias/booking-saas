"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Download, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; error: string }>
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const csv = `name,email,phone,tags,notes
John Doe,john@example.com,1234567890,vip;premium,Regular customer
Jane Smith,jane@example.com,0987654321,new,First time customer`

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customer-import-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/customers/import", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        
        if (data.imported > 0 || data.updated > 0) {
          toast.success(`Imported ${data.imported} customers, updated ${data.updated}`)
          onSuccess()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to import CSV")
      }
    } catch (error) {
      toast.error("Failed to import CSV")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleClose = () => {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import customers. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">CSV Template</p>
              <p className="text-sm text-muted-foreground">
                Download the template to see the required format
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={triggerFileInput}
              disabled={isUploading}
              variant="outline"
              className="w-full h-32 border-dashed gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span>Click to upload CSV file</span>
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Maximum 1000 customers per import • Max file size: 5MB
            </p>
          </div>

          {/* Import Result */}
          {result && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium">Import Results</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.imported}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">Imported</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.updated}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Updated</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.skipped}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">Skipped</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Errors ({result.errors.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-sm text-muted-foreground italic">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">CSV Format:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Required fields: name, phone</li>
              <li>Optional fields: email, tags, notes</li>
              <li>Tags should be separated by semicolons (;)</li>
              <li>Existing customers (same phone) will be updated</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
