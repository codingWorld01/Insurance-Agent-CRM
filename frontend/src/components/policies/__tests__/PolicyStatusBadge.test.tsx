import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { PolicyStatusBadge, getExpiryWarningText } from '../PolicyStatusBadge'
import { Policy } from '@/types'

const createMockPolicy = (overrides: Partial<Policy> = {}): Policy => ({
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
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

describe('PolicyStatusBadge', () => {
  describe('Active Policies', () => {
    it('displays active badge for active policies', () => {
      const activePolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={activePolicy} />
      )
      
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy status: Active')).toBeInTheDocument()
      
      const badge = screen.getByText('Active').parentElement
      expect(badge).toHaveClass('border-green-500', 'text-green-700', 'bg-green-50')
    })

    it('displays expiring soon badge for policies expiring within 30 days', () => {
      const expiringSoonPolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={expiringSoonPolicy} />
      )
      
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy status: Active but expiring soon')).toBeInTheDocument()
      
      const badge = screen.getByText('Expiring Soon').parentElement
      expect(badge).toHaveClass('border-orange-500', 'text-orange-700', 'bg-orange-50')
    })

    it('does not show expiring soon when showExpiryWarning is false', () => {
      const expiringSoonPolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={expiringSoonPolicy} showExpiryWarning={false} />
      )
      
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.queryByText('Expiring Soon')).not.toBeInTheDocument()
    })
  })

  describe('Expired Policies', () => {
    it('displays expired badge for policies with expired status', () => {
      const expiredPolicy = createMockPolicy({
        status: 'Expired',
        expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={expiredPolicy} />
      )
      
      expect(screen.getByText('Expired')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy status: Expired')).toBeInTheDocument()
      
      const badge = screen.getByText('Expired').parentElement
      expect(badge).toHaveClass('border-destructive')
    })

    it('displays expired badge for policies past expiry date even if status is Active', () => {
      const pastExpiryPolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={pastExpiryPolicy} />
      )
      
      expect(screen.getByText('Expired')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy status: Expired')).toBeInTheDocument()
    })
  })

  describe('Custom Status', () => {
    it('displays custom status for unknown status values', () => {
      const customStatusPolicy = createMockPolicy({
        status: 'Suspended' as any,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={customStatusPolicy} />
      )
      
      expect(screen.getByText('Suspended')).toBeInTheDocument()
      expect(screen.getByLabelText('Policy status: Suspended')).toBeInTheDocument()
      
      const badge = screen.getByText('Suspended').parentElement
      expect(badge).toHaveClass('border-border') // Default outline variant
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const activePolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={activePolicy} className="custom-class" />
      )
      
      const badge = screen.getByText('Active').parentElement
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('Icons', () => {
    it('displays check circle icon for active policies', () => {
      const activePolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={activePolicy} />
      )
      
      const checkIcon = screen.getByText('Active').parentElement?.querySelector('svg')
      expect(checkIcon).toBeInTheDocument()
    })

    it('displays warning triangle icon for expiring policies', () => {
      const expiringSoonPolicy = createMockPolicy({
        status: 'Active',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={expiringSoonPolicy} />
      )
      
      const warningIcon = screen.getByText('Expiring Soon').parentElement?.querySelector('svg')
      expect(warningIcon).toBeInTheDocument()
    })

    it('displays X circle icon for expired policies', () => {
      const expiredPolicy = createMockPolicy({
        status: 'Expired',
        expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      renderWithProviders(
        <PolicyStatusBadge policy={expiredPolicy} />
      )
      
      const xIcon = screen.getByText('Expired').parentElement?.querySelector('svg')
      expect(xIcon).toBeInTheDocument()
    })
  })
})

describe('getExpiryWarningText', () => {
  describe('Expired Policies', () => {
    it('returns expired message for policies past expiry date', () => {
      const expiredPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      })
      
      const warningText = getExpiryWarningText(expiredPolicy)
      expect(warningText).toBe('This policy has expired')
    })
  })

  describe('Expiring Soon Policies', () => {
    it('returns "Expires tomorrow" for policies expiring in 1 day', () => {
      const tomorrowPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      })
      
      const warningText = getExpiryWarningText(tomorrowPolicy)
      expect(warningText).toBe('Expires tomorrow')
    })

    it('returns days count for policies expiring within 7 days', () => {
      const fiveDaysPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      })
      
      const warningText = getExpiryWarningText(fiveDaysPolicy)
      expect(warningText).toBe('Expires in 5 days')
    })

    it('returns days count for policies expiring within 30 days', () => {
      const fifteenDaysPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
      })
      
      const warningText = getExpiryWarningText(fifteenDaysPolicy)
      expect(warningText).toBe('Expires in 15 days')
    })

    it('returns days count for policies expiring in exactly 30 days', () => {
      const thirtyDaysPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      
      const warningText = getExpiryWarningText(thirtyDaysPolicy)
      expect(warningText).toBe('Expires in 30 days')
    })
  })

  describe('Future Policies', () => {
    it('returns null for policies expiring more than 30 days away', () => {
      const futurePolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      })
      
      const warningText = getExpiryWarningText(futurePolicy)
      expect(warningText).toBeNull()
    })

    it('returns null for policies expiring in exactly 31 days', () => {
      const thirtyOneDaysPolicy = createMockPolicy({
        expiryDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days from now
      })
      
      const warningText = getExpiryWarningText(thirtyOneDaysPolicy)
      expect(warningText).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('handles policies expiring today', () => {
      const todayPolicy = createMockPolicy({
        expiryDate: new Date().toISOString() // Today
      })
      
      const warningText = getExpiryWarningText(todayPolicy)
      // Should be treated as expired or expiring today
      expect(warningText).toMatch(/expired|today/i)
    })

    it('handles invalid date strings gracefully', () => {
      const invalidDatePolicy = createMockPolicy({
        expiryDate: 'invalid-date'
      })
      
      // Should not throw an error
      expect(() => getExpiryWarningText(invalidDatePolicy)).not.toThrow()
    })
  })
})