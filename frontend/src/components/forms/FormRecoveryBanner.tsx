"use client"

import * as React from "react"
import { AlertCircle, RotateCcw, X, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface FormRecoveryBannerProps {
  show: boolean
  lastModified?: Date
  onRestore: () => void
  onDismiss: () => void
  className?: string
}

export function FormRecoveryBanner({
  show,
  lastModified,
  onRestore,
  onDismiss,
  className,
}: FormRecoveryBannerProps) {
  if (!show) return null

  const timeAgo = lastModified ? formatDistanceToNow(lastModified, { addSuffix: true }) : 'recently'

  return (
    <Alert className={cn("border-amber-200 bg-amber-50 text-amber-800", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>
            We found unsaved changes from {timeAgo}. Would you like to restore them?
          </span>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRestore}
            className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface AutoSaveIndicatorProps {
  isEnabled: boolean
  lastSaveTime?: number
  className?: string
}

export function AutoSaveIndicator({ 
  isEnabled, 
  lastSaveTime, 
  className 
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = React.useState<string>("")

  React.useEffect(() => {
    if (!lastSaveTime) return

    const updateTimeAgo = () => {
      const now = Date.now()
      const diff = now - lastSaveTime
      
      if (diff < 60000) { // Less than 1 minute
        setTimeAgo("just now")
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000)
        setTimeAgo(`${minutes}m ago`)
      } else {
        const hours = Math.floor(diff / 3600000)
        setTimeAgo(`${hours}h ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [lastSaveTime])

  if (!isEnabled) return null

  return (
    <div className={cn(
      "flex items-center space-x-2 text-xs text-muted-foreground",
      className
    )}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Auto-save enabled</span>
      </div>
      {lastSaveTime && timeAgo && (
        <span>• Last saved {timeAgo}</span>
      )}
    </div>
  )
}