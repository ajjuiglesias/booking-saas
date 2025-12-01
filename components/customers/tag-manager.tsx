"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Tag as TagIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Tag {
  id: string
  name: string
  color: string
  usageCount: number
}

interface TagManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagsUpdated?: () => void
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#14b8a6", // Teal
]

export function TagManager({ open, onOpenChange, onTagsUpdated }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create tag form
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/customers/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        toast.error("Failed to load tags")
      }
    } catch (error) {
      toast.error("Failed to load tags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/customers/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (response.ok) {
        toast.success("Tag created successfully")
        setNewTagName("")
        setNewTagColor(PRESET_COLORS[0])
        fetchTags()
        onTagsUpdated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create tag")
      }
    } catch (error) {
      toast.error("Failed to create tag")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all customers.`)) {
      return
    }

    setDeletingId(tagId)
    try {
      const response = await fetch(`/api/customers/tags/${tagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Tag deleted successfully")
        fetchTags()
        onTagsUpdated?.()
      } else {
        toast.error("Failed to delete tag")
      }
    } catch (error) {
      toast.error("Failed to delete tag")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Customer Tags</DialogTitle>
          <DialogDescription>
            Create and manage tags to categorize your customers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create New Tag */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Tag
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  placeholder="e.g., Premium, VIP, Regular"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag()
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newTagColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateTag}
              disabled={isCreating || !newTagName.trim()}
              className="w-full gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Tag
                </>
              )}
            </Button>
          </div>

          {/* Existing Tags */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Existing Tags ({tags.length})
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TagIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tags created yet</p>
                <p className="text-sm">Create your first tag above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tag.usageCount} {tag.usageCount === 1 ? "customer" : "customers"}
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      disabled={deletingId === tag.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === tag.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
