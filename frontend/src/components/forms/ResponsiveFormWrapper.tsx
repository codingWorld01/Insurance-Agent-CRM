"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMobileDetection } from "@/hooks/useMobileDetection"

interface ResponsiveFormWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveFormWrapper({ children, className }: ResponsiveFormWrapperProps) {
  const { isMobile, isTablet } = useMobileDetection()

  return (
    <div
      className={cn(
        "w-full",
        // Mobile-first responsive spacing
        isMobile && "px-4 py-2",
        isTablet && "px-6 py-4",
        !isMobile && !isTablet && "",
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  mobileColumns?: 1 | 2
  tabletColumns?: 1 | 2 | 3
  desktopColumns?: 1 | 2 | 3 | 4
}

export function ResponsiveGrid({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useMobileDetection()

  const getGridClasses = () => {
    if (isMobile) {
      return `grid-cols-${mobileColumns}`
    }
    if (isTablet) {
      return `grid-cols-${tabletColumns}`
    }
    return `grid-cols-${desktopColumns}`
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        getGridClasses(),
        // Mobile-specific adjustments
        isMobile && "gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}