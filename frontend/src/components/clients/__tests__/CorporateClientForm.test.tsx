import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { CorporateClientForm } from '../CorporateClientForm'

// Mock hooks
vi.mock('@/hooks/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn().mockResolvedValue('https://cloudinary.com/test-document.pdf'),
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

describe('CorporateClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    // Check mandatory field
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument()

    // Check optional fields
    expect(screen.getByLabelText(/Mobile/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/State/)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Annual Income/)).toBeInTheDocument()
    expect(screen.getByLabelText(/PAN Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/GST Number/)).toBeInTheDocument()
  })

  it('validates mandatory company name field', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const emailInput = screen.getByLabelText(/Email/)
    await user.type(emailInput, 'invalid-email')

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  it('validates mobile number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const mobileInput = screen.getByLabelText(/Mobile/)
    await user.type(mobileInput, '123')

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid mobile number')).toBeInTheDocument()
    })
  })

  it('validates PAN number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    await user.type(panInput, 'INVALID_PAN')

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid PAN format')).toBeInTheDocument()
    })
  })

  it('validates GST number format', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const gstInput = screen.getByLabelText(/GST Number/)
    await user.type(gstInput, 'INVALID_GST')

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid GST format')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corporation')

    // Fill some optional fields
    await user.type(screen.getByLabelText(/Email/), 'contact@testcorp.com')
    await user.type(screen.getByLabelText(/Mobile/), '9876543210')
    await user.type(screen.getByLabelText(/Address/), '123 Business St')
    await user.type(screen.getByLabelText(/Annual Income/), '1000000')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Test Corporation',
          email: 'contact@testcorp.com',
          mobile: '9876543210',
          address: '123 Business St',
          annualIncome: 1000000,
        })
      )
    })
  })

  it('pre-fills form with initial data', () => {
    const initialData = {
      companyName: 'Existing Corp',
      email: 'existing@corp.com',
      mobile: '9876543210',
      address: '456 Corporate Ave',
      annualIncome: 5000000,
    }

    renderWithProviders(
      <CorporateClientForm 
        onSubmit={mockOnSubmit} 
        initialData={initialData}
      />
    )

    expect(screen.getByDisplayValue('Existing Corp')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing@corp.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument()
    expect(screen.getByDisplayValue('456 Corporate Ave')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000000')).toBeInTheDocument()
  })

  it('shows loading state when submitting', async () => {
    renderWithProviders(
      <CorporateClientForm 
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
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const panInput = screen.getByLabelText(/PAN Number/)
    const gstInput = screen.getByLabelText(/GST Number/)

    await user.type(panInput, 'abcde1234f')
    await user.type(gstInput, '22aaaaa0000a1z5')

    expect(panInput).toHaveValue('ABCDE1234F')
    expect(gstInput).toHaveValue('22AAAAA0000A1Z5')
  })

  it('handles document upload', async () => {
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    // Check that document upload section is present
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('validates company name length', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const companyNameInput = screen.getByLabelText(/Company Name/)
    const longName = 'A'.repeat(201) // Exceeds 200 character limit
    await user.type(companyNameInput, longName)

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Company name too long')).toBeInTheDocument()
    })
  })

  it('handles state and city selection', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    // Check that state and city selectors are present
    expect(screen.getByLabelText(/State/)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/)).toBeInTheDocument()
  })

  it('validates annual income is positive', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <CorporateClientForm onSubmit={mockOnSubmit} />
    )

    const annualIncomeInput = screen.getByLabelText(/Annual Income/)
    await user.type(annualIncomeInput, '-1000')

    // Fill mandatory field
    await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

    const submitButton = screen.getByText('Save Client')
    await user.click(submitButton)

    // The form should prevent negative values or show validation error
    await waitFor(() => {
      // Either the input prevents negative values or shows an error
      expect(annualIncomeInput.value === '' || screen.queryByText(/must be positive/)).toBeTruthy()
    })
  })
})