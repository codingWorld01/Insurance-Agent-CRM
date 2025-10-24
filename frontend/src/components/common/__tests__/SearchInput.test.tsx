import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { SearchInput } from '../SearchInput'
import { beforeEach } from 'node:test'

const mockOnChange = vi.fn()

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search leads..."
        value=""
        onChange={mockOnChange}
      />
    )
    
    expect(screen.getByPlaceholderText('Search leads...')).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 't')
    
    expect(mockOnChange).toHaveBeenCalledWith('t')
  })

  it('displays search icon', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
      />
    )
    
    const searchIcon = screen.getByRole('img', { hidden: true })
    expect(searchIcon).toBeInTheDocument()
  })

  it('handles controlled value prop', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value="initial value"
        onChange={mockOnChange}
      />
    )
    
    expect(screen.getByDisplayValue('initial value')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
        aria-label="Search for items"
      />
    )
    
    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-label', 'Search for items')
  })

  it('uses placeholder as aria-label when no aria-label provided', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search leads..."
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('aria-label', 'Search leads...')
  })

  it('handles empty value correctly', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByPlaceholderText('Search...')
    expect(input).toHaveValue('')
  })

  it('applies custom className', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    )
    
    const container = screen.getByPlaceholderText('Search...').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('applies custom id', () => {
    renderWithProviders(
      <SearchInput 
        placeholder="Search..."
        value=""
        onChange={mockOnChange}
        id="search-input"
      />
    )
    
    const input = screen.getByPlaceholderText('Search...')
    expect(input).toHaveAttribute('id', 'search-input')
  })
})