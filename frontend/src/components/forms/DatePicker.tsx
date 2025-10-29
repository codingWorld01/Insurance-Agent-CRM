"use client"

import * as React from "react"
import { format, differenceInYears, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useMobileDetection } from "@/hooks/useMobileDetection"

interface DatePickerProps {
  value?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxDate?: Date
  minDate?: Date
  showAgeCalculation?: boolean
  onAgeChange?: (age: number | undefined) => void
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  maxDate,
  minDate,
  showAgeCalculation = false,
  onAgeChange,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const { isMobile, isTouchDevice } = useMobileDetection()
  
  // Convert string to Date if needed
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : undefined
    }
    return undefined
  }, [value])

  // Calculate age when date changes
  React.useEffect(() => {
    if (showAgeCalculation && dateValue && onAgeChange) {
      const age = differenceInYears(new Date(), dateValue)
      onAgeChange(age >= 0 ? age : undefined)
    }
  }, [dateValue, showAgeCalculation, onAgeChange])

  // Update input value when date changes
  React.useEffect(() => {
    if (dateValue) {
      setInputValue(format(dateValue, "dd/MM/yyyy"))
    } else {
      setInputValue("")
    }
  }, [dateValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)

    // Try to parse the input as DD/MM/YYYY
    const parts = input.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      if (isValid(date) && 
          date.getDate() === parseInt(day) && 
          date.getMonth() === parseInt(month) - 1 && 
          date.getFullYear() === parseInt(year)) {
        onChange(date)
      }
    }
  }

  const handleInputBlur = () => {
    // If input is invalid, reset to current date value
    if (dateValue) {
      setInputValue(format(dateValue, "dd/MM/yyyy"))
    } else {
      setInputValue("")
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  // Use native date input on mobile for better UX
  if (isMobile && isTouchDevice) {
    return (
      <div className={cn("relative", className)}>
        <Input
          type="date"
          value={dateValue ? format(dateValue, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onChange(date)
          }}
          disabled={disabled}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
          className={cn(
            "w-full text-base", // Larger text for mobile
            !dateValue && "text-muted-foreground"
          )}
        />
        {showAgeCalculation && dateValue && (
          <p className="text-xs text-muted-foreground mt-1">
            Age: {differenceInYears(new Date(), dateValue)} years
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground",
              isMobile && "h-12 text-base" // Larger touch targets on mobile
            )}
            disabled={disabled}
          >
            <CalendarIcon className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            {dateValue ? format(dateValue, "dd/MM/yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0",
            isMobile && "w-screen max-w-sm" // Full width on mobile
          )} 
          align={isMobile ? "center" : "start"}
        >
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (maxDate && date > maxDate) return true
              if (minDate && date < minDate) return true
              return false
            }}
            initialFocus
            className={isMobile ? "scale-110" : undefined} // Larger calendar on mobile
          />
        </PopoverContent>
      </Popover>
      
      {/* Alternative input for manual entry - hidden on mobile */}
      {!isMobile && (
        <Input
          type="text"
          placeholder="DD/MM/YYYY"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="mt-2"
        />
      )}
      
      {showAgeCalculation && dateValue && (
        <p className="text-xs text-muted-foreground mt-1">
          Age: {differenceInYears(new Date(), dateValue)} years
        </p>
      )}
    </div>
  )
}