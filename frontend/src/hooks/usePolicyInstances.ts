import { useState, useEffect, useCallback } from 'react';
import { PolicyInstanceWithTemplate, CreatePolicyInstanceRequest, UpdatePolicyInstanceRequest } from '@/types';
import { useToastNotifications } from './useToastNotifications';
import { useDashboardRefresh } from '@/context/DashboardContext';
import { isAuthError, handleAuthError } from '@/utils/authErrorHandler';
import { useRouter } from 'next/navigation';

interface UsePolicyInstancesOptions {
  clientId?: string;
  autoFetch?: boolean;
}

export function usePolicyInstances(options: UsePolicyInstancesOptions = {}) {
  const [instances, setInstances] = useState<PolicyInstanceWithTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<{
    create: boolean;
    update: boolean;
    delete: boolean;
  }>({
    create: false,
    update: false,
    delete: false,
  });

  const { showSuccess, showError } = useToastNotifications();
  const { refreshStats } = useDashboardRefresh();
  const router = useRouter();

  // Define fetchInstances first
  const fetchInstances = useCallback(async () => {
    if (!options.clientId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clients/${options.clientId}/policy-instances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy instances');
      }

      const result = await response.json();
      if (result.success) {
        setInstances(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch policy instances');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      showError(errorMessage, 'Failed to load policy instances');
    } finally {
      setLoading(false);
    }
  }, [options.clientId, showError, router]);

  // Auto-fetch instances when the component mounts or clientId changes
  useEffect(() => {
    if (options.autoFetch !== false && options.clientId) {
      fetchInstances();
    }
  }, [options.autoFetch, options.clientId, fetchInstances]);

  const createInstance = async (data: CreatePolicyInstanceRequest): Promise<PolicyInstanceWithTemplate> => {
    if (!options.clientId) {
      throw new Error('Client ID is required');
    }

    setOperationLoading(prev => ({ ...prev, create: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/clients/${options.clientId}/policy-instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Invalid policy instance data. Please check your inputs.');
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to create policy instances for this client.');
          case 409:
            throw new Error(errorData.message || 'This client already has this policy template.');
          case 422:
            throw new Error(errorData.message || 'Invalid policy instance information. Please check all fields.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to create policy instance. Please try again.');
        }
      }

      if (errorData.success) {
        await fetchInstances();
        await refreshStats();
        showSuccess(`Policy instance created successfully`);
        return errorData.data;
      } else {
        throw new Error(errorData.message || 'Failed to create policy instance');
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating the policy instance');
    } finally {
      setOperationLoading(prev => ({ ...prev, create: false }));
    }
  };

  const updateInstance = async (id: string, data: UpdatePolicyInstanceRequest): Promise<PolicyInstanceWithTemplate> => {
    setOperationLoading(prev => ({ ...prev, update: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/policy-instances/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Invalid policy instance data. Please check your inputs.');
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to update this policy instance.');
          case 404:
            throw new Error('Policy instance not found. It may have been deleted.');
          case 422:
            throw new Error(errorData.message || 'Invalid policy instance information. Please check all fields.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to update policy instance. Please try again.');
        }
      }

      if (errorData.success) {
        await fetchInstances();
        await refreshStats();
        showSuccess(`Policy instance updated successfully`);
        return errorData.data;
      } else {
        throw new Error(errorData.message || 'Failed to update policy instance');
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating the policy instance');
    } finally {
      setOperationLoading(prev => ({ ...prev, update: false }));
    }
  };

  const deleteInstance = async (id: string): Promise<void> => {
    setOperationLoading(prev => ({ ...prev, delete: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/policy-instances/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!response.ok) {
        switch (response.status) {
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to delete this policy instance.');
          case 404:
            throw new Error('Policy instance not found. It may have already been deleted.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to delete policy instance. Please try again.');
        }
      }

      if (errorData.success) {
        await fetchInstances();
        await refreshStats();
        showSuccess('Policy instance deleted successfully');
      } else {
        throw new Error(errorData.message || 'Failed to delete policy instance');
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while deleting the policy instance');
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Calculate policy statistics for the client
  const calculateStats = useCallback(() => {
    if (!instances || instances.length === 0) {
      return {
        totalPolicies: 0,
        activePolicies: 0,
        totalPremium: 0,
        totalCommission: 0
      };
    }

    return {
      totalPolicies: instances.length,
      activePolicies: instances.filter(i => i.status === 'Active').length,
      totalPremium: instances.reduce((sum, i) => sum + i.premiumAmount, 0),
      totalCommission: instances.reduce((sum, i) => sum + i.commissionAmount, 0)
    };
  }, [instances]);

  return {
    instances,
    loading,
    error,
    operationLoading,
    refetch: fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    calculateStats
  };
}