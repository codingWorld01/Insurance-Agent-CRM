import { useState, useEffect, useCallback } from 'react';
import { Client, CreateClientRequest, ClientWithPolicies, Policy } from '@/types';
import { useToastNotifications } from './useToastNotifications';
import { useDashboardRefresh } from '@/context/DashboardContext';
import { isAuthError, handleAuthError } from '@/utils/authErrorHandler';
import { useRouter } from 'next/navigation';

interface UseClientsOptions {
  page?: number;
  limit?: number;
  search?: string;
  includePolicies?: boolean;
}

export function useClients(options: UseClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsWithPolicies, setClientsWithPolicies] = useState<ClientWithPolicies[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToastNotifications();
  const { refreshStats } = useDashboardRefresh();
  const router = useRouter();

  const enrichClientWithPolicyStats = useCallback((client: Client): ClientWithPolicies => {
    const policies = client.policies || [];
    const activePolicies = policies.filter(p => p.status === 'Active');
    
    return {
      ...client,
      policies,
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      totalPremium: policies.reduce((sum, p) => sum + p.premiumAmount, 0),
      totalCommission: policies.reduce((sum, p) => sum + p.commissionAmount, 0)
    };
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.search) params.append('search', options.search);
      if (options.includePolicies) params.append('includePolicies', 'true');

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const result = await response.json();
      if (result.success) {
        if (options.includePolicies) {
          const enrichedClients = result.data.clients.map((client: Client) => 
            enrichClientWithPolicyStats(client)
          );
          setClientsWithPolicies(enrichedClients);
        } else {
          setClients(result.data.clients);
        }
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || 'Failed to fetch clients');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      showError(errorMessage, 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.search, options.includePolicies, showError, enrichClientWithPolicyStats, router]);

  const getClientById = async (id: string, includePolicies = false): Promise<ClientWithPolicies | Client | null> => {
    try {
      const params = new URLSearchParams();
      if (includePolicies) params.append('includePolicies', 'true');

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clients/${id}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const result = await response.json();
      if (result.success) {
        if (includePolicies) {
          return enrichClientWithPolicyStats(result.data);
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch client');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showError(errorMessage, 'Failed to load client');
      return null;
    }
  };

  const getClientPolicies = async (clientId: string): Promise<Policy[]> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clients/${clientId}/policies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client policies');
      }

      const result = await response.json();
      if (result.success) {
        return result.data.policies || [];
      } else {
        throw new Error(result.message || 'Failed to fetch client policies');
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return [];
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showError(errorMessage, 'Failed to load client policies');
      return [];
    }
  };

  const refreshClientPolicies = async (clientId: string): Promise<void> => {
    // If we're tracking clients with policies, refresh that specific client
    if (options.includePolicies) {
      const updatedClient = await getClientById(clientId, true);
      if (updatedClient) {
        setClientsWithPolicies(prev => 
          prev.map(client => 
            client.id === clientId ? updatedClient as ClientWithPolicies : client
          )
        );
      }
    }
  };

  const createClient = async (clientData: CreateClientRequest): Promise<Client> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create client');
    }

    const result = await response.json();
    if (result.success) {
      // Refresh the clients list
      await fetchClients();
      // Trigger dashboard statistics refresh
      await refreshStats();
      showSuccess(`Client "${result.data.name}" has been created successfully`);
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to create client');
    }
  };

  const updateClient = async (id: string, clientData: Partial<CreateClientRequest>): Promise<Client> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.message || 'Failed to update client';
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.success) {
      // Refresh the clients list
      await fetchClients();
      // Trigger dashboard statistics refresh
      await refreshStats();
      showSuccess(`Client "${result.data.name}" has been updated successfully`);
      return result.data;
    } else {
      const errorMessage = result.message || 'Failed to update client';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.message || 'Failed to delete client';
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.success) {
      // Refresh the clients list
      await fetchClients();
      // Trigger dashboard statistics refresh
      await refreshStats();
      showSuccess('Client has been deleted successfully');
    } else {
      const errorMessage = result.message || 'Failed to delete client';
      showError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients: options.includePolicies ? clientsWithPolicies : clients,
    clientsWithPolicies,
    pagination,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientPolicies,
    refreshClientPolicies,
    enrichClientWithPolicyStats
  };
}