"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { PhoneInput } from "@/components/forms/PhoneInput"
import { StateSelector } from "@/components/forms/StateSelector"
import { CitySelector } from "@/components/forms/CitySelector"
import { DocumentUpload, type DocumentFile as DocumentUploadFile } from "@/components/forms/DocumentUpload"

import { corporateClientSchema, type CorporateClientFormData } from "@/schemas/clientSchemas"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useFormPersistence } from "@/hooks/useFormPersistence"
import { FormRecoveryBanner, AutoSaveIndicator } from "@/components/forms/FormRecoveryBanner"
import { ResponsiveFormWrapper, ResponsiveGrid } from "@/components/forms/ResponsiveFormWrapper"

interface CorporateClientFormProps {
  initialData?: Partial<CorporateClientFormData>
  onSubmit: (data: CorporateClientFormData & { documents?: DocumentFile[] }) => Promise<void>
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

export function CorporateClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: CorporateClientFormProps) {
  const [documents, setDocuments] = React.useState<DocumentFile[]>([])
  const [showRecoveryBanner, setShowRecoveryBanner] = React.useState(false)
  const [selectedState, setSelectedState] = React.useState<string>("")
  const { upload, isUploading } = useCloudinaryUpload()
  const { isMobile } = useMobileDetection()

  const form = useForm<CorporateClientFormData>({
    resolver: zodResolver(corporateClientSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      mobile: initialData?.mobile || "",
      email: initialData?.email || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      address: initialData?.address || "",
      annualIncome: initialData?.annualIncome || undefined,
      panNumber: initialData?.panNumber || "",
      gstNumber: initialData?.gstNumber || "",
    },
  })

  // Form persistence
  const formPersistenceKey = initialData ? `corporate-client-edit-${initialData.companyName}` : 'corporate-client-new'
  const {
    clearSavedData,
    getSavedDataInfo,
    lastSaveTime,
  } = useFormPersistence(form, {
    key: formPersistenceKey,
    enabled: true,
    debounceMs: 2000,
    exclude: [],
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

  const handleFormSubmit = async (data: CorporateClientFormData) => {
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
            <Building2 className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            Corporate Client Information
          </CardTitle>
          <CardDescription className={cn(isMobile && "text-sm")}>
            Enter comprehensive corporate client details. Fields marked with * are required.
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
              {/* Basic Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value || ""}
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
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <StateSelector
                            value={field.value || ""}
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
                            value={field.value || ""}
                            onChange={field.onChange}
                            selectedState={selectedState}
                            placeholder="Select city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter complete company address"
                          className="min-h-[80px]"
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
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Financial Information</h3>
                <FormField
                  control={form.control}
                  name="annualIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue/Income</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter annual revenue"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Enter the company&apos;s annual revenue in rupees</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter company PAN number"
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
                            {...field}
                            style={{ textTransform: 'uppercase' }}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>
                          Format: 22AAAAA0000A1Z5 (Required for GST-registered businesses)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Corporate Documents</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  Upload relevant corporate documents such as:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Certificate of Incorporation</li>
                    <li>GST Registration Certificate</li>
                    <li>PAN Card</li>
                    <li>Address Proof</li>
                    <li>Financial Statements</li>
                    <li>Other relevant business documents</li>
                  </ul>
                </div>
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
                      Save Corporate Client
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