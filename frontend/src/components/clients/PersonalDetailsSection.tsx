"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import { differenceInYears } from "date-fns"
import { ChevronDown, ChevronUp, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { ReactDayPicker } from "@/components/forms/ReactDayPicker"
import { PhoneInput } from "@/components/forms/PhoneInput"
import { StateSelector } from "@/components/forms/StateSelector"
import { CitySelector } from "@/components/forms/CitySelector"
import { ResponsiveGrid } from "@/components/forms/ResponsiveFormWrapper"
import { useMobileDetection } from "@/hooks/useMobileDetection"

import type { UnifiedClientFormData } from "@/schemas/clientSchemas"

interface PersonalDetailsSectionProps {
  form: UseFormReturn<UnifiedClientFormData>
  isCollapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

export function PersonalDetailsSection({
  form,
  isCollapsible = true,
  defaultOpen = true,
  className,
}: PersonalDetailsSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [selectedState, setSelectedState] = React.useState<string>("")
  const { isMobile } = useMobileDetection()

  // Auto-calculate age when date of birth changes and track state changes
  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === "dateOfBirth") {
        if (data.dateOfBirth) {
          const age = differenceInYears(new Date(), data.dateOfBirth)
          if (age >= 0 && age !== data.age) {
            form.setValue("age", age, { shouldDirty: false })
          }
        } else {
          // Clear age when date of birth is cleared
          form.setValue("age", undefined, { shouldDirty: false })
        }
      }
      
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
      {/* Basic Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Basic Information
        </h4>
        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter first name" 
                    className={cn(isMobile && "h-12 text-base")}
                    autoComplete="given-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter middle name" 
                    className={cn(isMobile && "h-12 text-base")}
                    autoComplete="additional-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter last name" 
                    className={cn(isMobile && "h-12 text-base")}
                    autoComplete="family-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone Number <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter phone number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsappNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  WhatsApp Number <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter WhatsApp number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter email address" 
                    className={cn(isMobile && "h-12 text-base")}
                    autoComplete="email"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Date of Birth <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ReactDayPicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select birth date"
                    maxDate={new Date()}
                    showAgeCalculation
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Auto-calculated"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    readOnly
                  />
                </FormControl>
                <FormDescription>Automatically calculated from birth date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={cn(isMobile && "h-12 text-base")}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Place</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter birth place" 
                    className={cn(isMobile && "h-12 text-base")}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>
      </div>

      <Separator />

      {/* Address Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Address Information
        </h4>
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete address"
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

      {/* Physical Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Physical Information
        </h4>
        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (feet)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="Enter height in feet"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="Enter weight in kg"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Personal Details
        </h4>
        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter education qualification" 
                    className={cn(isMobile && "h-12 text-base")}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marital Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={cn(isMobile && "h-12 text-base")}>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MARRIED">Married</SelectItem>
                    <SelectItem value="DIVORCED">Divorced</SelectItem>
                    <SelectItem value="WIDOWED">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>
      </div>

      <Separator />

      {/* Professional Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Professional Information
        </h4>
        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="businessJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business/Job</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter business or job title" 
                    className={cn(isMobile && "h-12 text-base")}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nameOfBusiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of Business/Company</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter business or company name" 
                    className={cn(isMobile && "h-12 text-base")}
                    autoComplete="organization"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>

        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="typeOfDuty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Duty</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter type of duty/role" 
                    className={cn(isMobile && "h-12 text-base")}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Income</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter annual income"
                    className={cn(isMobile && "h-12 text-base")}
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveGrid>
      </div>

      <Separator />

      {/* Tax Information */}
      <div className={cn("space-y-4", isMobile && "space-y-3")}>
        <h4 className={cn(
          "font-medium text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Tax Information
        </h4>
        <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={2}>
          <FormField
            control={form.control}
            name="panNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter PAN number"
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
            <User className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn(
              "font-medium",
              isMobile ? "text-base" : "text-lg"
            )}>
              Personal Details
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