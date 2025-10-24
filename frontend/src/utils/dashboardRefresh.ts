/**
 * Utility functions for refreshing dashboard statistics after policy template operations
 */

import { useDashboardRefresh } from '@/context/DashboardContext';

/**
 * Hook to get dashboard refresh functions for use in policy template operations
 */
export function usePolicyTemplateRefresh() {
  const { refreshStats, refreshAll } = useDashboardRefresh();

  const refreshAfterPolicyTemplateOperation = async (operationType: string) => {
    try {
      // Refresh dashboard statistics after policy template operations
      await refreshStats();
      
      // Log the refresh operation (this would be handled by the backend)
      console.log(`Dashboard refreshed after ${operationType} operation`);
    } catch (error) {
      console.error('Error refreshing dashboard after policy template operation:', error);
    }
  };

  const refreshAfterPolicyInstanceOperation = async (operationType: string) => {
    try {
      // Refresh dashboard statistics after policy instance operations
      await refreshStats();
      
      // Log the refresh operation
      console.log(`Dashboard refreshed after policy instance ${operationType} operation`);
    } catch (error) {
      console.error('Error refreshing dashboard after policy instance operation:', error);
    }
  };

  return {
    refreshAfterPolicyTemplateOperation,
    refreshAfterPolicyInstanceOperation,
    refreshStats,
    refreshAll
  };
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