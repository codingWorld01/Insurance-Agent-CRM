"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import { ChevronDown, ChevronUp, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useMobileDetection } from "@/hooks/useMobileDetection"

import type { UnifiedClientFormData } from "@/schemas/clientSchemas"

interface FamilyEmployeeSectionProps {
  form: UseFormReturn<UnifiedClientFormData>
  isCollapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

export function FamilyEmployeeSection({
  form,
  isCollapsible = true,
  defaultOpen = false,
  className,
}: FamilyEmployeeSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const { isMobile } = useMobileDetection()

  const SectionContent = React.useMemo(() => (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Relationship Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Relationship Information
        </h4>
        
        <FormField
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(isMobile && "h-12 text-base")}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="DEPENDENT">Dependent</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  ), [form, isMobile])

  if (!isCollapsible) {
    return (
      <div className={className}>
        {SectionContent}
      </div>
    )
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full justify-between p-4 hover:bg-muted/50",
            isMobile && "p-3"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn(
              "font-medium",
              isMobile ? "text-base" : "text-lg"
            )}>
              Family/Employee Details
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
          ) : (
            <ChevronDown className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {SectionContent}
      </CollapsibleContent>
    </Collapsible>
  )
}