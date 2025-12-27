"use client"

import { useState, useCallback } from "react"

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UseCloudinaryUploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

interface UseCloudinaryUploadReturn {
  upload: (file: File, documentType?: string) => Promise<string>
  uploadProgress: UploadProgress | null
  isUploading: boolean
  error: string | null
  reset: () => void
}

export function useCloudinaryUpload({
  onProgress,
  onSuccess,
  onError,
}: UseCloudinaryUploadOptions = {}): UseCloudinaryUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, documentType?: string): Promise<string> => {
    setIsUploading(true)
    setError(null)
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (documentType) {
        formData.append('documentType', documentType)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await response.json()
      const cloudinaryUrl = data.url

      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
      onSuccess?.(cloudinaryUrl)
      
      return cloudinaryUrl
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      console.log("err ", error)
      setError(error.message)
      onError?.(error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [onSuccess, onError])

  const reset = useCallback(() => {
    setUploadProgress(null)
    setIsUploading(false)
    setError(null)
  }, [])

  return {
    upload,
    uploadProgress,
    isUploading,
    error,
    reset,
  }
}

// Hook for multiple file uploads
export function useMultipleCloudinaryUpload({
  onProgress,
  onSuccess,
  onError,
}: UseCloudinaryUploadOptions = {}) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  const uploadMultiple = useCallback(async (
    files: Array<{ file: File; id: string; documentType?: string }>
  ): Promise<Array<{ id: string; url: string }>> => {
    setIsUploading(true)
    setErrors(new Map())
    
    const results: Array<{ id: string; url: string }> = []
    const uploadPromises = files.map(async ({ file, id, documentType }) => {
      try {
        setUploads(prev => new Map(prev).set(id, { loaded: 0, total: file.size, percentage: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        if (documentType) {
          formData.append('documentType', documentType)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Upload failed')
        }

        const data = await response.json()
        const cloudinaryUrl = data.url

        setUploads(prev => new Map(prev).set(id, { loaded: file.size, total: file.size, percentage: 100 }))
        results.push({ id, url: cloudinaryUrl })
        
        return { id, url: cloudinaryUrl }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed')
        setErrors(prev => new Map(prev).set(id, error.message))
        onError?.(error)
        throw error
      }
    })

    try {
      await Promise.all(uploadPromises)
      onSuccess?.(results[0]?.url || '') // Call with first URL for compatibility
      return results
    } finally {
      setIsUploading(false)
    }
  }, [onSuccess, onError])

  const reset = useCallback(() => {
    setUploads(new Map())
    setIsUploading(false)
    setErrors(new Map())
  }, [])

  const getUploadProgress = useCallback((id: string) => {
    return uploads.get(id) || null
  }, [uploads])

  const getUploadError = useCallback((id: string) => {
    return errors.get(id) || null
  }, [errors])

  return {
    uploadMultiple,
    isUploading,
    getUploadProgress,
    getUploadError,
    reset,
  }
}