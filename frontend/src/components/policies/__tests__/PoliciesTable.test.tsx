import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { PoliciesTable } from '../PoliciesTable'
import { Policy } from '@/types'

const mockOnEdit = vi.fn()
const mockOnDelete = vi.fn()

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
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    clientId: 'client-1',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    policyNumber: 'POL-003',
    policyType: 'Health',
    provider: 'Health Insurance Co',
    premiumAmount: 1200,
    commissionAmount: 120,
    status: 'Expired',
    startDate: '2023-01-01T00:00:00Z',
    expiryDate: '2024-01-01T00:00:00Z',
    clientId: 'client-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

describe('PoliciesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('displays loading skeleton when loading is true', () => {
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
      const skeletonRows = screen.getAllByRole('generic')
      expect(skeletonRows.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no policies exist', () => {
      renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('No policies found')).toBeInTheDocument()
      expect(screen.getByText('Add a policy to get started')).toBeInTheDocument()
    })
  })

  describe('Desktop Table View', () => {
    beforeEach(() => {
      // Mock window.innerWidth to simulate desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
    })

    it('renders policies in table format on desktop', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Check table headers
      expect(screen.getByText('Policy Number')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Provider')).toBeInTheDocument()
      expect(screen.getByText('Premium')).toBeInTheDocument()
      expect(screen.getByText('Commission')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('Expiry Date')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
      
      // Check policy data
      expect(screen.getByText('POL-001')).toBeInTheDocument()
      expect(screen.getByText('Life Insurance Co')).toBeInTheDocument()
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument()
      expect(screen.getByText('₹100.00')).toBeInTheDocument()
    })

    it('displays policy status badges correctly', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should show active and expired badges
      expect(screen.getAllByText('Active')).toHaveLength(2)
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('shows expiry warnings for policies expiring soon', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should show warning icon for policy expiring in 15 days
      const warningIcons = screen.getAllByTestId('alert-triangle')
      expect(warningIcons.length).toBeGreaterThan(0)
    })

    it('formats dates correctly', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument()
    })

    it('formats currency amounts correctly', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument()
      expect(screen.getByText('₹800.00')).toBeInTheDocument()
      expect(screen.getByText('₹1,200.00')).toBeInTheDocument()
      expect(screen.getByText('₹100.00')).toBeInTheDocument()
      expect(screen.getByText('₹80.00')).toBeInTheDocument()
      expect(screen.getByText('₹120.00')).toBeInTheDocument()
    })
  })

  describe('Mobile Card View', () => {
    beforeEach(() => {
      // Mock window.innerWidth to simulate mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
    })

    it('renders policies in card format on mobile', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should show policy numbers as card headers
      expect(screen.getByText('POL-001')).toBeInTheDocument()
      expect(screen.getByText('POL-002')).toBeInTheDocument()
      expect(screen.getByText('POL-003')).toBeInTheDocument()
      
      // Should show policy types and providers
      expect(screen.getByText('Life • Life Insurance Co')).toBeInTheDocument()
      expect(screen.getByText('Auto • Auto Insurance Co')).toBeInTheDocument()
      expect(screen.getByText('Health • Health Insurance Co')).toBeInTheDocument()
    })

    it('shows expiry warnings in mobile cards', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should show warning for policy expiring soon
      const warningIcons = screen.getAllByTestId('alert-triangle')
      expect(warningIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Action Buttons', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const editButtons = screen.getAllByLabelText(/edit policy/i)
      await user.click(editButtons[0])
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockPolicies[0])
    })

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const deleteButtons = screen.getAllByLabelText(/delete policy/i)
      await user.click(deleteButtons[0])
      
      expect(mockOnDelete).toHaveBeenCalledWith(mockPolicies[0])
    })

    it('disables action buttons when operations are loading', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: false, update: true, delete: false }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const editButtons = screen.getAllByLabelText(/edit policy/i)
      const deleteButtons = screen.getAllByLabelText(/delete policy/i)
      
      editButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
      
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('disables action buttons during delete operations', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          operationLoading={{ create: false, update: false, delete: true }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
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

  describe('Policy Status Highlighting', () => {
    it('highlights rows for policies expiring soon', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Find the row for the policy expiring in 15 days
      const expiringPolicyRow = screen.getByText('POL-002').closest('tr')
      expect(expiringPolicyRow).toHaveClass('bg-orange-50')
    })

    it('does not highlight expired policies with special background', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Find the row for the expired policy
      const expiredPolicyRow = screen.getByText('POL-003').closest('tr')
      expect(expiredPolicyRow).not.toHaveClass('bg-orange-50')
    })
  })

  describe('Accessibility', () => {
    it('has proper table structure with headers', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(9) // 9 columns in the table
    })

    it('has proper ARIA labels for action buttons', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByLabelText('Edit policy POL-001')).toBeInTheDocument()
      expect(screen.getByLabelText('Delete policy POL-001')).toBeInTheDocument()
      expect(screen.getByLabelText('Edit policy POL-002')).toBeInTheDocument()
      expect(screen.getByLabelText('Delete policy POL-002')).toBeInTheDocument()
    })

    it('provides screen reader text for loading state', () => {
      renderWithProviders(
        <PoliciesTable
          policies={[]}
          loading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByText('Loading policies...')).toHaveClass('sr-only')
    })

    it('has proper focus management for action buttons', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const editButtons = screen.getAllByLabelText(/edit policy/i)
      const deleteButtons = screen.getAllByLabelText(/delete policy/i)
      
      editButtons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
      })
      
      deleteButtons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2', 'focus:ring-red-500')
      })
    })
  })

  describe('Data Display', () => {
    it('truncates long policy numbers appropriately', () => {
      const longPolicyNumber = 'VERY-LONG-POLICY-NUMBER-123456789'
      const policyWithLongNumber = {
        ...mockPolicies[0],
        policyNumber: longPolicyNumber
      }
      
      renderWithProviders(
        <PoliciesTable
          policies={[policyWithLongNumber]}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const policyNumberCell = screen.getByText(longPolicyNumber).parentElement
      expect(policyNumberCell).toHaveClass('truncate', 'max-w-32')
    })

    it('truncates long provider names appropriately', () => {
      const longProviderName = 'Very Long Insurance Company Name That Should Be Truncated'
      const policyWithLongProvider = {
        ...mockPolicies[0],
        provider: longProviderName
      }
      
      renderWithProviders(
        <PoliciesTable
          policies={[policyWithLongProvider]}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      const providerCell = screen.getByText(longProviderName).parentElement
      expect(providerCell).toHaveClass('truncate', 'max-w-32')
    })

    it('displays relative time for policy creation in mobile view', () => {
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should show "Added X ago" text in mobile cards
      expect(screen.getByText(/Added .* ago/)).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('shows table view on large screens', () => {
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })
      
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('shows card view on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      renderWithProviders(
        <PoliciesTable
          policies={mockPolicies}
          loading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Should not show table headers in mobile view
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      
      // Should show card layout
      expect(screen.getByText('Life • Life Insurance Co')).toBeInTheDocument()
    })
  })
})