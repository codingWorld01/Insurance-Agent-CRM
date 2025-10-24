/**
 * Hook for managing progressive loading of page components
 */

import { useState, useEffect, useCallback } from 'react'

export type LoadingStage = 'initial' | 'stats' | 'filters' | 'table' | 'complete'

interface ProgressiveLoadingConfig {
  stages: LoadingStage[]
  stageDelays?: Record<LoadingStage, number>
  autoProgress?: boolean
}

interface UseProgressiveLoadingReturn {
  currentStage: LoadingStage
  isStageComplete: (stage: LoadingStage) => boolean
  isStageActive: (stage: LoadingStage) => boolean
  nextStage: () => void
  setStage: (stage: LoadingStage) => void
  reset: () => void
  progress: number
}

const DEFAULT_STAGE_DELAYS: Record<LoadingStage, number> = {
  initial: 0,
  stats: 500,
  filters: 300,
  table: 800,
  complete: 0
}

export function useProgressiveLoading({
  stages = ['initial', 'stats', 'filters', 'table', 'complete'],
  stageDelays = DEFAULT_STAGE_DELAYS,
  autoProgress = false
}: ProgressiveLoadingConfig = {}): UseProgressiveLoadingReturn {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [completedStages, setCompletedStages] = useState<Set<LoadingStage>>(new Set())

  const currentStage = stages[currentStageIndex] || 'initial'

  // Calculate progress percentage
  const progress = (currentStageIndex / (stages.length - 1)) * 100

  // Check if a stage is complete
  const isStageComplete = useCallback((stage: LoadingStage) => {
    return completedStages.has(stage)
  }, [completedStages])

  // Check if a stage is currently active
  const isStageActive = useCallback((stage: LoadingStage) => {
    return currentStage === stage
  }, [currentStage])

  // Move to next stage
  const nextStage = useCallback(() => {
    setCurrentStageIndex(prev => {
      const nextIndex = Math.min(prev + 1, stages.length - 1)
      
      // Mark current stage as complete
      if (prev < stages.length) {
        setCompletedStages(completed => new Set([...completed, stages[prev]]))
      }
      
      return nextIndex
    })
  }, [stages])

  // Set specific stage
  const setStage = useCallback((stage: LoadingStage) => {
    const stageIndex = stages.indexOf(stage)
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex)
      
      // Mark all previous stages as complete
      const previousStages = stages.slice(0, stageIndex)
      setCompletedStages(new Set(previousStages))
    }
  }, [stages])

  // Reset to initial stage
  const reset = useCallback(() => {
    setCurrentStageIndex(0)
    setCompletedStages(new Set())
  }, [])

  // Auto-progress through stages with delays
  useEffect(() => {
    if (!autoProgress || currentStageIndex >= stages.length - 1) {
      return
    }

    const delay = stageDelays[currentStage] || 0
    
    if (delay > 0) {
      const timer = setTimeout(() => {
        nextStage()
      }, delay)

      return () => clearTimeout(timer)
    } else {
      // No delay, progress immediately
      nextStage()
    }
  }, [autoProgress, currentStage, currentStageIndex, stages.length, stageDelays, nextStage])

  return {
    currentStage,
    isStageComplete,
    isStageActive,
    nextStage,
    setStage,
    reset,
    progress
  }
}

/**
 * Hook for managing component-level loading states
 */
interface ComponentLoadingState {
  [key: string]: boolean
}

interface UseComponentLoadingReturn {
  loadingStates: ComponentLoadingState
  setLoading: (component: string, loading: boolean) => void
  isLoading: (component: string) => boolean
  isAnyLoading: boolean
  setMultipleLoading: (states: ComponentLoadingState) => void
  clearAllLoading: () => void
}

export function useComponentLoading(
  initialStates: ComponentLoadingState = {}
): UseComponentLoadingReturn {
  const [loadingStates, setLoadingStates] = useState<ComponentLoadingState>(initialStates)

  const setLoading = useCallback((component: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [component]: loading
    }))
  }, [])

  const isLoading = useCallback((component: string) => {
    return loadingStates[component] || false
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const setMultipleLoading = useCallback((states: ComponentLoadingState) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }))
  }, [])

  const clearAllLoading = useCallback(() => {
    setLoadingStates({})
  }, [])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    setMultipleLoading,
    clearAllLoading
  }
}

/**
 * Hook for managing loading states with timeout
 */
interface UseLoadingWithTimeoutOptions {
  timeout?: number
  onTimeout?: () => void
}

interface UseLoadingWithTimeoutReturn {
  loading: boolean
  setLoading: (loading: boolean) => void
  timedOut: boolean
  resetTimeout: () => void
}

export function useLoadingWithTimeout({
  timeout = 30000, // 30 seconds default
  onTimeout
}: UseLoadingWithTimeoutOptions = {}): UseLoadingWithTimeoutReturn {
  const [loading, setLoadingState] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  const setLoading = useCallback((newLoading: boolean) => {
    setLoadingState(newLoading)
    if (!newLoading) {
      setTimedOut(false)
    }
  }, [])

  const resetTimeout = useCallback(() => {
    setTimedOut(false)
  }, [])

  // Handle timeout
  useEffect(() => {
    if (!loading) {
      return
    }

    const timer = setTimeout(() => {
      setTimedOut(true)
      onTimeout?.()
    }, timeout)

    return () => clearTimeout(timer)
  }, [loading, timeout, onTimeout])

  return {
    loading,
    setLoading,
    timedOut,
    resetTimeout
  }
}

/**
 * Hook for staggered loading animations
 */
interface UseStaggeredLoadingOptions {
  items: any[]
  delay?: number
  batchSize?: number
}

interface UseStaggeredLoadingReturn {
  visibleCount: number
  isItemVisible: (index: number) => boolean
  showAll: () => void
  reset: () => void
  isComplete: boolean
}

export function useStaggeredLoading({
  items,
  delay = 100,
  batchSize = 1
}: UseStaggeredLoadingOptions): UseStaggeredLoadingReturn {
  const [visibleCount, setVisibleCount] = useState(0)

  const isItemVisible = useCallback((index: number) => {
    return index < visibleCount
  }, [visibleCount])

  const showAll = useCallback(() => {
    setVisibleCount(items.length)
  }, [items.length])

  const reset = useCallback(() => {
    setVisibleCount(0)
  }, [])

  const isComplete = visibleCount >= items.length

  // Stagger the appearance of items
  useEffect(() => {
    if (visibleCount >= items.length) {
      return
    }

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length))
    }, delay)

    return () => clearTimeout(timer)
  }, [visibleCount, items.length, delay, batchSize])

  return {
    visibleCount,
    isItemVisible,
    showAll,
    reset,
    isComplete
  }
}