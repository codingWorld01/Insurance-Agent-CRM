"use client"

import * as React from "react"
import { format, differenceInYears, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "@/styles/datepicker.css"
import { cn } from "@/lib/utils"
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

  const handleDateChange = (date: Date | null) => {
    onChange(date || undefined)
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
            "w-full text-base",
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
      <div className="relative">
        <ReactDatePicker
          selected={dateValue}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          disabled={disabled}
          maxDate={maxDate}
          minDate={minDate}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isMobile && "h-12 text-base"
          )}
          wrapperClassName="w-full"
          calendarClassName="!font-sans"
        />
        <CalendarIcon 
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground",
            isMobile ? "h-5 w-5" : "h-4 w-4"
          )} 
        />
      </div>
      
      {showAgeCalculation && dateValue && (
        <p className="text-xs text-muted-foreground mt-1">
          Age: {differenceInYears(new Date(), dateValue)} years
        </p>
      )}
    </div>
  )
}