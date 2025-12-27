/**
 * Utility functions for refreshing dashboard statistics after policy template operations
 */

import { useDashboardRefresh } from '@/context/DashboardContext';

/**
 * Hook to get dashboard refresh functions for use in policy template operations
 */
export function usePolicyTemplateRefresh() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // During SSR/build, return no-op functions
    const noop = async () => {};
    return {
      refreshAfterPolicyTemplateOperation: noop,
      refreshAfterPolicyInstanceOperation: noop,
      refreshStats: noop,
      refreshAll: noop
    };
  }

  try {
    const context = useDashboardRefresh();
    
    // Create safe no-op functions
    const noop = async () => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Dashboard refresh called but context is not available');
      }
      return Promise.resolve();
    };

    // If context is not available, return no-op functions
    if (!context) {
      return {
        refreshAfterPolicyTemplateOperation: noop,
        refreshAfterPolicyInstanceOperation: noop,
        refreshStats: noop,
        refreshAll: noop
      };
    }

    const { refreshStats, refreshAll } = context;

    const refreshAfterPolicyTemplateOperation = async (operationType: string) => {
      try {
        if (refreshStats) {
          await refreshStats();
          if (process.env.NODE_ENV === 'development') {
            console.log(`Dashboard refreshed after ${operationType} operation`);
          }
        }
      } catch (error) {
        console.error('Error refreshing dashboard after policy template operation:', error);
      }
    };

    const refreshAfterPolicyInstanceOperation = async (operationType: string) => {
      try {
        if (refreshStats) {
          await refreshStats();
          if (process.env.NODE_ENV === 'development') {
            console.log(`Dashboard refreshed after policy instance ${operationType} operation`);
          }
        }
      } catch (error) {
        console.error('Error refreshing dashboard after policy instance operation:', error);
      }
    };

    return {
      refreshAfterPolicyTemplateOperation,
      refreshAfterPolicyInstanceOperation,
      refreshStats: refreshStats || noop,
      refreshAll: refreshAll || noop
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to initialize dashboard refresh:', error);
    }
    const noop = async () => {};
    return {
      refreshAfterPolicyTemplateOperation: noop,
      refreshAfterPolicyInstanceOperation: noop,
      refreshStats: noop,
      refreshAll: noop
    };
  }
}

/**
 * Standalone function to refresh dashboard statistics
 * Can be used in components that don't have access to the dashboard context
 */
export async function refreshDashboardStats(token: string) {
  try {
    const response = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh dashboard statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing dashboard statistics:', error);
    throw error;
  }
}

/**
 * Function to trigger real-time statistics update after policy operations
 */
export async function triggerRealTimeStatsUpdate(
  operationType: 'create' | 'update' | 'delete',
  entityType: 'template' | 'instance',
  token: string
) {
  try {
    // Refresh dashboard statistics
    await refreshDashboardStats(token);
    
    // Log the real-time update
    console.log(`Real-time stats updated after ${entityType} ${operationType}`);
  } catch (error) {
    console.error('Error triggering real-time stats update:', error);
  }
}