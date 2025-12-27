"use client"

import * as React from "react"
import { Loader2, Save, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"

import { ProfileImageUpload } from "@/components/forms/ProfileImageUpload"
import { ResponsiveFormWrapper } from "@/components/forms/ResponsiveFormWrapper"
import { FormRecoveryBanner, AutoSaveIndicator } from "@/components/forms/FormRecoveryBanner"

import { PersonalDetailsSection } from "./PersonalDetailsSection"

import { useUnifiedClientValidation } from "@/hooks/useClientValidation"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useFormPersistence } from "@/hooks/useFormPersistence"

import type { UnifiedClientFormData } from "@/schemas/clientSchemas"

interface UnifiedClientFormProps {
  initialData?: Partial<UnifiedClientFormData & { profileImage?: string }>
  onSubmit: (data: UnifiedClientFormData & { profileImage?: string }) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function UnifiedClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: UnifiedClientFormProps) {
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>(initialData?.profileImage)
  const [showRecoveryBanner, setShowRecoveryBanner] = React.useState(false)
  const { upload, isUploading } = useCloudinaryUpload()
  const { isMobile } = useMobileDetection()

  const { form } = useUnifiedClientValidation({
    enableRealTimeValidation: true,
  })

  // Set default values
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        middleName: initialData.middleName || "",
        phoneNumber: initialData.phoneNumber || "",
        whatsappNumber: initialData.whatsappNumber || "",
        dateOfBirth: initialData.dateOfBirth || undefined,
        email: initialData.email || "",
        address: initialData.address || "",
        birthPlace: initialData.birthPlace || "",
        gender: initialData.gender || undefined,
        height: initialData.height || undefined,
        weight: initialData.weight || undefined,
        education: initialData.education || "",
        maritalStatus: initialData.maritalStatus || undefined,
        businessJob: initialData.businessJob || "",
        nameOfBusiness: initialData.nameOfBusiness || "",
        typeOfDuty: initialData.typeOfDuty || "",
        annualIncome: initialData.annualIncome || undefined,
        panNumber: initialData.panNumber || "",
        gstNumber: initialData.gstNumber || "",
        additionalInfo: initialData.additionalInfo || "",
        relationship: initialData.relationship || undefined,
        age: initialData.age || undefined,
      })
    }
  }, [initialData, form])

  // Form persistence
  const formPersistenceKey = initialData 
    ? `unified-client-edit-${initialData.firstName}-${initialData.lastName}` 
    : 'unified-client-new'
  
  const {
    clearSavedData,
    getSavedDataInfo,
    lastSaveTime,
  } = useFormPersistence(form, {
    key: formPersistenceKey,
    enabled: true,
    debounceMs: 2000, // Save every 2 seconds when typing stops
    exclude: ['age'], // Don't persist calculated fields
    autoSave: true,
    showNotifications: false,
  })

  // Check for saved data on mount
  React.useEffect(() => {
    const savedInfo = getSavedDataInfo()
    if (savedInfo?.hasData && !initialData) {
      setShowRecoveryBanner(true)
    }
  }, [getSavedDataInfo, initialData])

  const handleFormSubmit = async (data: UnifiedClientFormData) => {
    try {
      console.log("data ", data)
      await onSubmit({
        ...data,
        profileImage: profileImageUrl,
      })
      // Clear saved data after successful submission
      clearSavedData()
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const handleRestoreData = () => {
    // Data is already restored by the persistence hook
    setShowRecoveryBanner(false)
  }

  const handleDismissRecovery = () => {
    clearSavedData()
    setShowRecoveryBanner(false)
  }

  const handleProfileImageUpload = async (file: File): Promise<string> => {
    const url = await upload(file, "profile-images")
    setProfileImageUrl(url)
    return url
  }

  return (
    <ResponsiveFormWrapper className={className}>
      {/* Form Recovery Banner */}
      <FormRecoveryBanner
        show={showRecoveryBanner}
        lastModified={getSavedDataInfo()?.lastModified || undefined}
        onRestore={handleRestoreData}
        onDismiss={handleDismissRecovery}
        className="mb-4"
      />
      
      <Card>
        <CardHeader className={cn(isMobile && "px-4 py-4")}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile && "text-lg"
          )}>
            <FileText className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            Client Information
          </CardTitle>
          <CardDescription className={cn(isMobile && "text-sm")}>
            Enter comprehensive client details. Only 5 fields are required: First Name, Last Name, Date of Birth, Phone Number, and WhatsApp Number.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(isMobile && "px-4 pb-4")}>
          <div className={cn("space-y-6", isMobile && "space-y-4")}>
            {/* Auto-save indicator */}
            <AutoSaveIndicator
              isEnabled={true}
              lastSaveTime={lastSaveTime}
              className="justify-end"
            />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Profile Image Section */}
                <div className="space-y-4">
                  <h3 className={cn(
                    "font-medium",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    Profile Image
                  </h3>
                  <ProfileImageUpload
                    value={profileImageUrl}
                    onChange={setProfileImageUrl}
                    onUpload={handleProfileImageUpload}
                    disabled={isLoading || isUploading}
                  />
                </div>

                <Separator />

                {/* Personal Details Section */}
                <PersonalDetailsSection
                  form={form}
                  isCollapsible={true}
                  defaultOpen={true}
                />

                {/* Submit Button */}
                <div className={cn(
                  "flex pt-6",
                  isMobile ? "justify-stretch" : "justify-end"
                )}>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className={cn(
                      isMobile ? "w-full h-12 text-base" : "min-w-[120px]"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Client
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </ResponsiveFormWrapper>
  )
}