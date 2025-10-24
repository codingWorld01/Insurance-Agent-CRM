/**
 * Enhanced error message component with retry mechanisms and detailed error information
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  Clock, 
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'
import { formatErrorForDisplay, PolicyPageError } from '@/utils/errorHandling'
import { useOfflineDetection } from '@/hooks/useOfflineDetection'
import { useToastNotifications } from '@/hooks/useToastNotifications'

interface EnhancedErrorMessageProps {
  error: unknown
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  className?: string
  showDetails?: boolean
  showSupportInfo?: boolean
  retryAttempts?: number
  maxRetryAttempts?: number
}

export function EnhancedErrorMessage({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = true,
  showSupportInfo = true,
  retryAttempts = 0,
  maxRetryAttempts = 3
}: EnhancedErrorMessageProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const { isOffline } = useOfflineDetection()
  const { showSuccess } = useToastNotifications()

  const errorInfo = formatErrorForDisplay(error)
  const canRetry = errorInfo.retryable && onRetry && retryAttempts < maxRetryAttempts
  const isNetworkError = errorInfo.code === 'NETWORK_ERROR' || errorInfo.code === 'OFFLINE_ERROR'

  // Handle retry with loading state
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  // Copy error details to clipboard
  const copyErrorDetails = async () => {
    if (!(error instanceof PolicyPageError)) return

    const details = {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp.toISOString(),
      context: error.context
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      showSuccess('Error details copied to clipboard')
    } catch {
      console.error('Failed to copy error details')
    }
  }

  // Get appropriate icon based on error type
  const getErrorIcon = () => {
    if (isOffline || errorInfo.code === 'OFFLINE_ERROR') {
      return <WifiOff className="w-6 h-6 text-orange-600" />
    }
    if (errorInfo.code === 'TIMEOUT_ERROR') {
      return <Clock className="w-6 h-6 text-yellow-600" />
    }
    return <AlertTriangle className="w-6 h-6 text-red-600" />
  }

  // Get appropriate background color
  const getBackgroundColor = () => {
    if (isOffline || errorInfo.code === 'OFFLINE_ERROR') {
      return 'bg-orange-50 border-orange-200'
    }
    if (errorInfo.code === 'TIMEOUT_ERROR') {
      return 'bg-yellow-50 border-yellow-200'
    }
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Card className={`w-full max-w-2xl ${getBackgroundColor()}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-white">
            {getErrorIcon()}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              {errorInfo.title}
            </CardTitle>
            
            <CardDescription className="text-gray-700">
              {errorInfo.message}
            </CardDescription>

            {/* Error badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {errorInfo.code && (
                <Badge variant="outline" className="text-xs">
                  {errorInfo.code}
                </Badge>
              )}
              
              {isOffline && (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}
              
              {retryAttempts > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Attempt {retryAttempts + 1}/{maxRetryAttempts + 1}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {canRetry && (
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}
            
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
            
            {isNetworkError && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            )}
          </div>

          {/* Offline-specific guidance */}
          {isOffline && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <WifiOff className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">You're currently offline</p>
                  <p>Check your internet connection and try again. Your work will be saved when connection is restored.</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed error information */}
          {showDetails && error instanceof PolicyPageError && (
            <Collapsible open={showDetailedInfo} onOpenChange={setShowDetailedInfo}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Technical Details
                  </span>
                  {showDetailedInfo ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3">
                <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Error Code:</span>
                      <span className="ml-2 text-gray-600">{error.code || 'Unknown'}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Timestamp:</span>
                      <span className="ml-2 text-gray-600">
                        {error.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    {error.status && (
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="ml-2 text-gray-600">{error.status}</span>
                      </div>
                    )}
                    
                    {error.context && (
                      <div>
                        <span className="font-medium text-gray-700">Context:</span>
                        <pre className="ml-2 text-xs text-gray-600 mt-1 overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyErrorDetails}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Details
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Support information */}
          {showSupportInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Need help?</p>
                <p>
                  If this problem persists, please contact support with the error details above.
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-700 hover:text-blue-800 p-0 h-auto"
                    onClick={() => window.open('mailto:support@example.com', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}