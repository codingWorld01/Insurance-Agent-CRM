import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockLeads } from '@/test/utils'
import { LeadModal } from '../LeadModal'

const mockOnSubmit = vi.fn()
const mockOnClose = vi.fn()

describe('LeadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add lead modal correctly', () => {
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    expect(screen.getByText('Add New Lead')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
    expect(screen.getByLabelText('Insurance Interest')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('renders edit lead modal with pre-filled data', () => {
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="edit"
        lead={mockLeads[0]}
      />
    )
    
    expect(screen.getByText('Edit Lead')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const submitButton = screen.getByText('Add Lead')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Phone is required')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByText('Add Lead')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates phone format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const phoneInput = screen.getByLabelText('Phone')
    await user.type(phoneInput, '123')
    
    const submitButton = screen.getByText('Add Lead')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Phone must be 10 digits')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    await user.type(screen.getByLabelText('Full Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Phone'), '1234567890')
    
    const submitButton = screen.getByText('Add Lead')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        insuranceInterest: 'Life',
        status: 'New',
        priority: 'Warm',
        notes: '',
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    renderWithProviders(
      <LeadModal 
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    expect(screen.queryByText('Add New Lead')).not.toBeInTheDocument()
  })

  it('handles dropdown selections correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <LeadModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    // Test insurance interest dropdown
    const insuranceSelect = screen.getByLabelText('Insurance Interest')
    await user.selectOptions(insuranceSelect, 'Health')
    expect(screen.getByDisplayValue('Health')).toBeInTheDocument()
    
    // Test status dropdown
    const statusSelect = screen.getByLabelText('Status')
    await user.selectOptions(statusSelect, 'Contacted')
    expect(screen.getByDisplayValue('Contacted')).toBeInTheDocument()
    
    // Test priority dropdown
    const prioritySelect = screen.getByLabelText('Priority')
    await user.selectOptions(prioritySelect, 'Hot')
    expect(screen.getByDisplayValue('Hot')).toBeInTheDocument()
  })
})