"use client"

import * as React from "react"
import { Upload, X, File, AlertCircle, CheckCircle, Camera, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useEnhancedFileUpload } from "@/hooks/useEnhancedFileUpload"
import { UserFriendlyError } from "@/components/common/UserFriendlyError"

export interface DocumentFile {
  id: string
  file: File
  documentType: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  cloudinaryUrl?: string
}

const DOCUMENT_TYPES = [
  { value: "IDENTITY_PROOF", label: "Identity Proof" },
  { value: "ADDRESS_PROOF", label: "Address Proof" },
  { value: "INCOME_PROOF", label: "Income Proof" },
  { value: "MEDICAL_REPORT", label: "Medical Report" },
  { value: "POLICY_DOCUMENT", label: "Policy Document" },
  { value: "OTHER", label: "Other" },
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface DocumentUploadProps {
  documents: DocumentFile[]
  onDocumentsChange: (documents: DocumentFile[]) => void
  onUpload?: (file: File, documentType: string) => Promise<string>
  disabled?: boolean
  className?: string
  maxFiles?: number
}

export function DocumentUpload({
  documents,
  onDocumentsChange,
  onUpload,
  disabled = false,
  className,
  maxFiles = 10,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const { isMobile, isTouchDevice } = useMobileDetection()

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files."
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size too large. Maximum size is 10MB."
    }
    return null
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return

    const newDocuments: DocumentFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      
      if (documents.length + newDocuments.length >= maxFiles) {
        break
      }

      newDocuments.push({
        id: `${Date.now()}-${i}`,
        file,
        documentType: "",
        uploadProgress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      })
    }

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }

  const updateDocument = (id: string, updates: Partial<DocumentFile>) => {
    onDocumentsChange(
      documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      )
    )
  }

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id))
  }

  const enhancedUpload = useEnhancedFileUpload({
    onProgress: (progress) => {
      // Find the document being uploaded and update its progress
      const uploadingDoc = documents.find(doc => doc.status === 'uploading')
      if (uploadingDoc) {
        updateDocument(uploadingDoc.id, { uploadProgress: progress.percentage })
      }
    },
    onSuccess: (url, fileName) => {
      const uploadingDoc = documents.find(doc => doc.status === 'uploading')
      if (uploadingDoc) {
        updateDocument(uploadingDoc.id, { 
          status: 'success', 
          uploadProgress: 100,
          cloudinaryUrl: url 
        })
      }
    },
    onError: (error, fileName) => {
      const uploadingDoc = documents.find(doc => doc.status === 'uploading')
      if (uploadingDoc) {
        updateDocument(uploadingDoc.id, { 
          status: 'error', 
          error: error.message 
        })
      }
    },
    showToasts: true,
  })

  const uploadDocument = async (document: DocumentFile) => {
    if (!document.documentType) return

    updateDocument(document.id, { status: 'uploading', uploadProgress: 0 })

    try {
      const cloudinaryUrl = await enhancedUpload.upload(document.file, document.documentType)
      // Success handled in onSuccess callback
    } catch (error) {
      // Error handled in onError callback
    }
  }

  const openCameraDialog = () => {
    if (!disabled && isMobile) {
      cameraInputRef.current?.click()
    }
  }

  const canAddMore = documents.length < maxFiles

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {canAddMore && (
        <div className={cn("space-y-4", isMobile && "space-y-3")}>
          {/* Mobile Upload Buttons */}
          {isMobile && isTouchDevice ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={openCameraDialog}
                  disabled={disabled}
                  className="h-20 flex-col space-y-2"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => !disabled && fileInputRef.current?.click()}
                  disabled={disabled}
                  className="h-20 flex-col space-y-2"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Choose Files</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Supports PDF, DOC, DOCX, JPG, PNG, GIF (max 10MB each)
              </p>
            </div>
          ) : (
            /* Desktop Upload Area */
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF, DOC, DOCX, JPG, PNG, GIF (max 10MB each)
              </p>
              <Button variant="outline" disabled={disabled}>
                Choose Files
              </Button>
            </div>
          )}
          
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
          
          {/* Camera input for mobile */}
          {isMobile && isTouchDevice && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="hidden"
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className={cn("space-y-3", isMobile && "space-y-2")}>
          <h4 className={cn(
            "font-medium",
            isMobile && "text-sm"
          )}>
            Documents ({documents.length}/{maxFiles})
          </h4>
          {documents.map((document) => (
            <div
              key={document.id}
              className={cn(
                "border rounded-lg space-y-3",
                isMobile ? "p-3 space-y-2" : "p-4 space-y-3"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <File className={cn(
                    "text-muted-foreground flex-shrink-0",
                    isMobile ? "h-6 w-6" : "h-8 w-8"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      isMobile && "text-sm"
                    )}>
                      {document.file.name}
                    </p>
                    <p className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {(document.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "sm"}
                  onClick={() => removeDocument(document.id)}
                  disabled={disabled}
                  className={cn(isMobile && "h-8 w-8 p-0")}
                >
                  <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
              </div>

              {/* Document Type Selection */}
              <div className={cn("space-y-2", isMobile && "space-y-1")}>
                <label className={cn(
                  "font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Document Type *
                </label>
                <Select
                  value={document.documentType}
                  onValueChange={(value) => updateDocument(document.id, { documentType: value })}
                  disabled={disabled || document.status === 'uploading'}
                >
                  <SelectTrigger className={cn(isMobile && "h-10 text-sm")}>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Progress */}
              {document.status === 'uploading' && (
                <div className={cn("space-y-2", isMobile && "space-y-1")}>
                  <div className={cn(
                    "flex justify-between",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    <span>Uploading...</span>
                    <span>{document.uploadProgress}%</span>
                  </div>
                  <Progress 
                    value={document.uploadProgress} 
                    className={cn(isMobile && "h-2")}
                  />
                </div>
              )}

              {/* Status Messages */}
              {document.status === 'error' && document.error && (
                <UserFriendlyError
                  error={document.error}
                  variant="inline"
                  size="sm"
                  onRetry={() => uploadDocument(document)}
                  showReport={false}
                />
              )}

              {document.status === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Document uploaded successfully</AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              {document.status === 'pending' && document.documentType && !document.error && (
                <Button
                  onClick={() => uploadDocument(document)}
                  disabled={disabled}
                  className={cn(
                    "w-full",
                    isMobile && "h-10 text-sm"
                  )}
                >
                  Upload Document
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {documents.length >= maxFiles && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum number of documents ({maxFiles}) reached.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}