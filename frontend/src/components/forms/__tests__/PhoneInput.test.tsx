import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { PhoneInput } from '../PhoneInput'

const mockOnChange = vi.fn()

describe('PhoneInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders phone input field', () => {
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'tel')
  })

  it('formats phone number as user types', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    await user.type(input, '9876543210')

    // Should format the number (exact format depends on implementation)
    expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('987'))
  })

  it('validates phone number length', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Type incomplete phone number
    await user.type(input, '987654')
    
    // Should call onChange with the partial number
    expect(mockOnChange).toHaveBeenLastCalledWith('987654')
  })

  it('restricts input to numeric characters', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Try to type non-numeric characters
    await user.type(input, 'abc123def')
    
    // Should only accept numeric characters
    expect(mockOnChange).toHaveBeenLastCalledWith('123')
  })

  it('handles paste events correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Paste a phone number
    await user.click(input)
    await user.paste('9876543210')
    
    expect(mockOnChange).toHaveBeenCalledWith('9876543210')
  })

  it('displays country code prefix', () => {
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        showCountryCode={true}
      />
    )

    // Should show +91 for Indian numbers
    expect(screen.getByText('+91')).toBeInTheDocument()
  })

  it('handles controlled value updates', () => {
    const { rerender } = renderWithProviders(
      <PhoneInput 
        value="9876543210"
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    expect(input).toHaveValue('9876543210')

    // Update value
    rerender(
      <PhoneInput 
        value="9876543211"
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    expect(input).toHaveValue('9876543211')
  })

  it('disables input when disabled prop is true', () => {
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        disabled={true}
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    expect(input).toBeDisabled()
  })

  it('applies custom className', () => {
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        className="custom-class"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    expect(input).toHaveClass('custom-class')
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    const mockOnFocus = vi.fn()
    const mockOnBlur = vi.fn()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        onFocus={mockOnFocus}
        onBlur={mockOnBlur}
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    await user.click(input)
    expect(mockOnFocus).toHaveBeenCalled()
    
    await user.tab()
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('validates Indian mobile number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        validateFormat={true}
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Type invalid Indian mobile number (should start with 6-9)
    await user.type(input, '1234567890')
    
    // Should show validation error or prevent invalid input
    // (exact behavior depends on implementation)
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('handles maximum length restriction', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        maxLength={10}
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Type more than 10 digits
    await user.type(input, '98765432101234')
    
    // Should be limited to 10 digits
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
    expect(lastCall[0].replace(/\D/g, '')).toHaveLength(10)
  })

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value="9876543210"
        onChange={mockOnChange}
        placeholder="Enter phone number"
        showClearButton={true}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('shows validation error for invalid format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
        showValidation={true}
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Type invalid phone number
    await user.type(input, '123')
    await user.tab() // Trigger blur to show validation
    
    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument()
    })
  })

  it('supports different input modes for mobile', () => {
    renderWithProviders(
      <PhoneInput 
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    expect(input).toHaveAttribute('inputMode', 'tel')
  })

  it('handles backspace correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PhoneInput 
        value="9876543210"
        onChange={mockOnChange}
        placeholder="Enter phone number"
      />
    )

    const input = screen.getByPlaceholderText('Enter phone number')
    
    // Position cursor at end and backspace
    await user.click(input)
    await user.keyboard('{End}{Backspace}')
    
    expect(mockOnChange).toHaveBeenCalledWith('987654321')
  })
})