"use client"

import * as React from "react"
import { Upload, X, File, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

interface FileUploadZoneProps {
  files: UploadFile[]
  onFilesChange: (files: UploadFile[]) => void
  onUpload?: (file: File) => Promise<string>
  accept?: string
  maxFiles?: number
  maxSize?: number // in bytes
  allowedTypes?: string[]
  disabled?: boolean
  className?: string
  multiple?: boolean
  children?: React.ReactNode
}

export function FileUploadZone({
  files,
  onFilesChange,
  onUpload,
  accept = "*/*",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [],
  disabled = false,
  className,
  multiple = true,
  children,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    }
    if (file.size > maxSize) {
      return `File size too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB.`
    }
    return null
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return

    const newFiles: UploadFile[] = []
    const remainingSlots = maxFiles - files.length

    for (let i = 0; i < Math.min(fileList.length, remainingSlots); i++) {
      const file = fileList[i]
      const error = validateFile(file)

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      })
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
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
    e.target.value = ""
  }

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    onFilesChange(
      files.map(file => 
        file.id === id ? { ...file, ...updates } : file
      )
    )
  }

  const removeFile = (id: string) => {
    onFilesChange(files.filter(file => file.id !== id))
  }

  const uploadFile = async (file: UploadFile) => {
    if (!onUpload) return

    updateFile(file.id, { status: 'uploading', progress: 0 })

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        updateFile(file.id, { 
          progress: Math.min(file.progress + 10, 90) 
        })
      }, 200)

      const url = await onUpload(file.file)
      
      clearInterval(progressInterval)
      updateFile(file.id, { 
        status: 'success', 
        progress: 100,
        url 
      })
    } catch (error) {
      updateFile(file.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      })
    }
  }

  const canAddMore = files.length < maxFiles

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      {canAddMore && (
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
          {children || (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Maximum {maxFiles} files, {(maxSize / 1024 / 1024).toFixed(1)}MB each
              </p>
              <Button variant="outline" disabled={disabled}>
                Choose Files
              </Button>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {file.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} />
                </div>
              )}

              {/* Error Message */}
              {file.status === 'error' && file.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{file.error}</AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              {file.status === 'pending' && !file.error && onUpload && (
                <Button
                  onClick={() => uploadFile(file)}
                  disabled={disabled}
                  size="sm"
                >
                  Upload
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length >= maxFiles && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum number of files ({maxFiles}) reached.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}