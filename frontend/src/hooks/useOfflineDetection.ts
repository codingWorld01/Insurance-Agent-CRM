/**
 * Hook for detecting offline state and handling offline scenarios
 */

import { useState, useEffect, useCallback } from 'react'
import { useToastNotifications } from './useToastNotifications'

interface OfflineState {
  isOnline: boolean
  wasOffline: boolean
  offlineSince?: Date
  reconnectedAt?: Date
}

interface UseOfflineDetectionReturn {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
  offlineDuration: number | null
  showOfflineMessage: () => void
  showReconnectedMessage: () => void
}

export function useOfflineDetection(): UseOfflineDetectionReturn {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    wasOffline: false
  })

  const { showError, showSuccess, showInfo } = useToastNotifications()

  // Handle online event
  const handleOnline = useCallback(() => {
    const now = new Date()
    setState(prev => ({
      ...prev,
      isOnline: true,
      reconnectedAt: now,
      wasOffline: prev.wasOffline || !prev.isOnline
    }))

    // Show reconnection message if was offline
    if (!state.isOnline) {
      showSuccess('Connection restored', 'You are back online')
    }
  }, [state.isOnline, showSuccess])

  // Handle offline event
  const handleOffline = useCallback(() => {
    const now = new Date()
    setState(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
      offlineSince: now
    }))

    showError(
      'You are currently offline. Some features may not work properly.',
      'Connection Lost'
    )
  }, [showError])

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Calculate offline duration
  const offlineDuration = state.offlineSince && !state.isOnline
    ? Date.now() - state.offlineSince.getTime()
    : null

  // Manual message functions
  const showOfflineMessage = useCallback(() => {
    showInfo(
      'You are currently offline. Changes will be saved when connection is restored.',
      'Offline Mode'
    )
  }, [showInfo])

  const showReconnectedMessage = useCallback(() => {
    showSuccess('Connection restored. All features are now available.', 'Back Online')
  }, [showSuccess])

  return {
    isOnline: state.isOnline,
    isOffline: !state.isOnline,
    wasOffline: state.wasOffline,
    offlineDuration,
    showOfflineMessage,
    showReconnectedMessage
  }
}