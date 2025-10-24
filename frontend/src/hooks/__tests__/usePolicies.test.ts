import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePolicies } from '../usePolicies'
import { mockFetch, mockApiResponse } from '@/test/utils'
import { Policy, CreatePolicyRequest } from '@/types'

// Mock toast notifications
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()

vi.mock('@/hooks/useToastNotifications', () => ({
  useToastNotifications: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}))

const mockPolicies: Policy[] = [
  {
    id: '1',
    policyNumber: 'POL-001',
    policyType: 'Life',
    provider: 'Life Insurance Co',
    premiumAmount: 1000,
    commissionAmount: 100,
    status: 'Active',
    startDate: '2024-01-01T00:00:00Z',
    expiryDate: '2025-01-01T00:00:00Z',
    clientId: 'client-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    policyNumber: 'POL-002',
    policyType: 'Auto',
    provider: 'Auto Insurance Co',
    premiumAmount: 800,
    commissionAmount: 80,
    status: 'Active',
    startDate: '2024-02-01T00:00:00Z',
    expiryDate: '2025-02-01T00:00:00Z',
    clientId: 'client-1',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
]

const mockCreatePolicyRequest: CreatePolicyRequest = {
  policyNumber: 'POL-003',
  policyType: 'Health',
  provider: 'Health Insurance Co',
  premiumAmount: 1200,
  commissionAmount: 120,
  startDate: '2024-03-01',
  expiryDate: '2025-03-01'
}

describe('usePolicies Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })
  })

  describe('Fetching Policies', () => {
    it('fetches policies for a specific client on mount', async () => {
      mockFetch(mockApiResponse({ policies: mockPolicies }))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toEqual(mockPolicies)
      })
      
      expect(global.fetch).toHaveBeenCalledWith('/api/policies?clientId=client-1', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('fetches all policies when no clientId provided', async () => {
      mockFetch(mockApiResponse({ policies: mockPolicies }))
      
      const { result } = renderHook(() => usePolicies({}))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toEqual(mockPolicies)
      })
      
      expect(global.fetch).toHaveBeenCalledWith('/api/policies', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('handles fetch errors gracefully', async () => {
      mockFetch(mockApiResponse(null, false))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toEqual([])
      })
      
      expect(mockShowError).toHaveBeenCalledWith('Failed to fetch policies')
    })

    it('handles network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toEqual([])
      })
      
      expect(mockShowError).toHaveBeenCalledWith('Failed to fetch policies')
    })
  })

  describe('Creating Policies', () => {
    it('creates a new policy successfully', async () => {
      const newPolicy = { ...mockPolicies[0], id: '3', policyNumber: 'POL-003' }
      mockFetch(mockApiResponse(newPolicy))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.operationLoading.create).toBe(false)
      
      // Create policy
      await result.current.createPolicy('client-1', mockCreatePolicyRequest)
      
      expect(global.fetch).toHaveBeenCalledWith('/api/clients/client-1/policies', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockCreatePolicyRequest)
      })
      
      expect(mockShowSuccess).toHaveBeenCalledWith('Policy created successfully')
    })

    it('sets loading state during policy creation', async () => {
      let resolveCreate: (value: unknown) => void
      const pendingCreate = new Promise(resolve => {
        resolveCreate = resolve
      })
      
      global.fetch = vi.fn().mockReturnValue(pendingCreate)
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Start create operation
      const createPromise = result.current.createPolicy('client-1', mockCreatePolicyRequest)
      
      // Should show loading state
      expect(result.current.operationLoading.create).toBe(true)
      
      // Resolve the promise
      resolveCreate!({
        ok: true,
        json: () => Promise.resolve(mockApiResponse({ id: '3', ...mockCreatePolicyRequest }))
      })
      
      await createPromise
      
      await waitFor(() => {
        expect(result.current.operationLoading.create).toBe(false)
      })
    })

    it('handles policy creation errors', async () => {
      mockFetch(mockApiResponse({ message: 'Policy number already exists' }, false))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await expect(result.current.createPolicy('client-1', mockCreatePolicyRequest))
        .rejects.toThrow('Policy number already exists')
      
      expect(mockShowError).toHaveBeenCalledWith('Policy number already exists')
    })

    it('handles validation errors during creation', async () => {
      const validationError = {
        message: 'Validation failed',
        errors: {
          policyNumber: 'Policy number is required',
          premiumAmount: 'Premium must be positive'
        }
      }
      mockFetch(mockApiResponse(validationError, false))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await expect(result.current.createPolicy('client-1', mockCreatePolicyRequest))
        .rejects.toThrow('Validation failed')
    })
  })

  describe('Updating Policies', () => {
    it('updates an existing policy successfully', async () => {
      const updatedPolicy = { ...mockPolicies[0], premiumAmount: 1500 }
      mockFetch(mockApiResponse(updatedPolicy))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const updateData = { premiumAmount: 1500 }
      await result.current.updatePolicy('1', updateData)
      
      expect(global.fetch).toHaveBeenCalledWith('/api/policies/1', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(mockShowSuccess).toHaveBeenCalledWith('Policy updated successfully')
    })

    it('sets loading state during policy update', async () => {
      let resolveUpdate: (value: unknown) => void
      const pendingUpdate = new Promise(resolve => {
        resolveUpdate = resolve
      })
      
      global.fetch = vi.fn().mockReturnValue(pendingUpdate)
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Start update operation
      const updatePromise = result.current.updatePolicy('1', { premiumAmount: 1500 })
      
      // Should show loading state
      expect(result.current.operationLoading.update).toBe(true)
      
      // Resolve the promise
      resolveUpdate!({
        ok: true,
        json: () => Promise.resolve(mockApiResponse({ ...mockPolicies[0], premiumAmount: 1500 }))
      })
      
      await updatePromise
      
      await waitFor(() => {
        expect(result.current.operationLoading.update).toBe(false)
      })
    })

    it('handles policy update errors', async () => {
      mockFetch(mockApiResponse({ message: 'Policy not found' }, false))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await expect(result.current.updatePolicy('999', { premiumAmount: 1500 }))
        .rejects.toThrow('Policy not found')
      
      expect(mockShowError).toHaveBeenCalledWith('Policy not found')
    })
  })

  describe('Deleting Policies', () => {
    it('deletes a policy successfully', async () => {
      mockFetch(mockApiResponse({ message: 'Policy deleted successfully' }))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await result.current.deletePolicy('1')
      
      expect(global.fetch).toHaveBeenCalledWith('/api/policies/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
      
      expect(mockShowSuccess).toHaveBeenCalledWith('Policy deleted successfully')
    })

    it('sets loading state during policy deletion', async () => {
      let resolveDelete: (value: unknown) => void
      const pendingDelete = new Promise(resolve => {
        resolveDelete = resolve
      })
      
      global.fetch = vi.fn().mockReturnValue(pendingDelete)
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Start delete operation
      const deletePromise = result.current.deletePolicy('1')
      
      // Should show loading state
      expect(result.current.operationLoading.delete).toBe(true)
      
      // Resolve the promise
      resolveDelete!({
        ok: true,
        json: () => Promise.resolve(mockApiResponse({ message: 'Policy deleted successfully' }))
      })
      
      await deletePromise
      
      await waitFor(() => {
        expect(result.current.operationLoading.delete).toBe(false)
      })
    })

    it('handles policy deletion errors', async () => {
      mockFetch(mockApiResponse({ message: 'Cannot delete policy with active claims' }, false))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await expect(result.current.deletePolicy('1'))
        .rejects.toThrow('Cannot delete policy with active claims')
      
      expect(mockShowError).toHaveBeenCalledWith('Cannot delete policy with active claims')
    })
  })

  describe('Policy Statistics', () => {
    it('calculates policy statistics correctly', async () => {
      mockFetch(mockApiResponse({ 
        policies: mockPolicies,
        stats: {
          totalPolicies: 2,
          activePolicies: 2,
          totalPremium: 1800,
          totalCommission: 180,
          expiringPolicies: []
        }
      }))
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toHaveLength(2)
      })
      
      // Verify statistics are available (would be calculated in the component using the hook)
      expect(result.current.policies.reduce((sum, p) => sum + p.premiumAmount, 0)).toBe(1800)
      expect(result.current.policies.reduce((sum, p) => sum + p.commissionAmount, 0)).toBe(180)
      expect(result.current.policies.filter(p => p.status === 'Active')).toHaveLength(2)
    })
  })

  describe('Error Recovery', () => {
    it('retries failed operations', async () => {
      // First call fails, second succeeds
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse({ policies: mockPolicies }))
        })
      
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.policies).toEqual([])
      })
      
      // Retry by calling fetchPolicies again (would be triggered by user action)
      await result.current.fetchPolicies()
      
      await waitFor(() => {
        expect(result.current.policies).toEqual(mockPolicies)
      })
    })
  })

  describe('Concurrent Operations', () => {
    it('handles multiple concurrent operations correctly', async () => {
      const { result } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Mock different responses for different operations
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse({ id: '3', ...mockCreatePolicyRequest }))
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse({ ...mockPolicies[0], premiumAmount: 1500 }))
        })
      
      // Start concurrent operations
      const createPromise = result.current.createPolicy('client-1', mockCreatePolicyRequest)
      const updatePromise = result.current.updatePolicy('1', { premiumAmount: 1500 })
      
      // Both should show loading states
      expect(result.current.operationLoading.create).toBe(true)
      expect(result.current.operationLoading.update).toBe(true)
      
      await Promise.all([createPromise, updatePromise])
      
      await waitFor(() => {
        expect(result.current.operationLoading.create).toBe(false)
        expect(result.current.operationLoading.update).toBe(false)
      })
    })
  })

  describe('Memory Management', () => {
    it('cleans up properly when unmounted', async () => {
      const { result, unmount } = renderHook(() => usePolicies({ clientId: 'client-1' }))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Unmount should not cause any errors
      expect(() => unmount()).not.toThrow()
    })
  })
})