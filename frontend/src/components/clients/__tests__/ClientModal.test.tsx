import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockClients } from '@/test/utils'
import { ClientModal } from '../ClientModal'

const mockOnSubmit = vi.fn()
const mockOnClose = vi.fn()

describe('ClientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add client modal correctly', () => {
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    expect(screen.getByText('Add New Client')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toBeInTheDocument()
  })

  it('renders edit client modal with pre-filled data', () => {
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="edit"
        client={mockClients[0]}
      />
    )
    
    expect(screen.getByText('Edit Client')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1111111111')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Phone is required')).toBeInTheDocument()
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates phone format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const phoneInput = screen.getByLabelText('Phone')
    await user.type(phoneInput, '123')
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Phone must be 10 digits')).toBeInTheDocument()
    })
  })

  it('validates date of birth is in the past', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    const dobInput = screen.getByLabelText('Date of Birth')
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    await user.type(dobInput, futureDate.toISOString().split('T')[0])
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    await user.type(screen.getByLabelText('Full Name'), 'Test Client')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Phone'), '1234567890')
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01')
    await user.type(screen.getByLabelText('Address'), '123 Test St')
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: '123 Test St',
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
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
      <ClientModal 
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    expect(screen.queryByText('Add New Client')).not.toBeInTheDocument()
  })

  it('handles optional address field correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ClientModal 
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="add"
      />
    )
    
    // Fill required fields only
    await user.type(screen.getByLabelText('Full Name'), 'Test Client')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Phone'), '1234567890')
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01')
    
    const submitButton = screen.getByText('Add Client')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: '',
      })
    })
  })
})