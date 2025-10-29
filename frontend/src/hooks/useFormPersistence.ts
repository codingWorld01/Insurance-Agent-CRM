"use client"

import { useEffect, useCallback, useRef } from "react"
import { UseFormReturn } from "react-hook-form"

interface UseFormPersistenceOptions {
  key: string
  enabled?: boolean
  debounceMs?: number
  exclude?: string[]
  autoSave?: boolean
  showNotifications?: boolean
}

export function useFormPersistence<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  { 
    key, 
    enabled = true, 
    debounceMs = 1000, 
    exclude = [],
    autoSave = true,
    showNotifications = false
  }: UseFormPersistenceOptions
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<number>(0)
  const { watch, setValue, formState: { isDirty } } = form

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return

    try {
      const savedData = localStorage.getItem(`form-${key}`)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        
        // Check if data has metadata (newer format)
        const formData = parsedData._metadata ? 
          Object.fromEntries(
            Object.entries(parsedData).filter(([key]) => key !== '_metadata')
          ) : parsedData
        
        // Set form values, excluding specified fields
        Object.entries(formData).forEach(([fieldName, value]) => {
          if (!exclude.includes(fieldName)) {
            // Convert date strings back to Date objects for date fields
            let processedValue = value
            const dateFields = ['dateOfBirth', 'createdAt', 'updatedAt'] // Add more date fields as needed
            
            if (dateFields.includes(fieldName) && typeof value === 'string' && value) {
              try {
                const parsedDate = new Date(value)
                // Validate that the parsed date is valid
                if (!isNaN(parsedDate.getTime())) {
                  processedValue = parsedDate
                }
              } catch {
                // If date parsing fails, keep the original value
                processedValue = value
              }
            }
            
            // Use type assertion for setValue - bypass type checking for dynamic field names
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(setValue as any)(fieldName, processedValue, { shouldDirty: false })
          }
        })

        if (showNotifications && parsedData._metadata?.autoSaved) {
          console.log('Form data restored from auto-save')
        }
      }
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error)
    }
  }, [key, enabled, exclude, setValue, showNotifications])



  // Watch form changes and debounce saves using subscription pattern
  useEffect(() => {
    if (!enabled || !autoSave) return

    const subscription = watch((data) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for debounced save
      timeoutRef.current = setTimeout(() => {
        // Inline save logic to avoid circular dependency
        try {
          // Filter out excluded fields
          const dataToSave = Object.entries(data as Record<string, unknown>).reduce((acc, [fieldName, value]) => {
            if (!exclude.includes(fieldName)) {
              acc[fieldName] = value
            }
            return acc
          }, {} as Record<string, unknown>)

          // Add metadata
          const saveData = {
            ...dataToSave,
            _metadata: {
              lastModified: Date.now(),
              version: '1.0',
              autoSaved: true,
            }
          }

          localStorage.setItem(`form-${key}`, JSON.stringify(saveData))
          lastSaveRef.current = Date.now()

          if (showNotifications) {
            console.log('Form auto-saved')
          }
        } catch (error) {
          console.warn('Failed to save form data to localStorage:', error)
        }
      }, debounceMs)
    })

    // Cleanup timeout and subscription on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      subscription.unsubscribe()
    }
  }, [watch, debounceMs, enabled, autoSave, key, exclude, showNotifications])

  // Save on page unload/visibility change (mobile support)
  useEffect(() => {
    if (!enabled) return

    const saveCurrentData = () => {
      try {
        const currentData = watch() as Record<string, unknown>
        // Filter out excluded fields
        const dataToSave = Object.entries(currentData).reduce((acc, [fieldName, value]) => {
          if (!exclude.includes(fieldName)) {
            acc[fieldName] = value
          }
          return acc
        }, {} as Record<string, unknown>)

        // Add metadata
        const saveData = {
          ...dataToSave,
          _metadata: {
            lastModified: Date.now(),
            version: '1.0',
            autoSaved: true,
          }
        }

        localStorage.setItem(`form-${key}`, JSON.stringify(saveData))
        lastSaveRef.current = Date.now()
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error)
      }
    }

    const handleBeforeUnload = () => {
      if (isDirty) {
        saveCurrentData()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isDirty) {
        saveCurrentData()
      }
    }

    const handlePageHide = () => {
      if (isDirty) {
        saveCurrentData()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [enabled, isDirty, watch, key, exclude])

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(`form-${key}`)
    } catch (error) {
      console.warn('Failed to clear saved form data:', error)
    }
  }, [key])

  // Check if saved data exists
  const hasSavedData = useCallback(() => {
    try {
      return localStorage.getItem(`form-${key}`) !== null
    } catch {
      return false
    }
  }, [key])

  // Get saved data info
  const getSavedDataInfo = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`form-${key}`)
      if (!savedData) return null

      const parsedData = JSON.parse(savedData)
      const metadata = parsedData._metadata

      return {
        hasData: true,
        lastModified: metadata?.lastModified ? new Date(metadata.lastModified) : null,
        isAutoSaved: metadata?.autoSaved || false,
        version: metadata?.version || 'unknown',
      }
    } catch {
      return null
    }
  }, [key])

  // Manual save function
  const saveNow = useCallback(() => {
    const currentData = watch() as Record<string, unknown>
    try {
      // Filter out excluded fields
      const dataToSave = Object.entries(currentData).reduce((acc, [fieldName, value]) => {
        if (!exclude.includes(fieldName)) {
          acc[fieldName] = value
        }
        return acc
      }, {} as Record<string, unknown>)

      // Add metadata
      const saveData = {
        ...dataToSave,
        _metadata: {
          lastModified: Date.now(),
          version: '1.0',
          autoSaved: false,
        }
      }

      localStorage.setItem(`form-${key}`, JSON.stringify(saveData))
      lastSaveRef.current = Date.now()

      if (showNotifications) {
        console.log('Form manually saved')
      }
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error)
    }
  }, [watch, key, exclude, showNotifications])

  return {
    clearSavedData,
    hasSavedData,
    getSavedDataInfo,
    saveNow,
    lastSaveTime: lastSaveRef.current,
  }
}

// Hook for managing multiple form sessions
export function useFormSessionManager() {
  const getSavedForms = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('form-'))
      return keys.map(key => ({
        key: key.replace('form-', ''),
        lastModified: new Date(JSON.parse(localStorage.getItem(key) || '{}').lastModified || Date.now()),
      }))
    } catch {
      return []
    }
  }, [])

  const clearAllSavedForms = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('form-'))
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear all saved forms:', error)
    }
  }, [])

  const clearOldSavedForms = useCallback((maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
    try {
      const now = Date.now()
      const keys = Object.keys(localStorage).filter(key => key.startsWith('form-'))
      
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          const lastModified = data.lastModified || 0
          
          if (now - lastModified > maxAge) {
            localStorage.removeItem(key)
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear old saved forms:', error)
    }
  }, [])

  return {
    getSavedForms,
    clearAllSavedForms,
    clearOldSavedForms,
  }
}