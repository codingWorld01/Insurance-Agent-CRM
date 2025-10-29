"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface FormFieldWrapperProps {
  label: string
  description?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormFieldWrapper({
  label,
  description,
  required = false,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <FormItem className={cn("space-y-2", className)}>
      <FormLabel className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FormLabel>
      <FormControl>
        {children}
      </FormControl>
      {description && (
        <FormDescription className="text-xs text-muted-foreground">
          {description}
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  )
}