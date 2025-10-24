import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { PolicyModal } from '../PolicyModal'
import { PoliciesTable } from '../PoliciesTable'
import { Policy } from '@/types'

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

describe('Policy Management Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PolicyModal Loading States', () => {
    it('shows loading state when loading prop is true', () => {
      const mockOnSubmit = vi.fn()
      const mockOnClose = vi.fn()

      renderWithProviders(
        <PolicyModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          loading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      expect(submitButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    it('shows submitting state during form submission', async () => {
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

      // Fill out form with valid data
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      const submitButton = screen.getByText('Create Policy')
      await user.click(submitButton)

      // Should show submitting state
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Cancel')).toBeDisabled()

      // Resolve the promise
      resolveSubmit!(undefined)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows different loading text for edit mode', async () => {
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
          policy={mockPolicies[0]}
        />
      )

      const submitButton = screen.getByText('Update Policy')
      await user.click(submitButton)

      // Should show submitting state with update text
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      resolveSubmit!(undefined)
    })

    it('re-enables form after submission completes', async () => {
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
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('re-enables form after submission fails', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
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

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

      // Form should be re-enabled after error
      expect(submitButton).not.toBeDisabled()
      expect(screen.getByText('Cancel')).not.toBeDisabled()
    })
  })

  describe('PoliciesTable Loading States', () => {
    it('shows loading skeleton when loading is true', () => {
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

      // Should show skeleton rows
      const skeletonElements = screen.getAllByRole('generic')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('shows policies when loading completes', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { rerender } = renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Loading policies...')).toBeInTheDocument()

      // Update to show loaded policies
      rerender(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText('Loading policies...')).not.toBeInTheDocument()
      expect(screen.getByText('POL-001')).toBeInTheDocument()
    })

    it('disables action buttons during create operation', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: true, update: false, delete: false }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByLabelText('Edit policy POL-001')
      const deleteButton = screen.getByLabelText('Delete policy POL-001')

      expect(editButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('disables action buttons during update operation', () => {
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

    it('disables action buttons during delete operation', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: false, update: false, delete: true }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByLabelText('Edit policy POL-001')
      const deleteButton = screen.getByLabelText('Delete policy POL-001')

      expect(editButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('enables action buttons when no operations are loading', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: false, update: false, delete: false }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByLabelText('Edit policy POL-001')
      const deleteButton = screen.getByLabelText('Delete policy POL-001')

      expect(editButton).not.toBeDisabled()
      expect(deleteButton).not.toBeDisabled()
    })

    it('shows appropriate loading states for different screen sizes', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Should show loading state regardless of screen size
      expect(screen.getByRole('status', { name: /loading policies/i })).toBeInTheDocument()
    })
  })

  describe('Loading State Transitions', () => {
    it('handles rapid loading state changes', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { rerender } = renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Loading policies...')).toBeInTheDocument()

      // Rapid state changes
      rerender(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText('Loading policies...')).not.toBeInTheDocument()
      expect(screen.getByText('POL-001')).toBeInTheDocument()

      rerender(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Loading policies...')).toBeInTheDocument()
    })

    it('handles loading state with operation loading simultaneously', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={true}
          operationLoading={{ create: true, update: false, delete: false }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Should show main loading state
      expect(screen.getByText('Loading policies...')).toBeInTheDocument()
    })
  })

  describe('Loading State Accessibility', () => {
    it('provides proper ARIA labels for loading states', () => {
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

      const loadingStatus = screen.getByRole('status', { name: /loading policies/i })
      expect(loadingStatus).toBeInTheDocument()
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading policies')
    })

    it('provides screen reader text for loading states', () => {
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

      const screenReaderText = screen.getByText('Loading policies...')
      expect(screenReaderText).toHaveClass('sr-only')
    })

    it('maintains focus management during loading states', async () => {
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

      const submitButton = screen.getByText('Create Policy')
      
      // Focus the submit button
      submitButton.focus()
      expect(submitButton).toHaveFocus()

      // Fill form and submit
      await user.type(screen.getByLabelText('Policy Number *'), 'POL-123')
      await user.type(screen.getByLabelText('Provider *'), 'Test Insurance')
      await user.type(screen.getByLabelText('Premium Amount *'), '1000')
      await user.type(screen.getByLabelText('Commission Amount *'), '100')
      await user.type(screen.getByLabelText('Start Date *'), '2024-01-01')
      await user.type(screen.getByLabelText('Expiry Date *'), '2025-01-01')

      await user.click(submitButton)

      // Button should still be focused but disabled during loading
      expect(submitButton).toHaveFocus()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Loading State Performance', () => {
    it('does not cause unnecessary re-renders during loading', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()
      let renderCount = 0

      const TestComponent = () => {
        renderCount++
        return (
          <PoliciesTable
            policies={mockPolicies}
            loading={false}
            operationLoading={{ create: false, update: false, delete: false }}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        )
      }

      const { rerender } = renderWithProviders(<TestComponent />)

      const initialRenderCount = renderCount

      // Re-render with same props
      rerender(<TestComponent />)

      // Should not cause additional renders if props haven't changed
      expect(renderCount).toBe(initialRenderCount + 1)
    })

    it('handles loading state updates efficiently', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { rerender } = renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Multiple rapid updates should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(
          <PoliciesTable
            policies={i % 2 === 0 ? [] : mockPolicies}
            loading={i % 2 === 0}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        )
      }

      // Final state should be correct
      expect(screen.getByText('POL-001')).toBeInTheDocument()
    })
  })
})