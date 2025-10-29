import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ClientTypeSelector } from '../ClientTypeSelector'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockOnSelect = vi.fn()

describe('ClientTypeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all client type options', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    expect(screen.getByText('Personal Client')).toBeInTheDocument()
    expect(screen.getByText('Family/Employee Client')).toBeInTheDocument()
    expect(screen.getByText('Corporate Client')).toBeInTheDocument()
  })

  it('displays correct descriptions for each client type', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    expect(screen.getByText('Individual client with comprehensive personal information')).toBeInTheDocument()
    expect(screen.getByText('Family member or employee with relationship tracking')).toBeInTheDocument()
    expect(screen.getByText('Business entity with company-specific information')).toBeInTheDocument()
  })

  it('shows mandatory fields for each client type', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    // Personal client mandatory fields
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
    expect(screen.getByText('Mobile Number')).toBeInTheDocument()
    expect(screen.getByText('Birth Date')).toBeInTheDocument()

    // Family/Employee mandatory fields
    expect(screen.getByText('Phone Number')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp Number')).toBeInTheDocument()
    expect(screen.getByText('Date of Birth')).toBeInTheDocument()

    // Corporate mandatory fields
    expect(screen.getByText('Company Name')).toBeInTheDocument()
  })

  it('shows key features for each client type', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    // Personal client features
    expect(screen.getByText('Complete personal details')).toBeInTheDocument()
    expect(screen.getByText('Profile image upload')).toBeInTheDocument()
    expect(screen.getByText('Document management')).toBeInTheDocument()
    expect(screen.getByText('Age auto-calculation')).toBeInTheDocument()

    // Family/Employee features
    expect(screen.getByText('Relationship tracking')).toBeInTheDocument()
    expect(screen.getByText('Family connections')).toBeInTheDocument()
    expect(screen.getByText('Employee details')).toBeInTheDocument()
    expect(screen.getByText('Dual phone numbers')).toBeInTheDocument()

    // Corporate features
    expect(screen.getByText('Company information')).toBeInTheDocument()
    expect(screen.getByText('GST validation')).toBeInTheDocument()
    expect(screen.getByText('Business documents')).toBeInTheDocument()
    expect(screen.getByText('Corporate structure')).toBeInTheDocument()
  })

  it('navigates to correct route when personal client is selected', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector />
    )

    const personalClientCard = screen.getByText('Personal Client').closest('[role="button"], div[class*="cursor-pointer"]')
    if (personalClientCard) {
      await user.click(personalClientCard)
    } else {
      const createButton = screen.getAllByText(/Create Personal Client/)[0]
      await user.click(createButton)
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/personal')
    })
  })

  it('navigates to correct route when family/employee client is selected', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector />
    )

    const familyEmployeeCard = screen.getByText('Family/Employee Client').closest('[role="button"], div[class*="cursor-pointer"]')
    if (familyEmployeeCard) {
      await user.click(familyEmployeeCard)
    } else {
      const createButton = screen.getAllByText(/Create Family\/Employee Client/)[0]
      await user.click(createButton)
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/family-employee')
    })
  })

  it('navigates to correct route when corporate client is selected', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector />
    )

    const corporateCard = screen.getByText('Corporate Client').closest('[role="button"], div[class*="cursor-pointer"]')
    if (corporateCard) {
      await user.click(corporateCard)
    } else {
      const createButton = screen.getAllByText(/Create Corporate Client/)[0]
      await user.click(createButton)
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/corporate')
    })
  })

  it('calls onSelect callback when provided', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector onSelect={mockOnSelect} />
    )

    const personalClientCard = screen.getByText('Personal Client').closest('[role="button"], div[class*="cursor-pointer"]')
    if (personalClientCard) {
      await user.click(personalClientCard)
    }

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('PERSONAL')
    })
  })

  it('does not navigate when showNavigation is false', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector showNavigation={false} onSelect={mockOnSelect} />
    )

    const personalClientCard = screen.getByText('Personal Client').closest('[role="button"], div[class*="cursor-pointer"]')
    if (personalClientCard) {
      await user.click(personalClientCard)
    }

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockOnSelect).toHaveBeenCalledWith('PERSONAL')
  })

  it('highlights selected client type', () => {
    renderWithProviders(
      <ClientTypeSelector selectedType="PERSONAL" showNavigation={false} />
    )

    const personalCard = screen.getByText('Personal Client').closest('div')
    expect(personalCard).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('shows selected client type information when showNavigation is false', () => {
    renderWithProviders(
      <ClientTypeSelector selectedType="PERSONAL" showNavigation={false} />
    )

    expect(screen.getByText('Selected:')).toBeInTheDocument()
    expect(screen.getByText('Personal Client')).toBeInTheDocument()
  })

  it('displays icons for each client type', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    // Check that icons are rendered (they should be SVG elements)
    const icons = screen.getAllByRole('img', { hidden: true })
    expect(icons.length).toBeGreaterThanOrEqual(3)
  })

  it('handles hover effects', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientTypeSelector />
    )

    const personalCard = screen.getByText('Personal Client').closest('div')
    
    if (personalCard) {
      await user.hover(personalCard)
      // The hover effect should apply transform scale
      expect(personalCard).toHaveClass('transform', 'scale-105')
      
      await user.unhover(personalCard)
    }
  })

  it('renders create buttons for each client type', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    expect(screen.getByText('Create Personal Client')).toBeInTheDocument()
    expect(screen.getByText('Create Family/Employee Client')).toBeInTheDocument()
    expect(screen.getByText('Create Corporate Client')).toBeInTheDocument()
  })

  it('displays page title and description', () => {
    renderWithProviders(
      <ClientTypeSelector />
    )

    expect(screen.getByText('Select Client Type')).toBeInTheDocument()
    expect(screen.getByText('Choose the type of client you want to create to access the appropriate form')).toBeInTheDocument()
  })
})