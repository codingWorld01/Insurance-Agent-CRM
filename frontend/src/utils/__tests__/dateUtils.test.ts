import { describe, it, expect } from 'vitest'
import { format, formatDistanceToNow, differenceInYears } from 'date-fns'

// Test date utility functions used throughout the application
describe('Date Utils', () => {
  describe('formatDistanceToNow', () => {
    it('formats recent dates correctly', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const result = formatDistanceToNow(oneHourAgo, { addSuffix: true })
      
      expect(result).toMatch(/about 1 hour ago/)
    })

    it('formats dates from days ago', () => {
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      
      const result = formatDistanceToNow(threeDaysAgo, { addSuffix: true })
      
      expect(result).toMatch(/3 days ago/)
    })

    it('handles future dates', () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      const result = formatDistanceToNow(tomorrow, { addSuffix: true })
      
      expect(result).toMatch(/in about/)
    })

    it('handles string dates', () => {
      const dateString = '2024-01-01T00:00:00Z'
      
      const result = formatDistanceToNow(new Date(dateString), { addSuffix: true })
      
      expect(result).toContain('ago')
    })
  })

  describe('differenceInYears', () => {
    it('calculates age correctly', () => {
      const birthDate = new Date('1990-01-01')
      const currentDate = new Date('2024-01-01')
      
      const age = differenceInYears(currentDate, birthDate)
      
      expect(age).toBe(34)
    })

    it('handles birthday not yet reached this year', () => {
      const birthDate = new Date('1990-06-15')
      const currentDate = new Date('2024-03-01')
      
      const age = differenceInYears(currentDate, birthDate)
      
      expect(age).toBe(33)
    })

    it('handles birthday already passed this year', () => {
      const birthDate = new Date('1990-03-15')
      const currentDate = new Date('2024-06-01')
      
      const age = differenceInYears(currentDate, birthDate)
      
      expect(age).toBe(34)
    })

    it('handles same year birth', () => {
      const birthDate = new Date('2024-01-01')
      const currentDate = new Date('2024-12-31')
      
      const age = differenceInYears(currentDate, birthDate)
      
      expect(age).toBe(0)
    })
  })

  describe('format', () => {
    it('formats dates in MMMM d, yyyy format', () => {
      const date = new Date('2024-01-15')
      
      const result = format(date, 'MMMM d, yyyy')
      
      expect(result).toBe('January 15, 2024')
    })

    it('formats dates in MMM d, yyyy format', () => {
      const date = new Date('2024-12-25')
      
      const result = format(date, 'MMM d, yyyy')
      
      expect(result).toBe('Dec 25, 2024')
    })

    it('formats dates in yyyy-MM-dd format', () => {
      const date = new Date('2024-06-30')
      
      const result = format(date, 'yyyy-MM-dd')
      
      expect(result).toBe('2024-06-30')
    })

    it('handles different months correctly', () => {
      const dates = [
        { date: new Date('2024-01-01'), expected: 'January 1, 2024' },
        { date: new Date('2024-02-29'), expected: 'February 29, 2024' }, // Leap year
        { date: new Date('2024-12-31'), expected: 'December 31, 2024' },
      ]
      
      dates.forEach(({ date, expected }) => {
        const result = format(date, 'MMMM d, yyyy')
        expect(result).toBe(expected)
      })
    })
  })

  describe('date validation helpers', () => {
    it('validates date is in the past', () => {
      const pastDate = new Date('2020-01-01')
      const futureDate = new Date('2030-01-01')
      const today = new Date()
      
      expect(pastDate < today).toBe(true)
      expect(futureDate >= today).toBe(true)
    })

    it('validates date string format', () => {
      const validDateString = '2024-01-01'
      const invalidDateString = 'invalid-date'
      
      const validDate = new Date(validDateString)
      const invalidDate = new Date(invalidDateString)
      
      expect(isNaN(validDate.getTime())).toBe(false)
      expect(isNaN(invalidDate.getTime())).toBe(true)
    })

    it('handles ISO date strings', () => {
      const isoString = '2024-01-01T00:00:00.000Z'
      const date = new Date(isoString)
      
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(1)
    })
  })
})