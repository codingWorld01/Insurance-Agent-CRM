import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  announceToScreenReader,
  generateId,
  isFocusable,
  getFocusableElements,
  formatForScreenReader,
  prefersReducedMotion,
  prefersHighContrast,
  hasGoodContrast,
  isActivationKey,
  KeyboardKeys,
  AriaRoles,
  AriaProperties,
  createScreenReaderText,
  restoreFocus,
  announcePageChange,
  announceFormError,
  announceFormSuccess,
  announceLoadingStart,
  announceLoadingComplete,
} from '../accessibility'

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('reduce') || query.includes('high'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Accessibility Utils', () => {
  beforeEach(() => {
    // Clear any existing live regions
    const existingLiveRegion = document.getElementById('live-region')
    if (existingLiveRegion) {
      existingLiveRegion.remove()
    }
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('announceToScreenReader', () => {
    it('creates a live region when called', () => {
      announceToScreenReader('Test message')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
      expect(liveRegion?.textContent).toBe('Test message')
    })

    it('uses assertive priority when specified', () => {
      announceToScreenReader('Urgent message', 'assertive')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive')
    })

    it('clears message after timeout', async () => {
      vi.useFakeTimers()
      
      announceToScreenReader('Test message')
      const liveRegion = document.getElementById('live-region')
      
      expect(liveRegion?.textContent).toBe('Test message')
      
      vi.advanceTimersByTime(1000)
      
      expect(liveRegion?.textContent).toBe('')
      
      vi.useRealTimers()
    })
  })

  describe('generateId', () => {
    it('generates unique IDs with default prefix', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).toMatch(/^id-\d+$/)
      expect(id2).toMatch(/^id-\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('generates unique IDs with custom prefix', () => {
      const id1 = generateId('custom')
      const id2 = generateId('custom')
      
      expect(id1).toMatch(/^custom-\d+$/)
      expect(id2).toMatch(/^custom-\d+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('isFocusable', () => {
    it('returns true for focusable elements', () => {
      const button = document.createElement('button')
      const input = document.createElement('input')
      const link = document.createElement('a')
      link.href = '#'
      
      expect(isFocusable(button)).toBe(true)
      expect(isFocusable(input)).toBe(true)
      expect(isFocusable(link)).toBe(true)
    })

    it('returns false for disabled elements', () => {
      const button = document.createElement('button')
      button.disabled = true
      
      expect(isFocusable(button)).toBe(false)
    })

    it('returns false for hidden elements', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-hidden', 'true')
      
      expect(isFocusable(button)).toBe(false)
    })
  })

  describe('getFocusableElements', () => {
    it('returns all focusable elements in container', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <button disabled>Disabled Button</button>
        <div style="display: none;"><button>Hidden Button</button></div>
      `
      document.body.appendChild(container)
      
      const focusableElements = getFocusableElements(container)
      
      expect(focusableElements).toHaveLength(3) // button, input, link
    })
  })

  describe('formatForScreenReader', () => {
    it('formats camelCase text correctly', () => {
      expect(formatForScreenReader('firstName')).toBe('first name')
      expect(formatForScreenReader('lastName')).toBe('last name')
    })

    it('adds spaces between numbers and letters', () => {
      expect(formatForScreenReader('address1')).toBe('address 1')
      expect(formatForScreenReader('2ndFloor')).toBe('2 nd floor')
    })

    it('converts to lowercase', () => {
      expect(formatForScreenReader('UPPERCASE')).toBe('uppercase')
    })
  })

  describe('prefersReducedMotion', () => {
    it('returns true when user prefers reduced motion', () => {
      expect(prefersReducedMotion()).toBe(true)
    })
  })

  describe('prefersHighContrast', () => {
    it('returns true when user prefers high contrast', () => {
      expect(prefersHighContrast()).toBe(true)
    })
  })

  describe('hasGoodContrast', () => {
    it('returns true for good contrast combinations', () => {
      expect(hasGoodContrast('#000000', '#ffffff')).toBe(true)
    })

    it('returns false for poor contrast combinations', () => {
      expect(hasGoodContrast('#888888', '#999999')).toBe(false)
    })
  })

  describe('isActivationKey', () => {
    it('returns true for Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      expect(isActivationKey(event)).toBe(true)
    })

    it('returns true for Space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' })
      expect(isActivationKey(event)).toBe(true)
    })

    it('returns false for other keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(isActivationKey(event)).toBe(false)
    })
  })

  describe('KeyboardKeys constants', () => {
    it('exports correct key values', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter')
      expect(KeyboardKeys.SPACE).toBe(' ')
      expect(KeyboardKeys.ESCAPE).toBe('Escape')
      expect(KeyboardKeys.TAB).toBe('Tab')
    })
  })

  describe('AriaRoles constants', () => {
    it('exports correct role values', () => {
      expect(AriaRoles.BUTTON).toBe('button')
      expect(AriaRoles.DIALOG).toBe('dialog')
      expect(AriaRoles.MENU).toBe('menu')
    })
  })

  describe('AriaProperties constants', () => {
    it('exports correct property values', () => {
      expect(AriaProperties.EXPANDED).toBe('aria-expanded')
      expect(AriaProperties.LABEL).toBe('aria-label')
      expect(AriaProperties.HIDDEN).toBe('aria-hidden')
    })
  })

  describe('createScreenReaderText', () => {
    it('creates span with sr-only class', () => {
      const span = createScreenReaderText('Screen reader text')
      
      expect(span.tagName).toBe('SPAN')
      expect(span.className).toBe('sr-only')
      expect(span.textContent).toBe('Screen reader text')
    })
  })

  describe('restoreFocus', () => {
    it('focuses element after timeout', async () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      
      const focusSpy = vi.spyOn(button, 'focus')
      
      restoreFocus(button)
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(focusSpy).toHaveBeenCalled()
    })

    it('handles null element gracefully', () => {
      expect(() => restoreFocus(null)).not.toThrow()
    })
  })

  describe('announcePageChange', () => {
    it('announces page change and updates document title', () => {
      const originalTitle = document.title
      
      announcePageChange('Dashboard')
      
      expect(document.title).toBe('Dashboard - Insurance CRM')
      
      // Restore original title
      document.title = originalTitle
    })
  })

  describe('form announcement functions', () => {
    it('announces form errors', () => {
      announceFormError('Email', 'Invalid email format')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.textContent).toBe('Error in Email: Invalid email format')
    })

    it('announces form success', () => {
      announceFormSuccess('Form submitted successfully')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.textContent).toBe('Form submitted successfully')
    })
  })

  describe('loading announcement functions', () => {
    it('announces loading start', () => {
      announceLoadingStart('data')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.textContent).toBe('Loading data')
    })

    it('announces loading complete', () => {
      announceLoadingComplete('data')
      
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.textContent).toBe('data loaded')
    })
  })
})