import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsive, useMediaQuery, usePrefersDarkMode, usePrefersReducedMotion } from '../useResponsive'

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset window dimensions
    window.innerWidth = 1024
    window.innerHeight = 768
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial screen size', () => {
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.screenSize).toEqual({
      width: 1024,
      height: 768,
    })
  })

  it('identifies desktop screen correctly', () => {
    window.innerWidth = 1200
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isMobile).toBe(false)
  })

  it('identifies tablet screen correctly', () => {
    window.innerWidth = 800
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isMobile).toBe(false)
  })

  it('identifies mobile screen correctly', () => {
    window.innerWidth = 600
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('updates on window resize', () => {
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.screenSize.width).toBe(1024)
    
    act(() => {
      window.innerWidth = 1200
      window.dispatchEvent(new Event('resize'))
    })
    
    expect(result.current.screenSize.width).toBe(1200)
  })

  it('provides breakpoint check functions', () => {
    const { result } = renderHook(() => useResponsive())
    
    expect(typeof result.current.isBreakpoint).toBe('function')
    expect(typeof result.current.isBetween).toBe('function')
  })

  it('checks specific breakpoints correctly', () => {
    window.innerWidth = 1200
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isLg).toBe(true)
    expect(result.current.isMd).toBe(true)
    expect(result.current.isSm).toBe(true)
  })

  it('uses custom breakpoints when provided', () => {
    const customBreakpoints = {
      md: 900,
      lg: 1200,
    }
    
    window.innerWidth = 1000
    const { result } = renderHook(() => useResponsive(customBreakpoints))
    
    expect(result.current.isMd).toBe(true)
    expect(result.current.isLg).toBe(false)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useResponsive())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('useMediaQuery', () => {
  beforeEach(() => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('returns media query match result', () => {
    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
    
    expect(result.current).toBe(true)
  })

  it('returns false for non-matching query', () => {
    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: light)'))
    
    expect(result.current).toBe(false)
  })

  it('updates when media query changes', () => {
    let mediaQueryCallback: ((event: MediaQueryListEvent) => void) | null = null
    
    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          mediaQueryCallback = callback
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    
    expect(result.current).toBe(false)
    
    if (mediaQueryCallback) {
      act(() => {
        mediaQueryCallback({ matches: true } as MediaQueryListEvent)
      })
      
      expect(result.current).toBe(true)
    }
  })
})

describe('predefined media query hooks', () => {
  beforeEach(() => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('dark') || query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('usePrefersDarkMode works correctly', () => {
    const { result } = renderHook(() => usePrefersDarkMode())
    
    expect(result.current).toBe(true)
  })

  it('usePrefersReducedMotion works correctly', () => {
    const { result } = renderHook(() => usePrefersReducedMotion())
    
    expect(result.current).toBe(true)
  })
})