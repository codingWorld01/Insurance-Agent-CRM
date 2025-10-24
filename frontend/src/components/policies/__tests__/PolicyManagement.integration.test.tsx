import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch, mockApiResponse } from '@/test/utils'
import { PolicyModal } from '../PolicyModal'
import { PoliciesTable } from '../PoliciesTable'
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
  }
]

describe('Policy Management Integration', () => {
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

  describe('Policy Creation Workflow', () => {
    it('completes full policy creation workflow successfully', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out the form
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      
      // Select policy type
      const policyTypeSelect = screen.getByRole('combobox')
      await user.click(policyTypeSelect)
      await user.click(screen.getByText('Health'))
      
      await user.type(screen.getByLabelText('Provider *'), 'Health Insurance Co')
      await user.type(screen.getByLabelText('Premium Amount *'), '1200')
      await user.type(screen.getByLabelText('Commission Amount *'), '120')
      await user.type(screen.getByLabelText('Start Date *'), '2024-03-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-03-01')

      // Submit the form
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          policyNumber: 'POL-123',
          policyType: 'Health',
          provider: 'Health Insurance Co',
          premiumAmount: 1200,
          commissionAmount: 120,
          startDate: '2024-03-01',
          expiryDate: '2025-03-01'
        })
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('handles validation errors during policy creation', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Submit form without filling required fields
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Policy number is required')).toBeInTheDocument()
        expect(screen.getByText('Provider is required')).toBeInTheDocument()
        expect(screen.getByText('Start date is required')).toBeInTheDocument()
        expect(screen.getByText('Expiry date is required')).toBeInTheDocument()
        expect(screen.getByText('Premium amount must be greater than 0')).toBeInTheDocument()
        expect(screen.getByText('Commission amount must be greater than 0')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('handles API errors during policy creation', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Policy number already exists'))
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out form with valid data
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-001') // Duplicate
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('This policy number already exists')).toBeInTheDocument()
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Policy Update Workflow', () => {
    it('completes full policy update workflow successfully', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={mockPolicies[0]}
        />
      )

      // Verify form is pre-filled
      expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Life Insurance Co')).toBeInTheDocument()

      // Update premium amount
      const premiumInput = screen.getByLabelText('Premium Amount *')
      await user.clear(premiumInput)
      await user.type(premiumInput, '1500')

      // Submit the form
      const submitButton = screen.getByText('Update Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          policyNumber: 'POL-001',
          policyType: 'Life',
          provider: 'Life Insurance Co',
          premiumAmount: 1500,
          commissionAmount: 100,
          startDate: '2024-01-01',
          expiryDate: '2025-01-01'
        })
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('validates date changes during policy update', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={mockPolicies[0]}
        />
      )

      // Change expiry date to be before start date
      const expiryInput = screen.getByLabelText('Expiry Date *')
      await user.clear(expiryInput)
      await user.type(expiryInput, '2023-01-01')

      await waitFor(() => {
        expect(screen.getByText('Expiry date must be after start date')).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Update Policy')
      await user.click(submitButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Policy Table Interactions', () => {
    it('handles policy edit action correctly', async () => {
      const user = userEvent.setup()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByLabelText('Edit policy POL-001')
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockPolicies[0])
    })

    it('handles policy delete action correctly', async () => {
      const user = userEvent.setup()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByLabelText('Delete policy POL-001')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(mockPolicies[0])
    })

    it('disables actions during loading operations', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: false, update: true, delete: false }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByLabelText('Edit policy POL-001')
      const deleteButton = screen.getByLabelText('Delete policy POL-001')

      expect(editButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('recovers from network errors gracefully', async () => {
      const user = userEvent.setup()
      let callCount = 0
      const mockOnSubmit = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve()
      })
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out form
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      // First submission fails
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Dismiss error and retry
      const dismissButton = screen.getByLabelText('Dismiss error')
      await user.click(dismissButton)

      expect(screen.queryByText('Network error')).not.toBeInTheDocument()

      // Second submission succeeds
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('handles validation errors from server', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Invalid date range'))
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out form with data that passes client validation but fails server validation
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Expiry date must be after start date')).toBeInTheDocument()
      })

      // Error should be displayed inline with the field
      const expiryInput = screen.getByLabelText('Expiry Date *')
      expect(expiryInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Loading State Management', () => {
    it('shows loading states during form submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: (value: unknown) => void
      const pendingSubmit = new Promise(resolve => {
        resolveSubmit = resolve
      })
      const mockOnSubmit = vi.fn(() => pendingSubmit)
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out form
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Cancel')).toBeDisabled()

      // Resolve the promise
      resolveSubmit!(undefined)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows loading states in policies table', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('status', { name: /loading policies/i })).toBeInTheDocument()
      expect(screen.getByText('Loading policies...')).toBeInTheDocument()
    })
  })

  describe('Form State Management', () => {
    it('resets form state when switching between add and edit modes', () => {
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      const { rerender } = renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Should show add mode
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy Number *')).toHaveValue('')

      // Switch to edit mode
      rerender(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={mockPolicies[0]}
        />
      )

      // Should show edit mode with pre-filled data
      expect(screen.getByText('Edit Policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument()

      // Switch back to add mode
      rerender(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={null}
        />
      )

      // Should reset to add mode
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy Number *')).toHaveValue('')
    })

    it('preserves form state during validation errors', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out partial form
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')

      // Submit with missing fields
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Start date is required')).toBeInTheDocument()
      })

      // Form should preserve entered values
      expect(screen.getByDisplayValue('POL-123')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Insurance')).toBeInTheDocument()
    })
  })

  describe('Currency Input Handling', () => {
    it('handles currency input formatting correctly', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const premiumInput = screen.getByLabelText('Premium Amount *')
      
      // Type currency with various formats
      await user.type(premiumInput, '1,234.56')
      expect(premiumInput).toHaveValue('1,234.56')

      await user.clear(premiumInput)
      await user.type(premiumInput, '1234')
      expect(premiumInput).toHaveValue('1234')

      await user.clear(premiumInput)
      await user.type(premiumInput, '1234.5')
      expect(premiumInput).toHaveValue('1234.5')
    })

    it('rejects invalid currency input', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const premiumInput = screen.getByLabelText('Premium Amount *')
      
      // Try to type invalid characters
      await user.type(premiumInput, 'abc123def')
      
      // Should only show numeric characters
      expect(premiumInput).toHaveValue('123')
    })
  })
})