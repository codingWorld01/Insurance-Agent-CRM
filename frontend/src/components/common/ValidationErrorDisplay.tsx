/**
 * Component for displaying validation errors in forms and filters
 */

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Info } from 'lucide-react'

interface ValidationErrorDisplayProps {
  errors: string[]
  onDismiss?: () => void
  className?: string
  variant?: 'destructive' | 'warning' | 'info'
  title?: string
  showCount?: boolean
}

export function ValidationErrorDisplay({
  errors,
  onDismiss,
  className = '',
  variant = 'destructive',
  title,
  showCount = true
}: ValidationErrorDisplayProps) {
  if (!errors || errors.length === 0) {
    return null
  }

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getAlertVariant = () => {
    switch (variant) {
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      default:
        return 'destructive'
    }
  }

  const getTitle = () => {
    if (title) return title
    
    switch (variant) {
      case 'warning':
        return 'Validation Warnings'
      case 'info':
        return 'Information'
      default:
        return 'Validation Errors'
    }
  }

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-sm">
                {getTitle()}
              </h4>
              {showCount && errors.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {errors.length}
                </Badge>
              )}
            </div>
            
            <AlertDescription>
              {errors.length === 1 ? (
                <p className="text-sm">{errors[0]}</p>
              ) : (
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </div>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
            aria-label="Dismiss validation errors"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

/**
 * Inline validation error for individual form fields
 */
interface InlineValidationErrorProps {
  error?: string
  className?: string
}

export function InlineValidationError({
  error,
  className = ''
}: InlineValidationErrorProps) {
  if (!error) return null

  return (
    <div className={`flex items-center gap-1 mt-1 ${className}`}>
      <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
      <span className="text-xs text-red-600">{error}</span>
    </div>
  )
}

/**
 * Field-level validation error with better styling
 */
interface FieldValidationErrorProps {
  error?: string
  className?: string
  id?: string
}

export function FieldValidationError({
  error,
  className = '',
  id
}: FieldValidationErrorProps) {
  if (!error) return null

  return (
    <p 
      id={id}
      className={`text-sm text-red-600 mt-1 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {error}
    </p>
  )
}