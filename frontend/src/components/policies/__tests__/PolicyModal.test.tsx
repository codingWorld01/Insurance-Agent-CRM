import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { PolicyModal } from '../PolicyModal'
import { Policy, CreatePolicyRequest } from '@/types'

const mockOnSubmit = vi.fn()
const mockOnClose = vi.fn()

const mockPolicy: Policy = {
  id: '1',
  policyNumber: 'POL-001',
  policyType: 'Life',
  provider: 'Test Insurance Co',
  premiumAmount: 1000,
  commissionAmount: 100,
  status: 'Active',
  startDate: '2024-01-01T00:00:00Z',
  expiryDate: '2025-01-01T00:00:00Z',
  clientId: 'client-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('PolicyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders add policy modal correctly', () => {
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      expect(screen.getByText('Add New Policy')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy Number *')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy Type *')).toBeInTheDocument()
      expect(screen.getByLabelText('Provider *')).toBeInTheDocument()
      expect(screen.getByLabelText('Premium Amount *')).toBeInTheDocument()
      expect(screen.getByLabelText('Commission Amount *')).toBeInTheDocument()
      expect(screen.getByLabelText('Start Date *')).toBeInTheDocument()
      expect(screen.getByLabelText('Expiry Date *')).toBeInTheDocument()
      expect(screen.getByText('Create Policy')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders edit policy modal with pre-filled data', () => {
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={mockPolicy}
        />
      )
      
      expect(screen.getByText('Edit Policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Insurance Co')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument()
      expect(screen.getByText('Update Policy')).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
      renderWithProviders(
        <PolicyModal 
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      expect(screen.queryByText('Add New Policy')).not.toBeInTheDocument()
    })

    it('shows loading state when loading prop is true', () => {
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={true}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /create policy/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
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
    })

    it('validates premium amount is positive', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const premiumInput = screen.getByLabelText('Premium Amount *')
      await user.clear(premiumInput)
      await user.type(premiumInput, '0')
      
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Premium amount must be greater than 0')).toBeInTheDocument()
      })
    })

    it('validates commission amount is positive', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const commissionInput = screen.getByLabelText('Commission Amount *')
      await user.clear(commissionInput)
      await user.type(commissionInput, '-10')
      
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Commission amount must be greater than 0')).toBeInTheDocument()
      })
    })

    it('validates date range (expiry after start)', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const startDateInput = screen.getByLabelText('Start Date *')
      const expiryDateInput = screen.getByLabelText('Expiry Date *')
      
      await user.type(startDateInput, '2024-12-01')
      await user.type(expiryDateInput, '2024-01-01')
      
      await waitFor(() => {
        expect(screen.getByText('Expiry date must be after start date')).toBeInTheDocument()
      })
    })

    it('clears validation errors when user starts typing', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Trigger validation error
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Policy number is required')).toBeInTheDocument()
      })
      
      // Start typing to clear error
      const policyNumberInput = screen.getByLabelText('Policy Number *')
      await user.type(policyNumberInput, 'POL-123')
      
      await waitFor(() => {
        expect(screen.queryByText('Policy number is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Currency Formatting', () => {
    it('formats currency input correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const premiumInput = screen.getByLabelText('Premium Amount *')
      await user.type(premiumInput, '1234.56')
      
      expect(premiumInput).toHaveValue('1234.56')
    })

    it('handles invalid currency input gracefully', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const premiumInput = screen.getByLabelText('Premium Amount *')
      await user.type(premiumInput, 'abc123')
      
      // Should only show numeric characters
      expect(premiumInput).toHaveValue('123')
    })
  })

  describe('Policy Type Selection', () => {
    it('allows selecting different policy types', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const policyTypeSelect = screen.getByRole('combobox')
      await user.click(policyTypeSelect)
      
      const healthOption = screen.getByText('Health')
      await user.click(healthOption)
      
      expect(screen.getByDisplayValue('Health')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      
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
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          policyNumber: 'POL-123',
          policyType: 'Life', // Default value
          provider: 'Test Insurance',
          premiumAmount: 1000,
          commissionAmount: 100,
          startDate: '2024-01-01',
          expiryDate: '2025-01-01'
        })
      })
    })

    it('shows submitting state during form submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: (value: unknown) => void
      const pendingSubmit = new Promise(resolve => {
        resolveSubmit = resolve
      })
      
      const mockSubmitWithDelay = vi.fn(() => pendingSubmit)
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockSubmitWithDelay}
        />
      )
      
      // Fill out form with valid data
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
      
      // Resolve the promise
      resolveSubmit!(undefined)
    })
  })

  describe('Error Handling', () => {
    it('displays API errors correctly', async () => {
      const user = userEvent.setup()
      const mockSubmitWithError = vi.fn().mockRejectedValue(new Error('Policy number already exists'))
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockSubmitWithError}
        />
      )
      
      // Fill out form with valid data
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
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
    })

    it('displays date range validation errors from API', async () => {
      const user = userEvent.setup()
      const mockSubmitWithError = vi.fn().mockRejectedValue(new Error('Invalid date range'))
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockSubmitWithError}
        />
      )
      
      // Fill out form with valid data
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
    })

    it('can dismiss API error messages', async () => {
      const user = userEvent.setup()
      const mockSubmitWithError = vi.fn().mockRejectedValue(new Error('Server error'))
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockSubmitWithError}
        />
      )
      
      // Fill out form and trigger error
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')
      
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
      
      // Dismiss error
      const dismissButton = screen.getByLabelText('Dismiss error')
      await user.click(dismissButton)
      
      expect(screen.queryByText('Server error')).not.toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('resets form when modal opens in add mode', () => {
      const { rerender } = renderWithProviders(
        <PolicyModal 
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Open modal
      rerender(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      expect(screen.getByLabelText('Policy Number *')).toHaveValue('')
      expect(screen.getByLabelText('Provider *')).toHaveValue('')
    })

    it('populates form when modal opens in edit mode', () => {
      const { rerender } = renderWithProviders(
        <PolicyModal 
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Open modal with policy data
      rerender(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          policy={mockPolicy}
        />
      )
      
      expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Insurance Co')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy Number *')).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText('Provider *')).toHaveAttribute('aria-required', 'true')
    })

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PolicyModal 
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
      
      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)
      
      await waitFor(() => {
        const policyNumberInput = screen.getByLabelText('Policy Number *')
        expect(policyNumberInput).toHaveAttribute('aria-invalid', 'true')
        expect(policyNumberInput).toHaveAttribute('aria-describedby', 'policy-number-error')
      })
    })
  })
})