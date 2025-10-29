"use client"

import * as React from "react"
import { Camera, Upload, X, User, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMobileDetection } from "@/hooks/useMobileDetection"
import { useEnhancedFileUpload } from "@/hooks/useEnhancedFileUpload"
import { UserFriendlyError } from "@/components/common/UserFriendlyError"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

interface ProfileImageUploadProps {
  value?: string // Cloudinary URL
  onChange: (url: string | undefined) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProfileImageUpload({
  value,
  onChange,
  onUpload,
  disabled = false,
  className,
  size = 'md',
}: ProfileImageUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState<string>("")
  const [preview, setPreview] = React.useState<string>("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const { isMobile, isTouchDevice } = useMobileDetection()

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48"
  }

  // Update preview when value changes
  React.useEffect(() => {
    if (value) {
      setPreview(value)
    } else {
      setPreview("")
    }
  }, [value])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Please upload a valid image file (JPG, PNG, or GIF)."
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Image size too large. Maximum size is 5MB."
    }
    return null
  }

  const handleFile = (file: File) => {
    if (disabled) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setUploadStatus('error')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file if handler provided
    if (onUpload) {
      uploadFile(file)
    }
  }

  const enhancedUpload = useEnhancedFileUpload({
    onProgress: (progress) => {
      setUploadProgress(progress.percentage)
    },
    onSuccess: (url) => {
      setUploadProgress(100)
      setUploadStatus('success')
      setError("")
      onChange(url)
    },
    onError: (error) => {
      setUploadStatus('error')
      setError(error.message)
      setPreview("") // Clear preview on error
    },
    showToasts: true,
    validateFile: (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return "Please upload a valid image file (JPG, PNG, or GIF)."
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return "Image size too large. Maximum size is 5MB."
      }
      return null
    }
  })

  const uploadFile = async (file: File) => {
    if (!onUpload) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setError("")

    try {
      await enhancedUpload.upload(file)
      // Success handled in onSuccess callback
    } catch (error) {
      // Error handled in onError callback
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
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // Reset input value
    e.target.value = ""
  }

  const removeImage = () => {
    setPreview("")
    setUploadStatus('idle')
    setUploadProgress(0)
    setError("")
    onChange(undefined)
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const openCameraDialog = () => {
    if (!disabled && isMobile) {
      cameraInputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image Preview/Upload Area */}
      <div className="flex flex-col items-center space-y-4">
        <div
          className={cn(
            "relative rounded-full border-2 border-dashed overflow-hidden transition-colors",
            sizeClasses[size],
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              {uploadStatus === 'uploading' ? (
                <Upload className="h-8 w-8 animate-pulse" />
              ) : (
                <User className="h-8 w-8" />
              )}
              <span className="text-xs mt-1">
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Add Photo'}
              </span>
            </div>
          )}

          {/* Remove button */}
          {preview && !disabled && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation()
                removeImage()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Action Buttons */}
        <div className={cn(
          "flex space-x-2",
          isMobile && "flex-col space-x-0 space-y-2 w-full"
        )}>
          {/* Camera button for mobile */}
          {isMobile && isTouchDevice && (
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={openCameraDialog}
              disabled={disabled || uploadStatus === 'uploading'}
              className={cn(isMobile && "w-full h-12 text-base")}
            >
              <Camera className={cn(isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2")} />
              Take Photo
            </Button>
          )}
          
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={openFileDialog}
            disabled={disabled || uploadStatus === 'uploading'}
            className={cn(isMobile && "w-full h-12 text-base")}
          >
            <Upload className={cn(isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2")} />
            {isMobile ? 'Choose from Gallery' : (preview ? 'Change Photo' : 'Upload Photo')}
          </Button>
          
          {preview && (
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={removeImage}
              disabled={disabled || uploadStatus === 'uploading'}
              className={cn(isMobile && "w-full h-12 text-base")}
            >
              <X className={cn(isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2")} />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {uploadStatus === 'error' && error && (
        <UserFriendlyError
          error={error}
          variant="inline"
          size="sm"
          onRetry={() => {
            if (preview) {
              // Re-upload the current file
              const fileInput = fileInputRef.current
              if (fileInput?.files?.[0]) {
                uploadFile(fileInput.files[0])
              }
            }
          }}
          showReport={false}
        />
      )}

      {uploadStatus === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Profile image uploaded successfully</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center">
        Supports JPG, PNG, GIF (max 5MB)
      </p>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
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
          capture="environment" // Use rear camera by default
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      )}
    </div>
  )
}