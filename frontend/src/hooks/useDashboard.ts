'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, ChartData, Activity, ApiResponse } from '@/types';
import { useToastNotifications } from './useToastNotifications';
import { useAuth } from '@/context/AuthContext';

interface DashboardData {
  stats: DashboardStats | null;
  chartData: ChartData[] | null;
  activities: Activity[] | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// Create a default/empty dashboard data object
const DEFAULT_DASHBOARD_DATA: Omit<DashboardData, 'refreshStats' | 'refreshAll'> = {
  stats: null,
  chartData: null,
  activities: null,
  isLoading: false,
  error: null,
};

// Helper to safely parse JSON responses
const safeJson = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch data');
  }
  return response.json();
};

export function useDashboard(): DashboardData {
  const [state, setState] = useState<Omit<DashboardData, 'refreshStats' | 'refreshAll'>>(DEFAULT_DASHBOARD_DATA);
  const { showError } = useToastNotifications();
  const { token, isAuthenticated } = useAuth();

  const updateState = useCallback((updates: Partial<Omit<DashboardData, 'refreshStats' | 'refreshAll'>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return DEFAULT_DASHBOARD_DATA;
    }

    try {
      updateState({ isLoading: true, error: null });

      if (!isAuthenticated || !token) {
        updateState({ isLoading: false });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch all dashboard data in parallel
      const [statsResponse, chartResponse, activitiesResponse] =
        await Promise.all([
          fetch("/api/dashboard/stats", { headers }),
          fetch("/api/dashboard/chart-data", { headers }),
          fetch("/api/dashboard/activities", { headers }),
        ]);

      // Check if all requests were successful
      if (!statsResponse.ok || !chartResponse.ok || !activitiesResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, chartDataResult, activitiesData] = await Promise.all([
        statsResponse.json().catch(() => ({})) as Promise<ApiResponse<DashboardStats>>,
        chartResponse.json().catch(() => ({})) as Promise<ApiResponse<ChartData[]>>,
        activitiesResponse.json().catch(() => ({})) as Promise<ApiResponse<Activity[]>>,
      ]);

      // Safely handle the API responses
      if (statsData?.success) {
        setStats(statsData.data || null);
      } else {
        console.warn('Failed to load dashboard stats:', statsData);
        setStats(null);
      }

      if (chartDataResult?.success) {
        setChartData(Array.isArray(chartDataResult.data) ? chartDataResult.data : null);
      } else {
        console.warn('Failed to load chart data:', chartDataResult);
        setChartData(null);
      }

      if (activitiesData?.success) {
        setActivities(Array.isArray(activitiesData.data) ? activitiesData.data : null);
      } else {
        console.warn('Failed to load activities:', activitiesData);
        setActivities(null);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(errorMessage);
      showError(errorMessage, "Dashboard Error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, showError]);

  const refreshStats = useCallback(async () => {
    try {
      if (!isAuthenticated || !token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const statsResponse = await fetch("/api/dashboard/stats", { headers });

      if (!statsResponse.ok) {
        throw new Error("Failed to refresh dashboard statistics");
      }

      const statsData =
        (await statsResponse.json()) as ApiResponse<DashboardStats>;

      if (statsData.success) {
        setStats(statsData.data || null);
      }
    } catch (err) {
      console.error("Error refreshing dashboard stats:", err);
      // Don't show error toast for background refresh
    }
  }, [isAuthenticated, token]);

  const refreshAll = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    chartData,
    activities,
    isLoading,
    error,
    refreshStats,
    refreshAll,
  };
}
