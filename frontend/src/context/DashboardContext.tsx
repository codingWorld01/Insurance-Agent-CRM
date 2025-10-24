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
  const context = useContext(DashboardContext);
  if (context === undefined) {
    // Return no-op functions if not within provider (for components outside dashboard)
    return {
      refreshStats: async () => {},
      refreshAll: async () => {}
    };
  }
  return {
    refreshStats: context.refreshStats,
    refreshAll: context.refreshAll
  };
}