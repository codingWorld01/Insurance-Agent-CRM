import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const result = cn('px-4', true && 'py-2', false && 'bg-red-500')
      expect(result).toBe('px-4 py-2')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-4 px-6', 'py-2')
      expect(result).toBe('py-2 px-6')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle undefined and null values', () => {
      const result = cn('px-4', undefined, null, 'py-2')
      expect(result).toBe('px-4 py-2')
    })
  })
})