"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  formatValue?: (value: number) => string
  label?: string
  className?: string
  disabled?: boolean
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (val) => val.toString(),
  label,
  className,
  disabled = false,
}: RangeSliderProps) {
  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, value.max))
    onChange({ min: clampedMin, max: value.max })
  }

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.min(max, Math.max(newMax, value.min))
    onChange({ min: value.min, max: clampedMax })
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      
      <div className="space-y-3">
        {/* Range Display */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatValue(value.min)}</span>
          <span>to</span>
          <span>{formatValue(value.max)}</span>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="min-input" className="text-xs text-muted-foreground">
              Min
            </Label>
            <Input
              id="min-input"
              type="number"
              min={min}
              max={value.max}
              step={step}
              value={value.min}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              disabled={disabled}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-input" className="text-xs text-muted-foreground">
              Max
            </Label>
            <Input
              id="max-input"
              type="number"
              min={value.min}
              max={max}
              step={step}
              value={value.max}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </div>

        {/* Visual Range Indicator */}
        <div className="relative h-2 bg-muted rounded-full">
          <div
            className="absolute h-2 bg-primary rounded-full"
            style={{
              left: `${((value.min - min) / (max - min)) * 100}%`,
              width: `${((value.max - value.min) / (max - min)) * 100}%`,
            }}
          />
        </div>

        {/* Min/Max Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  )
}