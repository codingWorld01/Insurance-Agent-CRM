"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import { ChevronDown, ChevronUp, Building } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { StateSelector } from "@/components/forms/StateSelector"
import { CitySelector } from "@/components/forms/CitySelector"
import { ResponsiveGrid } from "@/components/forms/ResponsiveFormWrapper"
import { useMobileDetection } from "@/hooks/useMobileDetection"

import type { UnifiedClientFormData } from "@/schemas/clientSchemas"

interface CorporateDetailsSectionProps {
  form: UseFormReturn<UnifiedClientFormData>
  isCollapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

export function CorporateDetailsSection({
  form,
  isCollapsible = true,
  defaultOpen = false,
  className,
}: CorporateDetailsSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [selectedState, setSelectedState] = React.useState<string>("")
  const { isMobile } = useMobileDetection()

  // Track state changes for city selector
  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === "state" && data.state !== selectedState) {
        setSelectedState(data.state || "")
      }
    })

    // Initialize state value
    const currentState = form.getValues("state")
    if (currentState) {
      setSelectedState(currentState)
    }

    return () => subscription.unsubscribe()
  }, [form, selectedState])

  const SectionContent = React.useMemo(() => (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Company Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Company Information
        </h4>
        
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter company name" 
                  className={cn(isMobile && "h-12 text-base")}
                  autoComplete="organization"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <StateSelector
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select state"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <CitySelector
                    value={field.value}
                    onChange={field.onChange}
                    selectedState={selectedState}
                    placeholder="Select city"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete company address"
                  className={cn(
                    "min-h-[80px]",
                    isMobile && "text-base min-h-[100px]"
                  )}
                  autoComplete="street-address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Financial Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Financial Information
        </h4>
        
        <FormField
          control={form.control}
          name="annualIncome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Revenue</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter annual revenue"
                  className={cn(isMobile && "h-12 text-base")}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="panNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company PAN Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company PAN number"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>Format: ABCDE1234F</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gstNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter GST number"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>Format: 22AAAAA0000A1Z5</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>
      </div>
    </div>
  ), [form, isMobile, selectedState])

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
            <Building className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn(
              "font-medium",
              isMobile ? "text-base" : "text-lg"
            )}>
              Corporate Details
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