import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { PersonalClientForm } from '../PersonalClientForm'

// Mock hooks
vi.mock('@/hooks/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn().mockResolvedValue('https://cloudinary.com/test-image.jpg'),
    isUploading: false,
  }),
}))

vi.mock('@/hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: false,
    isTouchDevice: false,
  }),
}))

vi.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: () => ({
    clearSavedData: vi.fn(),
    getSavedDataInfo: vi.fn(() => ({ hasData: false })),
    saveNow: vi.fn(),
    lastSaveTime: null,
  }),
}))

vi.mock('@/hooks/useEnhancedFileUpload', () => ({
  useEnhancedFileUpload: () => ({
    upload: vi.fn().mockResolvedValue('https://cloudinary.com/test-document.pdf'),
    isUploading: false,
  }),
}))

const mockOnSubmit = vi.fn()

describe('PersonalClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all required form fields', () => {
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    // Check mandatory fields
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mobile Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of Birth/)).toBeInTheDocument()

    // Check optional fields
    expect(screen.getByLabelText(/Middle Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/State/)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Birth Place/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Gender/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Height/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weight/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Education/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Marital Status/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Business\/Job/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Name of Business/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type of Duty/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Annual Income/)).toBeInTheDocument()
    expect(screen.getByLabelText(/PAN Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/GST Number/)).toBeInTheDocument()
  })

  it('validates mandatory fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Mobile number is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('auto-calculates age from birth date', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    const ageInput = screen.getByLabelText(/Age/)

    // Set birth date to 30 years ago
    const thirtyYearsAgo = new Date()
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30)
    const dateString = thirtyYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)

    await waitFor(() => {
      expect(ageInput).toHaveValue(30)
    })
  })

  it('validates PAN number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    await user.type(panInput, 'INVALID_PAN')

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid PAN format')).toBeInTheDocument()
    })
  })

  it('validates GST number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const gstInput = screen.getByLabelText(/GST Number/)
    await user.type(gstInput, 'INVALID_GST')

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid GST format')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const emailInput = screen.getByLabelText(/Email/)
    await user.type(emailInput, 'invalid-email')

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    // Fill some optional fields
    await user.type(screen.getByLabelText(/Email/), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/Address/), '123 Main St')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          mobileNumber: '9876543210',
          email: 'john.doe@example.com',
          address: '123 Main St',
        })
      )
    })
  })

  it('pre-fills form with initial data', () => {
    const initialData = {
      firstName: 'Jane',
      lastName: 'Smith',
      mobileNumber: '9876543210',
      email: 'jane.smith@example.com',
      birthDate: '1985-05-15',
    }

    renderWithProviders(
      <PersonalClientForm 
        onSubmit={mockOnSubmit} 
        initialData={initialData}
      />
    )

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument()
  })

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm 
        onSubmit={mockOnSubmit} 
        isLoading={true}
      />
    )

    const submitButton = screen.getByText('Saving...')
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
  })

  it('converts PAN and GST to uppercase', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    const gstInput = screen.getByLabelText(/GST Number/)

    await user.type(panInput, 'abcde1234f')
    await user.type(gstInput, '22aaaaa0000a1z5')

    expect(panInput).toHaveValue('ABCDE1234F')
    expect(gstInput).toHaveValue('22AAAAA0000A1Z5')
  })

  it('handles profile image upload', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    // Check that profile image upload section is present
    expect(screen.getByText('Profile Image')).toBeInTheDocument()
  })

  it('handles document upload', async () => {
    renderWithProviders(
      <PersonalClientForm onSubmit={mockOnSubmit} />
    )

    // Check that document upload section is present
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })
})