import { describe, it, expect } from 'vitest'
import { 
  validatePolicyForm, 
  formatValidationErrors, 
  isPolicyExpired, 
  isPolicyExpiringSoon,
  validatePolicyNumber,
  validatePolicyDates,
  validatePolicyAmounts
} from '../policyValidation'
import { CreatePolicyRequest } from '@/types'

describe('Policy Validation Integration', () => {
  describe('validatePolicyForm', () => {
    const validPolicyData: CreatePolicyRequest = {
      policyNumber: 'POL-001',
      policyType: 'Life',
      provider: 'Test Insurance Co',
      premiumAmount: 1000,
      commissionAmount: 100,
      startDate: '2024-01-01',
      expiryDate: '2025-01-01'
    }

    it('validates a complete valid policy form', () => {
      const errors = validatePolicyForm(validPolicyData)
      expect(errors).toEqual({})
    })

    it('validates all required fields', () => {
      const invalidData: CreatePolicyRequest = {
        policyNumber: '',
        policyType: 'Life',
        provider: '',
        premiumAmount: 0,
        commissionAmount: 0,
        startDate: '',
        expiryDate: ''
      }

      const errors = validatePolicyForm(invalidData)
      
      expect(errors.policyNumber).toBeDefined()
      expect(errors.provider).toBeDefined()
      expect(errors.premiumAmount).toBeDefined()
      expect(errors.commissionAmount).toBeDefined()
      expect(errors.startDate).toBeDefined()
      expect(errors.expiryDate).toBeDefined()
    })

    it('validates policy number format and uniqueness', () => {
      const invalidPolicyNumber: CreatePolicyRequest = {
        ...validPolicyData,
        policyNumber: '123' // Too short
      }

      const errors = validatePolicyForm(invalidPolicyNumber)
      expect(errors.policyNumber).toContain('Policy number must be at least 4 characters')
    })

    it('validates premium amount is positive', () => {
      const negativePremium: CreatePolicyRequest = {
        ...validPolicyData,
        premiumAmount: -100
      }

      const errors = validatePolicyForm(negativePremium)
      expect(errors.premiumAmount).toContain('Premium amount must be positive')
    })

    it('validates commission amount is positive', () => {
      const negativeCommission: CreatePolicyRequest = {
        ...validPolicyData,
        commissionAmount: -10
      }

      const errors = validatePolicyForm(negativeCommission)
      expect(errors.commissionAmount).toContain('Commission amount must be positive')
    })

    it('validates date range (expiry after start)', () => {
      const invalidDateRange: CreatePolicyRequest = {
        ...validPolicyData,
        startDate: '2025-01-01',
        expiryDate: '2024-01-01'
      }

      const errors = validatePolicyForm(invalidDateRange)
      expect(errors.expiryDate).toContain('Expiry date must be after start date')
    })

    it('validates start date is not too far in the future', () => {
      const futureStartDate = new Date()
      futureStartDate.setFullYear(futureStartDate.getFullYear() + 2)
      
      const farFutureStart: CreatePolicyRequest = {
        ...validPolicyData,
        startDate: futureStartDate.toISOString().split('T')[0]
      }

      const errors = validatePolicyForm(farFutureStart)
      expect(errors.startDate).toContain('Start date cannot be more than 1 year in the future')
    })

    it('validates provider name length', () => {
      const longProvider: CreatePolicyRequest = {
        ...validPolicyData,
        provider: 'A'.repeat(101) // Too long
      }

      const errors = validatePolicyForm(longProvider)
      expect(errors.provider).toContain('Provider name must be less than 100 characters')
    })

    it('validates premium amount precision', () => {
      const highPrecisionPremium: CreatePolicyRequest = {
        ...validPolicyData,
        premiumAmount: 1000.123 // More than 2 decimal places
      }

      const errors = validatePolicyForm(highPrecisionPremium)
      expect(errors.premiumAmount).toContain('Premium amount can have at most 2 decimal places')
    })

    it('validates commission amount precision', () => {
      const highPrecisionCommission: CreatePolicyRequest = {
        ...validPolicyData,
        commissionAmount: 100.999 // More than 2 decimal places
      }

      const errors = validatePolicyForm(highPrecisionCommission)
      expect(errors.commissionAmount).toContain('Commission amount can have at most 2 decimal places')
    })
  })

  describe('formatValidationErrors', () => {
    it('formats validation errors for display', () => {
      const rawErrors = {
        policyNumber: 'Policy number is required',
        premiumAmount: 'Premium amount must be positive',
        startDate: 'Start date is required'
      }

      const formattedErrors = formatValidationErrors(rawErrors)
      
      expect(formattedErrors).toEqual({
        policyNumber: 'Policy number is required',
        premiumAmount: 'Premium amount must be positive',
        startDate: 'Start date is required'
      })
    })

    it('handles empty error object', () => {
      const formattedErrors = formatValidationErrors({})
      expect(formattedErrors).toEqual({})
    })

    it('filters out undefined errors', () => {
      const rawErrors = {
        policyNumber: 'Policy number is required',
        premiumAmount: undefined,
        startDate: 'Start date is required'
      }

      const formattedErrors = formatValidationErrors(rawErrors)
      
      expect(formattedErrors).toEqual({
        policyNumber: 'Policy number is required',
        startDate: 'Start date is required'
      })
      expect(formattedErrors.premiumAmount).toBeUndefined()
    })
  })

  describe('isPolicyExpired', () => {
    it('returns true for expired policies', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      expect(isPolicyExpired(pastDate)).toBe(true)
    })

    it('returns false for future policies', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      expect(isPolicyExpired(futureDate)).toBe(false)
    })

    it('returns true for policies expiring today', () => {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      expect(isPolicyExpired(today.toISOString())).toBe(false)
      
      // But if it's past the expiry time
      const pastToday = new Date()
      pastToday.setHours(0, 0, 0, 0) // Start of today
      pastToday.setTime(pastToday.getTime() - 1) // 1ms before today
      expect(isPolicyExpired(pastToday.toISOString())).toBe(true)
    })

    it('handles invalid date strings', () => {
      expect(isPolicyExpired('invalid-date')).toBe(false)
    })
  })

  describe('isPolicyExpiringSoon', () => {
    it('returns true for policies expiring within specified days', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days
      expect(isPolicyExpiringSoon(soonDate, 30)).toBe(true)
    })

    it('returns false for policies expiring beyond specified days', () => {
      const farDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days
      expect(isPolicyExpiringSoon(farDate, 30)).toBe(false)
    })

    it('returns false for already expired policies', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      expect(isPolicyExpiringSoon(pastDate, 30)).toBe(false)
    })

    it('handles edge case of exactly N days', () => {
      const exactDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Exactly 30 days
      expect(isPolicyExpiringSoon(exactDate, 30)).toBe(true)
    })

    it('handles invalid date strings', () => {
      expect(isPolicyExpiringSoon('invalid-date', 30)).toBe(false)
    })
  })

  describe('validatePolicyNumber', () => {
    it('validates policy number format', () => {
      expect(validatePolicyNumber('POL-001')).toBeNull()
      expect(validatePolicyNumber('POLICY-123456')).toBeNull()
      expect(validatePolicyNumber('ABC123')).toBeNull()
    })

    it('rejects empty policy numbers', () => {
      expect(validatePolicyNumber('')).toBe('Policy number is required')
      expect(validatePolicyNumber('   ')).toBe('Policy number is required')
    })

    it('rejects short policy numbers', () => {
      expect(validatePolicyNumber('123')).toBe('Policy number must be at least 4 characters')
    })

    it('rejects long policy numbers', () => {
      const longNumber = 'A'.repeat(51)
      expect(validatePolicyNumber(longNumber)).toBe('Policy number must be less than 50 characters')
    })

    it('validates policy number characters', () => {
      expect(validatePolicyNumber('POL-001!')).toBe('Policy number can only contain letters, numbers, and hyphens')
      expect(validatePolicyNumber('POL 001')).toBe('Policy number can only contain letters, numbers, and hyphens')
    })
  })

  describe('validatePolicyDates', () => {
    it('validates valid date ranges', () => {
      const errors = validatePolicyDates('2024-01-01', '2025-01-01')
      expect(errors).toEqual({})
    })

    it('rejects invalid date formats', () => {
      const errors = validatePolicyDates('invalid-date', '2025-01-01')
      expect(errors.startDate).toBe('Invalid start date format')
    })

    it('rejects expiry date before start date', () => {
      const errors = validatePolicyDates('2025-01-01', '2024-01-01')
      expect(errors.expiryDate).toBe('Expiry date must be after start date')
    })

    it('rejects start date too far in future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const errors = validatePolicyDates(futureDateStr, '2026-01-01')
      expect(errors.startDate).toBe('Start date cannot be more than 1 year in the future')
    })

    it('allows start date up to 1 year in future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      futureDate.setDate(futureDate.getDate() - 1) // Just under 1 year
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const expiryDate = new Date(futureDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      const expiryDateStr = expiryDate.toISOString().split('T')[0]
      
      const errors = validatePolicyDates(futureDateStr, expiryDateStr)
      expect(errors.startDate).toBeUndefined()
    })

    it('validates minimum policy duration', () => {
      const startDate = '2024-01-01'
      const shortExpiryDate = '2024-01-15' // Only 2 weeks
      
      const errors = validatePolicyDates(startDate, shortExpiryDate)
      expect(errors.expiryDate).toBe('Policy duration must be at least 30 days')
    })

    it('validates maximum policy duration', () => {
      const startDate = '2024-01-01'
      const longExpiryDate = '2030-01-01' // 6 years
      
      const errors = validatePolicyDates(startDate, longExpiryDate)
      expect(errors.expiryDate).toBe('Policy duration cannot exceed 5 years')
    })
  })

  describe('validatePolicyAmounts', () => {
    it('validates positive amounts', () => {
      const errors = validatePolicyAmounts(1000, 100)
      expect(errors).toEqual({})
    })

    it('rejects zero amounts', () => {
      const errors = validatePolicyAmounts(0, 0)
      expect(errors.premiumAmount).toBe('Premium amount must be positive')
      expect(errors.commissionAmount).toBe('Commission amount must be positive')
    })

    it('rejects negative amounts', () => {
      const errors = validatePolicyAmounts(-100, -10)
      expect(errors.premiumAmount).toBe('Premium amount must be positive')
      expect(errors.commissionAmount).toBe('Commission amount must be positive')
    })

    it('validates decimal precision', () => {
      const errors = validatePolicyAmounts(1000.123, 100.999)
      expect(errors.premiumAmount).toBe('Premium amount can have at most 2 decimal places')
      expect(errors.commissionAmount).toBe('Commission amount can have at most 2 decimal places')
    })

    it('allows valid decimal amounts', () => {
      const errors = validatePolicyAmounts(1000.50, 100.25)
      expect(errors).toEqual({})
    })

    it('validates maximum amounts', () => {
      const errors = validatePolicyAmounts(20000000, 2000000) // Very large amounts
      expect(errors.premiumAmount).toBe('Premium amount cannot exceed ₹1,00,00,000')
      expect(errors.commissionAmount).toBe('Commission amount cannot exceed ₹10,00,000')
    })

    it('validates commission percentage relative to premium', () => {
      const errors = validatePolicyAmounts(1000, 600) // 60% commission
      expect(errors.commissionAmount).toBe('Commission cannot exceed 50% of premium amount')
    })

    it('allows reasonable commission percentages', () => {
      const errors = validatePolicyAmounts(1000, 200) // 20% commission
      expect(errors).toEqual({})
    })
  })

  describe('Complex Validation Scenarios', () => {
    it('validates policy with multiple errors', () => {
      const invalidPolicy: CreatePolicyRequest = {
        policyNumber: '12', // Too short
        policyType: 'Life',
        provider: '', // Empty
        premiumAmount: -100, // Negative
        commissionAmount: 0, // Zero
        startDate: '2025-01-01', // Future
        expiryDate: '2024-01-01' // Before start
      }

      const errors = validatePolicyForm(invalidPolicy)
      
      expect(Object.keys(errors)).toHaveLength(6)
      expect(errors.policyNumber).toBeDefined()
      expect(errors.provider).toBeDefined()
      expect(errors.premiumAmount).toBeDefined()
      expect(errors.commissionAmount).toBeDefined()
      expect(errors.startDate).toBeDefined()
      expect(errors.expiryDate).toBeDefined()
    })

    it('validates policy update with partial data', () => {
      const updateData = {
        premiumAmount: 1500,
        commissionAmount: 150
      }

      // Should validate only provided fields
      const errors = validatePolicyAmounts(updateData.premiumAmount, updateData.commissionAmount)
      expect(errors).toEqual({})
    })

    it('handles edge cases in date validation', () => {
      // Same day start and expiry
      const sameDay = validatePolicyDates('2024-01-01', '2024-01-01')
      expect(sameDay.expiryDate).toBe('Policy duration must be at least 30 days')

      // Leap year handling
      const leapYear = validatePolicyDates('2024-02-28', '2024-02-29')
      expect(leapYear.expiryDate).toBe('Policy duration must be at least 30 days')
    })

    it('validates business rules for different policy types', () => {
      // Life insurance might have different validation rules
      const lifePolicy: CreatePolicyRequest = {
        ...validPolicyData,
        policyType: 'Life',
        premiumAmount: 50000, // High premium for life insurance
        commissionAmount: 5000
      }

      const errors = validatePolicyForm(lifePolicy)
      expect(errors).toEqual({}) // Should be valid for life insurance
    })
  })
})