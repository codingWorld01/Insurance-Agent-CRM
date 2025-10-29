"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useMobileDetection } from "@/hooks/useMobileDetection"

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  countryCode?: string
}

export function PhoneInput({
  value = "",
  onChange,
  placeholder = "Enter phone number",
  disabled = false,
  className,
  countryCode = "+91",
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")
  const { isMobile, isTouchDevice } = useMobileDetection()

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "")
    
    // Format as Indian mobile number: +91 XXXXX XXXXX
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
    }
  }

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "")
    // Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
    return /^[6-9]\d{9}$/.test(digits)
  }

  // Update display value when prop value changes
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const digits = input.replace(/\D/g, "")
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      const formatted = formatPhoneNumber(digits)
      setDisplayValue(formatted)
      onChange(digits)
    }
  }

  const handleInputBlur = () => {
    // Validate on blur and provide feedback
    if (value && !validatePhoneNumber(value)) {
      // Could trigger validation error here
    }
  }

  const isValid = value ? validatePhoneNumber(value) : true

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <div className={cn(
          "flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md",
          isMobile && "px-2" // Smaller padding on mobile
        )}>
          <span className={cn(
            "text-muted-foreground",
            isMobile ? "text-base" : "text-sm"
          )}>
            {countryCode}
          </span>
        </div>
        <Input
          type="tel"
          inputMode="numeric" // Better mobile keyboard
          pattern="[0-9\s]*" // Numeric pattern with spaces for mobile
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "rounded-l-none",
            !isValid && value && "border-destructive focus-visible:ring-destructive",
            isMobile && "h-12 text-base", // Larger touch target and text on mobile
            isTouchDevice && "text-base" // Prevent zoom on iOS
          )}
          maxLength={11} // 5 + 1 space + 5
          autoComplete="tel"
        />
      </div>
      {!isValid && value && (
        <p className={cn(
          "text-destructive mt-1",
          isMobile ? "text-sm" : "text-xs"
        )}>
          Please enter a valid 10-digit mobile number
        </p>
      )}
    </div>
  )
}