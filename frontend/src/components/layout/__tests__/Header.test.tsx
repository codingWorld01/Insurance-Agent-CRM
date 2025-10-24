import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Header } from '../Header'

const mockLogout = vi.fn()

// Mock the useAuth hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    logout: mockLogout,
  }),
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title correctly', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays user information', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Header title="Dashboard" />)
    
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  it('renders mobile menu toggle button', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('handles different page titles', () => {
    const { rerender } = renderWithProviders(<Header title="Leads" />)
    expect(screen.getByText('Leads')).toBeInTheDocument()
    
    rerender(<Header title="Clients" />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
    })
  })

  it('displays user avatar or initials', () => {
    renderWithProviders(<Header title="Dashboard" />)
    
    // Look for avatar image or initials
    const avatar = screen.getByText('TU') // Test User initials
    expect(avatar).toBeInTheDocument()
  })

  it('shows user dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Header title="Dashboard" />)
    
    const userButton = screen.getByRole('button', { name: /test user/i })
    await user.click(userButton)
    
    // Should show dropdown with user options
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})