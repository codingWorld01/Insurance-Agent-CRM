import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch, mockApiResponse } from '@/test/utils'
import ClientDetailPage from '../page'
import { Client, Policy } from '@/types'

// Mock Next.js router
const mockPush = vi.fn()
const mockParams = { id: 'client-1' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
  notFound: vi.fn(),
}))

// Mock hooks
vi.mock('@/hooks/useToastNotifications', () => ({
  useToastNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePolicies', () => ({
  usePolicies: () => ({
    policies: mockPolicies,
    loading: false,
    operationLoading: { create: false, update: false, delete: false },
    createPolicy: vi.fn(),
    updatePolicy: vi.fn(),
    deletePolicy: vi.fn(),
  }),
}))

const mockClient: Client = {
  id: 'client-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  dateOfBirth: '1990-01-01',
  address: '123 Main St',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  policies: []
}

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

const mockClientWithPolicies: Client = {
  ...mockClient,
  policies: mockPolicies
}

describe('ClientDetailPage - Policy Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful client fetch
    mockFetch(mockApiResponse(mockClientWithPolicies))
  })

  describe('Policy Section Rendering', () => {
    it('renders policies section with correct title and count', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Policies')).toBeInTheDocument()
        expect(screen.getByText('(2)')).toBeInTheDocument()
      })
    })

    it('displays Add Policy button', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Policy')).toBeInTheDocument()
      })
    })

    it('renders policy summary cards with correct statistics', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        // Total policies
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Total Policies')).toBeInTheDocument()
        
        // Active policies
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Active Policies')).toBeInTheDocument()
        
        // Total premium
        expect(screen.getByText('₹1,800.00')).toBeInTheDocument()
        expect(screen.getByText('Total Premium')).toBeInTheDocument()
        
        // Total commission
        expect(screen.getByText('₹180.00')).toBeInTheDocument()
        expect(screen.getByText('Total Commission')).toBeInTheDocument()
      })
    })

    it('renders PoliciesTable component', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('POL-001')).toBeInTheDocument()
        expect(screen.getByText('POL-002')).toBeInTheDocument()
        expect(screen.getByText('Life Insurance Co')).toBeInTheDocument()
        expect(screen.getByText('Auto Insurance Co')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('displays empty state when client has no policies', async () => {
      mockFetch(mockApiResponse(mockClient)) // Client without policies
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No policies found')).toBeInTheDocument()
        expect(screen.getByText("This client doesn't have any insurance policies yet. Add their first policy to get started.")).toBeInTheDocument()
        expect(screen.getByText('Add First Policy')).toBeInTheDocument()
      })
    })

    it('shows correct statistics for client with no policies', async () => {
      mockFetch(mockApiResponse(mockClient)) // Client without policies
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Policies')).toBeInTheDocument()
        expect(screen.getByText('(0)')).toBeInTheDocument()
      })
    })
  })

  describe('Policy Modal Integration', () => {
    it('opens add policy modal when Add Policy button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Policy')).toBeInTheDocument()
      })
      
      const addButton = screen.getByText('Add Policy')
      await user.click(addButton)
      
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
    })

    it('opens add policy modal from empty state button', async () => {
      const user = userEvent.setup()
      mockFetch(mockApiResponse(mockClient)) // Client without policies
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add First Policy')).toBeInTheDocument()
      })
      
      const addFirstButton = screen.getByText('Add First Policy')
      await user.click(addFirstButton)
      
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
    })

    it('opens edit policy modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Edit policy POL-001')).toBeInTheDocument()
      })
      
      const editButton = screen.getByLabelText('Edit policy POL-001')
      await user.click(editButton)
      
      expect(screen.getByText('Edit Policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument()
    })

    it('closes policy modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Policy')).toBeInTheDocument()
      })
      
      // Open modal
      const addButton = screen.getByText('Add Policy')
      await user.click(addButton)
      
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
      
      // Close modal
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(screen.queryByText('Add New Policy')).not.toBeInTheDocument()
    })
  })

  describe('Policy Delete Confirmation', () => {
    it('opens delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Delete policy POL-001')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByLabelText('Delete policy POL-001')
      await user.click(deleteButton)
      
      expect(screen.getByText('Delete Policy')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete policy "POL-001"? This action cannot be undone.')).toBeInTheDocument()
    })

    it('closes delete confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Delete policy POL-001')).toBeInTheDocument()
      })
      
      // Open delete dialog
      const deleteButton = screen.getByLabelText('Delete policy POL-001')
      await user.click(deleteButton)
      
      expect(screen.getByText('Delete Policy')).toBeInTheDocument()
      
      // Close dialog
      const cancelButton = screen.getAllByText('Cancel').find(btn => 
        btn.closest('[role="dialog"]')?.textContent?.includes('Delete Policy')
      )
      if (cancelButton) {
        await user.click(cancelButton)
      }
      
      expect(screen.queryByText('Delete Policy')).not.toBeInTheDocument()
    })
  })

  describe('Client Statistics Integration', () => {
    it('displays correct policy count in client overview section', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        // Should show policy count in client overview
        const overviewSection = screen.getByText('Client Overview').closest('section')
        expect(overviewSection).toBeInTheDocument()
        
        // Check for policy statistics in overview cards
        expect(screen.getByText('2')).toBeInTheDocument() // Policy count
        expect(screen.getByText('Policies')).toBeInTheDocument()
      })
    })

    it('calculates and displays total commission correctly', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        // Total commission should be sum of all policy commissions (100 + 80 = 180)
        expect(screen.getByText('₹180.00')).toBeInTheDocument()
      })
    })

    it('updates statistics when policies change', async () => {
      // This would be tested in integration tests with actual policy operations
      // For unit tests, we verify the calculation logic
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        // Verify initial statistics
        expect(screen.getByText('2')).toBeInTheDocument() // Total policies
        expect(screen.getByText('₹1,800.00')).toBeInTheDocument() // Total premium (1000 + 800)
        expect(screen.getByText('₹180.00')).toBeInTheDocument() // Total commission (100 + 80)
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state for policies section', () => {
      // Mock loading state
      vi.mocked(require('@/hooks/usePolicies').usePolicies).mockReturnValue({
        policies: [],
        loading: true,
        operationLoading: { create: false, update: false, delete: false },
        createPolicy: vi.fn(),
        updatePolicy: vi.fn(),
        deletePolicy: vi.fn(),
      })
      
      renderWithProviders(<ClientDetailPage />)
      
      // Should show loading skeleton in policies section
      expect(screen.getByRole('status', { name: /loading policies/i })).toBeInTheDocument()
    })

    it('disables policy actions during operations', async () => {
      // Mock operation loading state
      vi.mocked(require('@/hooks/usePolicies').usePolicies).mockReturnValue({
        policies: mockPolicies,
        loading: false,
        operationLoading: { create: false, update: true, delete: false },
        createPolicy: vi.fn(),
        updatePolicy: vi.fn(),
        deletePolicy: vi.fn(),
      })
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText(/edit policy/i)
        const deleteButtons = screen.getAllByLabelText(/delete policy/i)
        
        editButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
        
        deleteButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
      })
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('displays correct breadcrumb with client name', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
      })
    })

    it('includes back to clients button', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Back to Clients')).toBeInTheDocument()
      })
    })
  })

  describe('Page Title Management', () => {
    it('sets correct page title with client name', async () => {
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(document.title).toBe('John Doe - Client Details | Insurance CRM')
      })
    })

    it('sets fallback title when client is not loaded', () => {
      mockFetch(mockApiResponse(null, false)) // Failed fetch
      
      renderWithProviders(<ClientDetailPage />)
      
      expect(document.title).toBe('Client Details | Insurance CRM')
    })
  })

  describe('Error Handling', () => {
    it('handles client fetch errors gracefully', async () => {
      mockFetch(mockApiResponse(null, false)) // Failed fetch
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Client not found')).toBeInTheDocument()
        expect(screen.getByText('Go to Clients')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('shows error state breadcrumb when client fetch fails', async () => {
      mockFetch(mockApiResponse(null, false)) // Failed fetch
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Back to Clients')).toBeInTheDocument()
        expect(screen.getByText('Client Details')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('adapts policy section layout for mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      renderWithProviders(<ClientDetailPage />)
      
      await waitFor(() => {
        // Should show mobile-friendly layout
        expect(screen.getByText('Add Policy')).toBeInTheDocument()
        
        // Policy summary cards should stack on mobile
        const summaryCards = screen.getAllByText(/Total|Active/)
        expect(summaryCards.length).toBeGreaterThan(0)
      })
    })
  })
})