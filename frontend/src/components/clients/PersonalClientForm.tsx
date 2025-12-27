"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInYears } from "date-fns"
import { Loader2, Save, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { DatePicker } from "@/components/forms/DatePicker"
import { PhoneInput } from "@/components/forms/PhoneInput"
import { ProfileImageUpload } from "@/components/forms/ProfileImageUpload"
import { DocumentUpload, type DocumentFile as DocumentUploadFile } from "@/components/forms/DocumentUpload"
import { ResponsiveFormWrapper, ResponsiveGrid } from "@/components/forms/ResponsiveFormWrapper"

import { personalClientSchema, type PersonalClientFormData } from "@/schemas/clientSchemas"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useFormPersistence } from "@/hooks/useFormPersistence"
import { FormRecoveryBanner, AutoSaveIndicator } from "@/components/forms/FormRecoveryBanner"

interface PersonalClientFormProps {
  initialData?: Partial<PersonalClientFormData & { profileImage?: string }>
  onSubmit: (data: PersonalClientFormData & { profileImage?: string; documents?: DocumentFile[] }) => Promise<void>
  isLoading?: boolean
  className?: string
}

interface DocumentFile {
  id: string
  documentType: string
  fileName: string
  originalName: string
  cloudinaryUrl: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
}

export function PersonalClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: PersonalClientFormProps) {
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>(initialData?.profileImage)
  const [documents, setDocuments] = React.useState<DocumentFile[]>([])
  const [showRecoveryBanner, setShowRecoveryBanner] = React.useState(false)
  const { upload, isUploading } = useCloudinaryUpload()
  const { isMobile } = useMobileDetection()

  const form = useForm<PersonalClientFormData>({
    resolver: zodResolver(personalClientSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      middleName: initialData?.middleName || "",
      mobileNumber: initialData?.mobileNumber || "",
      birthDate: initialData?.birthDate || undefined,
      email: initialData?.email || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      address: initialData?.address || "",
      birthPlace: initialData?.birthPlace || "",
      gender: initialData?.gender || undefined,
      height: initialData?.height || undefined,
      weight: initialData?.weight || undefined,
      education: initialData?.education || "",
      maritalStatus: initialData?.maritalStatus || undefined,
      businessJob: initialData?.businessJob || "",
      nameOfBusiness: initialData?.nameOfBusiness || "",
      typeOfDuty: initialData?.typeOfDuty || "",
      annualIncome: initialData?.annualIncome || undefined,
      panNumber: initialData?.panNumber || "",
      gstNumber: initialData?.gstNumber || "",
      age: initialData?.age || undefined,
    },
  })

  // Form persistence
  const formPersistenceKey = initialData ? `personal-client-edit-${initialData.firstName}-${initialData.lastName}` : 'personal-client-new'
  const {
    clearSavedData,
    getSavedDataInfo,
    saveNow,
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

  // Auto-calculate age when birth date changes
  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === "birthDate" && data.birthDate) {
        const age = differenceInYears(new Date(), data.birthDate)
        if (age >= 0 && age !== data.age) {
          form.setValue("age", age, { shouldDirty: false })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  const handleFormSubmit = async (data: PersonalClientFormData) => {
    try {
      await onSubmit({
        ...data,
        profileImage: profileImageUrl,
        documents,
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

  const handleDocumentUpload = async (file: File, documentType: string): Promise<string> => {
    const url = await upload(file, documentType)
    const newDocument: DocumentFile = {
      id: Date.now().toString(), // Temporary ID
      documentType,
      fileName: file.name,
      originalName: file.name,
      cloudinaryUrl: url,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    }
    setDocuments(prev => [...prev, newDocument])
    return url
  }

  const handleDocumentsChange = (newDocuments: DocumentUploadFile[]) => {
    // Convert to DocumentFile format when documents are uploaded
    const convertedDocs: DocumentFile[] = newDocuments
      .filter(doc => doc.status === 'success' && doc.cloudinaryUrl)
      .map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.file.name,
        originalName: doc.file.name,
        cloudinaryUrl: doc.cloudinaryUrl!,
        fileSize: doc.file.size,
        mimeType: doc.file.type,
        uploadedAt: new Date(),
      }))
    setDocuments(convertedDocs)
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
            <User className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            Personal Client Information
          </CardTitle>
          <CardDescription className={cn(isMobile && "text-sm")}>
            Enter comprehensive personal client details. Fields marked with * are required.
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
                <h3 className="text-lg font-medium">Profile Image</h3>
                <ProfileImageUpload
                  value={profileImageUrl}
                  onChange={setProfileImageUrl}
                  onUpload={handleProfileImageUpload}
                  disabled={isLoading || isUploading}
                />
              </div>

              <Separator />

              {/* Basic Information */}
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Basic Information
                </h3>
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
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Mobile Number <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter mobile number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </ResponsiveGrid>

                <ResponsiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date of Birth <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
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
                            value={field.value || ""}
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                </ResponsiveGrid>
              </div>

              <Separator />

              {/* Address Information */}
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Address Information
                </h3>
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
              </div>

              <Separator />

              {/* Physical Information */}
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Physical Information
                </h3>
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
                            value={field.value || ""}
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
                            value={field.value || ""}
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
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Personal Details
                </h3>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Professional Information
                </h3>
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
                            value={field.value || ""}
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
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Tax Information
                </h3>
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

              <Separator />

              {/* Document Upload */}
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <h3 className={cn(
                  "font-medium",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Documents
                </h3>
                <DocumentUpload
                  documents={[]}
                  onDocumentsChange={handleDocumentsChange}
                  onUpload={handleDocumentUpload}
                  disabled={isLoading || isUploading}
                />
              </div>

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