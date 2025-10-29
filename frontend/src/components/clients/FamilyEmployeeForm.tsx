"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInYears } from "date-fns"
import { Loader2, Save, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { DatePicker } from "@/components/forms/DatePicker"
import { PhoneInput } from "@/components/forms/PhoneInput"
import { DocumentUpload, type DocumentFile as DocumentUploadFile } from "@/components/forms/DocumentUpload"

import { familyEmployeeClientSchema, type FamilyEmployeeClientFormData } from "@/schemas/clientSchemas"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useFormPersistence } from "@/hooks/useFormPersistence"
import { FormRecoveryBanner, AutoSaveIndicator } from "@/components/forms/FormRecoveryBanner"
import { ResponsiveFormWrapper, ResponsiveGrid } from "@/components/forms/ResponsiveFormWrapper"

interface FamilyEmployeeFormProps {
  initialData?: Partial<FamilyEmployeeClientFormData>
  onSubmit: (data: FamilyEmployeeClientFormData & { documents?: DocumentFile[] }) => Promise<void>
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

export function FamilyEmployeeForm({
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: FamilyEmployeeFormProps) {
  const [documents, setDocuments] = React.useState<DocumentFile[]>([])
  const [showRecoveryBanner, setShowRecoveryBanner] = React.useState(false)
  const { upload, isUploading } = useCloudinaryUpload()
  const { isMobile } = useMobileDetection()

  const form = useForm<FamilyEmployeeClientFormData>({
    resolver: zodResolver(familyEmployeeClientSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      middleName: initialData?.middleName || "",
      phoneNumber: initialData?.phoneNumber || "",
      whatsappNumber: initialData?.whatsappNumber || "",
      dateOfBirth: initialData?.dateOfBirth || undefined,
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      age: initialData?.age || undefined,
      height: initialData?.height || undefined,
      weight: initialData?.weight || undefined,
      gender: initialData?.gender || undefined,
      relationship: initialData?.relationship || undefined,
      panNumber: initialData?.panNumber || "",
    },
  })

  // Form persistence
  const formPersistenceKey = initialData ? `family-employee-edit-${initialData.firstName}-${initialData.lastName}` : 'family-employee-new'
  const {
    clearSavedData,
    getSavedDataInfo,
    lastSaveTime,
  } = useFormPersistence(form, {
    key: formPersistenceKey,
    enabled: true,
    debounceMs: 2000,
    exclude: ['age'],
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

  // Auto-calculate age when date of birth changes
  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === "dateOfBirth" && data.dateOfBirth) {
        const age = differenceInYears(new Date(), data.dateOfBirth)
        if (age >= 0 && age !== data.age) {
          form.setValue("age", age, { shouldDirty: false })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  const handleFormSubmit = async (data: FamilyEmployeeClientFormData) => {
    try {
      await onSubmit({
        ...data,
        documents,
      })
      clearSavedData()
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const handleRestoreData = () => {
    setShowRecoveryBanner(false)
  }

  const handleDismissRecovery = () => {
    clearSavedData()
    setShowRecoveryBanner(false)
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
            <Users className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            Family/Employee Client Information
          </CardTitle>
          <CardDescription className={cn(isMobile && "text-sm")}>
            Enter family member or employee details with relationship information. Fields marked with * are required.
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
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
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
                          <Input placeholder="Enter middle name" {...field} />
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
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternative Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Enter alternative phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
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
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            readOnly
                          />
                        </FormControl>
                        <FormDescription>Automatically calculated from date of birth</FormDescription>
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
                            <SelectTrigger>
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
                </div>
              </div>

              <Separator />

              {/* Relationship Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Relationship Information</h3>
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship type" />
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
                      <FormDescription>
                        Select the relationship of this person to the primary client
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Physical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Physical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            placeholder="Enter height in feet"
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
                            placeholder="Enter weight in kg"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Information</h3>
                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter PAN number"
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
              </div>

              <Separator />

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Documents</h3>
                <DocumentUpload
                  documents={[]}
                  onDocumentsChange={handleDocumentsChange}
                  onUpload={handleDocumentUpload}
                  disabled={isLoading || isUploading}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="min-w-[120px]"
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