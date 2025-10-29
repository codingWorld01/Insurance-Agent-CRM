"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { format, differenceInYears } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useMobileDetection } from "@/hooks/useMobileDetection"

// Import react-day-picker CSS
import "react-day-picker/dist/style.css"

interface ReactDayPickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxDate?: Date
  minDate?: Date
  showAgeCalculation?: boolean
}

export function ReactDayPicker({
  value,
  onChange,
  placeholder = "Select birth date",
  disabled = false,
  className,
  maxDate,
  minDate,
  showAgeCalculation = false,
}: ReactDayPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { isMobile } = useMobileDetection()

  // Mobile: Use native date input
  if (isMobile) {
    return (
      <div className={cn("relative", className)}>
        <Input
          type="date"
          value={value ? format(value, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const dateValue = e.target.value
            if (dateValue) {
              onChange(new Date(dateValue))
            } else {
              onChange(undefined)
            }
          }}
          disabled={disabled}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
          className="h-12 text-base"
        />
        {showAgeCalculation && value && (
          <p className="text-xs text-muted-foreground mt-1">
            Age: {differenceInYears(new Date(), value)} years
          </p>
        )}
      </div>
    )
  }

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
  }

  // Desktop: Use react-day-picker
  return (
    <div className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Input
          value={value ? format(value, "dd/MM/yyyy") : ""}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className="pr-8"
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              showOutsideDays={false}
              className="rdp-custom"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 h-9 w-9"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                Chevron: ({ orientation }) => (
                  <span className="h-4 w-4">
                    {orientation === "left" ? "‹" : "›"}
                  </span>
                ),
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
      {showAgeCalculation && value && (
        <p className="text-xs text-muted-foreground mt-1">
          Age: {differenceInYears(new Date(), value)} years
        </p>
      )}
    </div>
  )
}