"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardStats, ChartData, Activity, ApiResponse } from "@/types";
import { useToastNotifications } from "./useToastNotifications";
import { useAuth } from "@/context/AuthContext";

interface DashboardData {
  stats: DashboardStats | null;
  chartData: ChartData[] | null;
  activities: Activity[] | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useDashboard(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToastNotifications();
  const { token, isAuthenticated } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated || !token) {
        setIsLoading(false);
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
        statsResponse.json() as Promise<ApiResponse<DashboardStats>>,
        chartResponse.json() as Promise<ApiResponse<ChartData[]>>,
        activitiesResponse.json() as Promise<ApiResponse<Activity[]>>,
      ]);

      // Check if the API responses indicate success
      if (
        !statsData.success ||
        !chartDataResult.success ||
        !activitiesData.success
      ) {
        throw new Error("API returned error response");
      }

      setStats(statsData.data || null);
      setChartData(chartDataResult.data || null);
      setActivities(activitiesData.data || null);
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
