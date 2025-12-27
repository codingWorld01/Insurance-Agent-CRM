'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardStats, ChartData, Activity } from '@/types';

interface DashboardContextType {
  stats: DashboardStats | null;
  chartData: ChartData[] | null;
  activities: Activity[] | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardData = useDashboard();

  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

// Hook to get just the refresh functions without subscribing to all dashboard data
export function useDashboardRefresh() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // During SSR/build, return no-op functions
    const noop = async () => {};
    return {
      refreshStats: noop,
      refreshAll: noop
    };
  }

  try {
    const context = useContext(DashboardContext);
    
    // Create safe no-op functions
    const noop = async () => {};
    
    // If context is undefined, return no-op functions
    if (context === undefined) {
      return {
        refreshStats: noop,
        refreshAll: noop
      };
    }
    
    // Return the actual functions from context, or no-op if they don't exist
    return {
      refreshStats: context.refreshStats || noop,
      refreshAll: context.refreshAll || noop
    };
  } catch (error) {
    // Fallback for any errors
    const noop = async () => {};
    return {
      refreshStats: noop,
      refreshAll: noop
    };
  }
}