import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToastNotifications } from '../useToastNotifications'

// Mock the useToast hook
const mockToast = vi.fn()
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('useToastNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides showSuccess function', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    expect(typeof result.current.showSuccess).toBe('function')
  })

  it('provides showError function', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    expect(typeof result.current.showError).toBe('function')
  })

  it('provides showInfo function', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    expect(typeof result.current.showInfo).toBe('function')
  })

  it('calls toast with success variant for showSuccess', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showSuccess('Success message')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Success message',
      variant: 'success',
    })
  })

  it('calls toast with custom title for showSuccess', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showSuccess('Success message', 'Custom Title')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Custom Title',
      description: 'Success message',
      variant: 'success',
    })
  })

  it('calls toast with destructive variant for showError', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showError('Error message')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Error message',
      variant: 'destructive',
    })
  })

  it('calls toast with custom title for showError', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showError('Error message', 'Custom Error')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Custom Error',
      description: 'Error message',
      variant: 'destructive',
    })
  })

  it('calls toast with default variant for showInfo', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showInfo('Info message')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Info',
      description: 'Info message',
      variant: 'default',
    })
  })

  it('calls toast with custom title for showInfo', () => {
    const { result } = renderHook(() => useToastNotifications())
    
    result.current.showInfo('Info message', 'Custom Info')
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Custom Info',
      description: 'Info message',
      variant: 'default',
    })
  })
})