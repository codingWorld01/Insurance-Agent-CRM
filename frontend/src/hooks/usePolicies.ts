import { useState, useEffect, useCallback } from 'react';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest, PolicyStats, PolicyWithClientInfo } from '@/types';
import { useToastNotifications } from './useToastNotifications';
import { useDashboardRefresh } from '@/context/DashboardContext';
import { isAuthError, handleAuthError } from '@/utils/authErrorHandler';
import { useRouter } from 'next/navigation';

interface UsePoliciesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Active' | 'Expired';
  clientId?: string;
}

export function usePolicies(options: UsePoliciesOptions = {}) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [stats, setStats] = useState<PolicyStats>({
    totalPolicies: 0,
    activePolicies: 0,
    expiredPolicies: 0,
    cancelledPolicies: 0,
    totalPremium: 0,
    totalCommission: 0,
    policiesByType: {
      Life: 0,
      Health: 0,
      Auto: 0,
      Home: 0,
      Business: 0
    },
    expiringPolicies: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<{
    create: boolean;
    update: boolean;
    delete: boolean;
  }>({
    create: false,
    update: false,
    delete: false
  });
  const { showSuccess, showError } = useToastNotifications();
  const { refreshStats } = useDashboardRefresh();
  const router = useRouter();

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.search) params.append('search', options.search);
      if (options.status) params.append('status', options.status);
      if (options.clientId) params.append('clientId', options.clientId);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/policies?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const result = await response.json();
      if (result.success) {
        setPolicies(result.data.policies);
        setPagination(result.data.pagination);
        if (result.data.stats) {
          setStats(result.data.stats);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch policies');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      showError(errorMessage, 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.search, options.status, options.clientId, showError, router]);

  const createPolicy = async (clientId: string, policyData: CreatePolicyRequest): Promise<Policy> => {
    setOperationLoading(prev => ({ ...prev, create: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/clients/${clientId}/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Invalid policy data. Please check your inputs.');
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to create policies for this client.');
          case 409:
            throw new Error(errorData.message || 'Policy number already exists. Please use a different number.');
          case 422:
            throw new Error(errorData.message || 'Invalid policy information. Please check all fields.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to create policy. Please try again.');
        }
      }

      if (errorData.success) {
        // Refresh the policies list
        await fetchPolicies();
        // Trigger dashboard statistics refresh
        await refreshStats();
        showSuccess(`Policy "${errorData.data.policyNumber}" has been created successfully`);
        return errorData.data;
      } else {
        throw new Error(errorData.message || 'Failed to create policy');
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
      throw new Error('An unexpected error occurred while creating the policy');
    } finally {
      setOperationLoading(prev => ({ ...prev, create: false }));
    }
  };

  const updatePolicy = async (id: string, policyData: UpdatePolicyRequest): Promise<Policy> => {
    setOperationLoading(prev => ({ ...prev, update: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/policies/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Invalid policy data. Please check your inputs.');
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to update this policy.');
          case 404:
            throw new Error('Policy not found. It may have been deleted.');
          case 409:
            throw new Error(errorData.message || 'Policy number already exists. Please use a different number.');
          case 422:
            throw new Error(errorData.message || 'Invalid policy information. Please check all fields.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to update policy. Please try again.');
        }
      }

      if (errorData.success) {
        // Refresh the policies list
        await fetchPolicies();
        // Trigger dashboard statistics refresh
        await refreshStats();
        showSuccess(`Policy "${errorData.data.policyNumber}" has been updated successfully`);
        return errorData.data;
      } else {
        throw new Error(errorData.message || 'Failed to update policy');
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
      throw new Error('An unexpected error occurred while updating the policy');
    } finally {
      setOperationLoading(prev => ({ ...prev, update: false }));
    }
  };

  const deletePolicy = async (id: string): Promise<void> => {
    setOperationLoading(prev => ({ ...prev, delete: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/policies/${id}`, {
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
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to delete this policy.');
          case 404:
            throw new Error('Policy not found. It may have already been deleted.');
          case 409:
            throw new Error('Cannot delete policy. It may have active claims or dependencies.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorData.message || 'Failed to delete policy. Please try again.');
        }
      }

      if (errorData.success) {
        // Refresh the policies list
        await fetchPolicies();
        // Trigger dashboard statistics refresh
        await refreshStats();
        showSuccess('Policy has been deleted successfully');
      } else {
        throw new Error(errorData.message || 'Failed to delete policy');
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
      throw new Error('An unexpected error occurred while deleting the policy');
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const getPolicyById = async (id: string): Promise<PolicyWithClientInfo | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/policies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch policy');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showError(errorMessage, 'Failed to load policy');
      return null;
    }
  };

  const calculateStats = useCallback((policyList: Policy[]): PolicyStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stats: PolicyStats = {
      totalPolicies: policyList.length,
      activePolicies: 0,
      expiredPolicies: 0,
      cancelledPolicies: 0,
      totalPremium: 0,
      totalCommission: 0,
      policiesByType: {
        Life: 0,
        Health: 0,
        Auto: 0,
        Home: 0,
        Business: 0
      },
      expiringPolicies: []
    };

    policyList.forEach(policy => {
      // Count by status
      if (policy.status === 'Active') {
        stats.activePolicies++;
      } else if (policy.status === 'Expired') {
        stats.expiredPolicies++;
      } else if (policy.status === 'Cancelled') {
        stats.cancelledPolicies++;
      }

      // Sum amounts
      stats.totalPremium += policy.premiumAmount;
      stats.totalCommission += policy.commissionAmount;

      // Count by type
      stats.policiesByType[policy.policyType]++;

      // Check for expiring policies (within 30 days and still active)
      const expiryDate = new Date(policy.expiryDate);
      if (policy.status === 'Active' && expiryDate <= thirtyDaysFromNow && expiryDate > now) {
        // Convert Policy to PolicyWithClientInfo for expiringPolicies array
        const policyWithClient: PolicyWithClientInfo = {
          ...policy,
          client: {
            id: policy.client?.id || '',
            name: policy.client?.name || '',
            email: policy.client?.email || '',
            phone: (policy.client as { phone?: string })?.phone || ''
          }
        };
        stats.expiringPolicies.push(policyWithClient);
      }
    });

    return stats;
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Update stats when policies change
  useEffect(() => {
    if (policies.length > 0) {
      const calculatedStats = calculateStats(policies);
      setStats(calculatedStats);
    }
  }, [policies, calculateStats]);

  return {
    policies,
    stats,
    pagination,
    loading,
    error,
    operationLoading,
    refetch: fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    getPolicyById,
    calculateStats
  };
}