import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyCompact, parseCurrency } from '../currencyUtils'

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('formats numbers correctly in Indian Rupees', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00')
      expect(formatCurrency(5000)).toBe('₹5,000.00')
      expect(formatCurrency(123456)).toBe('₹1,23,456.00')
    })

    it('handles decimal numbers correctly', () => {
      expect(formatCurrency(1000.50)).toBe('₹1,000.50')
      expect(formatCurrency(1000.25)).toBe('₹1,000.25')
      expect(formatCurrency(1000.75)).toBe('₹1,000.75')
    })

    it('handles zero correctly', () => {
      expect(formatCurrency(0)).toBe('₹0.00')
    })

    it('handles negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000.00')
      expect(formatCurrency(-500.50)).toBe('-₹500.50')
    })

    it('handles large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('₹10,00,000.00')
      expect(formatCurrency(10000000)).toBe('₹1,00,00,000.00')
    })

    it('handles small positive numbers', () => {
      expect(formatCurrency(1)).toBe('₹1.00')
      expect(formatCurrency(99)).toBe('₹99.00')
      expect(formatCurrency(0.99)).toBe('₹0.99')
    })
  })

  describe('formatCurrencyCompact', () => {
    it('formats numbers without decimals', () => {
      expect(formatCurrencyCompact(1000)).toBe('₹1,000')
      expect(formatCurrencyCompact(1000.50)).toBe('₹1,001')
      expect(formatCurrencyCompact(1000.25)).toBe('₹1,000')
    })
  })

  describe('parseCurrency', () => {
    it('parses currency strings correctly', () => {
      expect(parseCurrency('₹1,000.00')).toBe(1000)
      expect(parseCurrency('₹1,234.56')).toBe(1234.56)
      expect(parseCurrency('1000')).toBe(1000)
      expect(parseCurrency('₹0.00')).toBe(0)
      expect(parseCurrency('')).toBe(NaN)
      expect(parseCurrency('invalid')).toBe(NaN)
    })
  })

  describe('percentage formatting', () => {
    const formatPercentage = (value: number): string => {
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(1)}%`
    }

    it('formats positive percentages with plus sign', () => {
      expect(formatPercentage(15.5)).toBe('+15.5%')
      expect(formatPercentage(8.2)).toBe('+8.2%')
      expect(formatPercentage(0.1)).toBe('+0.1%')
    })

    it('formats negative percentages correctly', () => {
      expect(formatPercentage(-5.2)).toBe('-5.2%')
      expect(formatPercentage(-10.1)).toBe('-10.1%')
    })

    it('formats zero percentage correctly', () => {
      expect(formatPercentage(0)).toBe('+0.0%')
    })

    it('rounds to one decimal place', () => {
      expect(formatPercentage(15.55)).toBe('+15.6%')
      expect(formatPercentage(15.54)).toBe('+15.5%')
      expect(formatPercentage(-5.25)).toBe('-5.3%')
    })
  })

  describe('number formatting', () => {
    const formatNumber = (value: number): string => {
      return new Intl.NumberFormat('en-US').format(value)
    }

    it('formats numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('handles small numbers without separators', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(100)).toBe('100')
    })

    it('handles zero correctly', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('handles negative numbers correctly', () => {
      expect(formatNumber(-1000)).toBe('-1,000')
    })
  })

  describe('Intl.NumberFormat edge cases', () => {
    it('handles different locales', () => {
      const formatEUR = (amount: number) => {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount)
      }

      expect(formatEUR(1000)).toMatch(/1\.000,00\s*€|1\.000\s*€/)
    })

    it('handles different currency options', () => {
      const formatWithDecimals = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)
      }

      expect(formatWithDecimals(1000)).toBe('$1,000.00')
      expect(formatWithDecimals(1000.5)).toBe('$1,000.50')
    })

    it('handles very large numbers', () => {
      const largeNumber = 999999999999
      const result = formatCurrency(largeNumber)
      
      expect(result).toContain('$')
      expect(result).toContain(',')
      expect(result.length).toBeGreaterThan(10)
    })

    it('handles very small numbers', () => {
      expect(formatCurrency(0.001)).toBe('$0')
      expect(formatCurrency(0.5)).toBe('$1')
    })
  })
})