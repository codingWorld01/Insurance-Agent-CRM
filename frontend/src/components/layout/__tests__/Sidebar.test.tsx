import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Sidebar } from '../Sidebar'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation links correctly', () => {
    renderWithProviders(<Sidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Leads')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('displays application logo/title', () => {
    renderWithProviders(<Sidebar />)
    
    expect(screen.getByText('Insurance CRM')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    renderWithProviders(<Sidebar />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-primary/10') // or whatever active class is used
  })

  it('renders navigation icons', () => {
    renderWithProviders(<Sidebar />)
    
    // Check for icons (they might be SVGs or icon components)
    const icons = screen.getAllByRole('img', { hidden: true })
    expect(icons.length).toBeGreaterThan(0)
  })

  it('has proper accessibility attributes', () => {
    renderWithProviders(<Sidebar />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('href')
    })
  })

  it('renders responsive design elements', () => {
    renderWithProviders(<Sidebar />)
    
    // Check for responsive classes or mobile menu elements
    const sidebar = screen.getByRole('navigation')
    expect(sidebar).toHaveClass('hidden', 'md:flex') // or similar responsive classes
  })
})