/**
 * Network status indicator component for showing connection state
 */

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useOfflineDetection } from '@/hooks/useOfflineDetection'
import { cn } from '@/lib/utils'

interface NetworkStatusIndicatorProps {
  className?: string
  showDetails?: boolean
  onRetry?: () => void
  position?: 'fixed' | 'relative'
}

export function NetworkStatusIndicator({
  className = '',
  showDetails = false,
  onRetry,
  position = 'fixed'
}: NetworkStatusIndicatorProps) {
  const { isOnline, isOffline, offlineDuration } = useOfflineDetection()
  const [showIndicator, setShowIndicator] = useState(false)

  // Show indicator when offline or recently reconnected
  useEffect(() => {
    if (isOffline) {
      setShowIndicator(true)
    } else if (isOnline) {
      // Show briefly when reconnected, then hide
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, isOffline])

  // Don't render if online and not showing
  if (isOnline && !showIndicator) {
    return null
  }

  const formatOfflineDuration = (duration: number | null): string => {
    if (!duration) return ''
    
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const getPositionClasses = () => {
    if (position === 'fixed') {
      return 'fixed top-4 right-4 z-50'
    }
    return 'relative'
  }

  return (
    <div className={cn(getPositionClasses(), className)}>
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg border shadow-lg transition-all duration-300",
        isOffline 
          ? "bg-red-50 border-red-200 text-red-800" 
          : "bg-green-50 border-green-200 text-green-800"
      )}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isOffline ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOffline ? "destructive" : "default"}
              className="text-xs"
            >
              {isOffline ? 'Offline' : 'Online'}
            </Badge>
            
            {offlineDuration && isOffline && (
              <span className="text-xs text-muted-foreground">
                {formatOfflineDuration(offlineDuration)}
              </span>
            )}
          </div>

          {showDetails && (
            <p className="text-xs mt-1 text-muted-foreground">
              {isOffline 
                ? 'Check your internet connection'
                : 'Connection restored'
              }
            </p>
          )}
        </div>

        {/* Action Button */}
        {isOffline && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 w-6 p-0"
            aria-label="Retry connection"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact network status badge for headers/toolbars
 */
interface NetworkStatusBadgeProps {
  className?: string
  onClick?: () => void
}

export function NetworkStatusBadge({
  className = '',
  onClick
}: NetworkStatusBadgeProps) {
  const { isOnline, isOffline } = useOfflineDetection()

  if (isOnline) return null

  return (
    <Badge
      variant="destructive"
      className={cn(
        "cursor-pointer hover:bg-destructive/90 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <WifiOff className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  )
}

/**
 * Connection quality indicator with signal strength
 */
interface ConnectionQualityProps {
  className?: string
  showLabel?: boolean
}

export function ConnectionQuality({
  className = '',
  showLabel = false
}: ConnectionQualityProps) {
  const { isOnline } = useOfflineDetection()
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [effectiveType, setEffectiveType] = useState<string>('unknown')

  useEffect(() => {
    // Check if NetworkInformation API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || 'unknown')
        setEffectiveType(connection.effectiveType || 'unknown')
      }

      updateConnectionInfo()
      
      connection.addEventListener('change', updateConnectionInfo)
      return () => connection.removeEventListener('change', updateConnectionInfo)
    }
  }, [])

  const getQualityColor = () => {
    if (!isOnline) return 'text-red-500'
    
    switch (effectiveType) {
      case '4g':
        return 'text-green-500'
      case '3g':
        return 'text-yellow-500'
      case '2g':
      case 'slow-2g':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getQualityLabel = () => {
    if (!isOnline) return 'Offline'
    
    switch (effectiveType) {
      case '4g':
        return 'Excellent'
      case '3g':
        return 'Good'
      case '2g':
        return 'Poor'
      case 'slow-2g':
        return 'Very Poor'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("flex items-center", getQualityColor())}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
      </div>
      
      {showLabel && (
        <span className={cn("text-xs", getQualityColor())}>
          {getQualityLabel()}
        </span>
      )}
    </div>
  )
}