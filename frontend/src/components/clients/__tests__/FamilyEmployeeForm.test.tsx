import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { FamilyEmployeeForm } from '../FamilyEmployeeForm'

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

const mockOnSubmit = vi.fn()

describe('FamilyEmployeeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all required form fields', () => {
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    // Check mandatory fields
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/WhatsApp Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of Birth/)).toBeInTheDocument()

    // Check optional fields
    expect(screen.getByLabelText(/Middle Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Age/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Height/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weight/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Gender/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Relationship/)).toBeInTheDocument()
    expect(screen.getByLabelText(/PAN Number/)).toBeInTheDocument()
  })

  it('validates mandatory fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Phone number is required')).toBeInTheDocument()
      expect(screen.getByText('WhatsApp number is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('auto-calculates age from date of birth', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    const ageInput = screen.getByLabelText(/Age/)

    // Set birth date to 25 years ago
    const twentyFiveYearsAgo = new Date()
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25)
    const dateString = twentyFiveYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)

    await waitFor(() => {
      expect(ageInput).toHaveValue(25)
    })
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const phoneInput = screen.getByLabelText(/Phone Number/)
    await user.type(phoneInput, '123')

    // Fill other mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/WhatsApp Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid phone number')).toBeInTheDocument()
    })
  })

  it('validates WhatsApp number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const whatsappInput = screen.getByLabelText(/WhatsApp Number/)
    await user.type(whatsappInput, '123')

    // Fill other mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Phone Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid WhatsApp number')).toBeInTheDocument()
    })
  })

  it('validates PAN number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    await user.type(panInput, 'INVALID_PAN')

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Phone Number/), '9876543210')
    await user.type(screen.getByLabelText(/WhatsApp Number/), '9876543210')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid PAN format')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    // Fill mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Phone Number/), '9876543210')
    await user.type(screen.getByLabelText(/WhatsApp Number/), '9876543211')
    
    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    await user.type(birthDateInput, '1990-01-01')

    // Select relationship
    const relationshipSelect = screen.getByLabelText(/Relationship/)
    await user.click(relationshipSelect)
    await user.click(screen.getByText('Spouse'))

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '9876543210',
          whatsappNumber: '9876543211',
          relationship: 'SPOUSE',
        })
      )
    })
  })

  it('displays relationship options correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const relationshipSelect = screen.getByLabelText(/Relationship/)
    await user.click(relationshipSelect)

    // Check all relationship options are present
    expect(screen.getByText('Spouse')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Sibling')).toBeInTheDocument()
    expect(screen.getByText('Employee')).toBeInTheDocument()
    expect(screen.getByText('Dependent')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('pre-fills form with initial data', () => {
    const initialData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '9876543210',
      whatsappNumber: '9876543211',
      dateOfBirth: '1985-05-15',
      relationship: 'SPOUSE' as const,
    }

    renderWithProviders(
      <FamilyEmployeeForm 
        onSubmit={mockOnSubmit} 
        initialData={initialData}
      />
    )

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543211')).toBeInTheDocument()
  })

  it('shows loading state when submitting', async () => {
    renderWithProviders(
      <FamilyEmployeeForm 
        onSubmit={mockOnSubmit} 
        isLoading={true}
      />
    )

    const submitButton = screen.getByText('Saving...')
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
  })

  it('converts PAN to uppercase', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    await user.type(panInput, 'abcde1234f')

    expect(panInput).toHaveValue('ABCDE1234F')
  })

  it('validates birth date is in the past', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <FamilyEmployeeForm onSubmit={mockOnSubmit} />
    )

    const birthDateInput = screen.getByLabelText(/Date of Birth/)
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const dateString = futureDate.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)

    // Fill other mandatory fields
    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Phone Number/), '9876543210')
    await user.type(screen.getByLabelText(/WhatsApp Number/), '9876543211')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument()
    })
  })
})