"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Users } from "lucide-react"

interface AttendeeSelectorProps {
  maxGroupSize: number
  value: number
  onChange: (value: number) => void
  pricePerPerson: number
}

export function AttendeeSelector({ 
  maxGroupSize, 
  value, 
  onChange, 
  pricePerPerson 
}: AttendeeSelectorProps) {
  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < maxGroupSize) {
      onChange(value + 1)
    }
  }

  const totalPrice = pricePerPerson * value

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        Number of Attendees
      </Label>
      
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= 1}
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">
            {value === 1 ? "person" : "people"}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= maxGroupSize}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {maxGroupSize > 1 && (
        <div className="text-sm text-muted-foreground text-center">
          Maximum {maxGroupSize} {maxGroupSize === 1 ? "person" : "people"} per booking
        </div>
      )}

      {value > 1 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span>Price per person:</span>
            <span className="font-medium">${pricePerPerson.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span>{value} × ${pricePerPerson.toFixed(2)}</span>
            <span className="text-lg font-bold">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
