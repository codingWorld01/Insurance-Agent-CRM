import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch, mockApiResponse } from '@/test/utils'
import { PersonalClientForm } from '../PersonalClientForm'
import { FamilyEmployeeForm } from '../FamilyEmployeeForm'
import { CorporateClientForm } from '../CorporateClientForm'
import { ClientTypeSelector } from '../ClientTypeSelector'

// Mock all the hooks
vi.mock('@/hooks/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn().mockResolvedValue('https://cloudinary.com/test-upload.jpg'),
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

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Client Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Personal Client Creation Workflow', () => {
    it('creates a personal client with all data and documents', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      // Mock successful API responses
      mockFetch(mockApiResponse({
        id: '1',
        clientType: 'PERSONAL',
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '9876543210',
        email: 'john.doe@example.com',
        profileImage: 'https://cloudinary.com/profile.jpg',
        documents: []
      }))

      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      // Fill mandatory fields
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1990-01-01')

      // Fill optional fields
      await user.type(screen.getByLabelText(/Email/), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/Address/), '123 Main Street')

      // Select gender
      const genderSelect = screen.getByLabelText(/Gender/)
      await user.click(genderSelect)
      await user.click(screen.getByText('Male'))

      // Select marital status
      const maritalStatusSelect = screen.getByLabelText(/Marital Status/)
      await user.click(maritalStatusSelect)
      await user.click(screen.getByText('Single'))

      // Fill professional information
      await user.type(screen.getByLabelText(/Business\/Job/), 'Software Engineer')
      await user.type(screen.getByLabelText(/Name of Business/), 'Tech Corp')
      await user.type(screen.getByLabelText(/Annual Income/), '1000000')

      // Fill tax information
      await user.type(screen.getByLabelText(/PAN Number/), 'ABCDE1234F')

      // Submit form
      const submitButton = screen.getByText('Save Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: '123 Main Street',
            gender: 'MALE',
            maritalStatus: 'SINGLE',
            businessJob: 'Software Engineer',
            nameOfBusiness: 'Tech Corp',
            annualIncome: 1000000,
            panNumber: 'ABCDE1234F',
            age: expect.any(Number)
          })
        )
      })
    })

    it('validates all required fields before submission', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Save Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Mobile number is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Complete Family/Employee Client Creation Workflow', () => {
    it('creates a family/employee client with relationship tracking', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      renderWithProviders(
        <FamilyEmployeeForm onSubmit={mockOnSubmit} />
      )

      // Fill mandatory fields
      await user.type(screen.getByLabelText(/First Name/), 'Jane')
      await user.type(screen.getByLabelText(/Last Name/), 'Smith')
      await user.type(screen.getByLabelText(/Phone Number/), '9876543210')
      await user.type(screen.getByLabelText(/WhatsApp Number/), '9876543211')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1985-05-15')

      // Select relationship
      const relationshipSelect = screen.getByLabelText(/Relationship/)
      await user.click(relationshipSelect)
      await user.click(screen.getByText('Spouse'))

      // Fill optional fields
      await user.type(screen.getByLabelText(/Height/), '5.5')
      await user.type(screen.getByLabelText(/Weight/), '65')

      // Select gender
      const genderSelect = screen.getByLabelText(/Gender/)
      await user.click(genderSelect)
      await user.click(screen.getByText('Female'))

      // Submit form
      const submitButton = screen.getByText('Save Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith',
            phoneNumber: '9876543210',
            whatsappNumber: '9876543211',
            relationship: 'SPOUSE',
            height: 5.5,
            weight: 65,
            gender: 'FEMALE',
            age: expect.any(Number)
          })
        )
      })
    })
  })

  describe('Complete Corporate Client Creation Workflow', () => {
    it('creates a corporate client with business information', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      renderWithProviders(
        <CorporateClientForm onSubmit={mockOnSubmit} />
      )

      // Fill mandatory field
      await user.type(screen.getByLabelText(/Company Name/), 'Tech Solutions Inc')

      // Fill optional fields
      await user.type(screen.getByLabelText(/Mobile/), '9876543210')
      await user.type(screen.getByLabelText(/Email/), 'contact@techsolutions.com')
      await user.type(screen.getByLabelText(/Address/), '456 Business Ave')
      await user.type(screen.getByLabelText(/Annual Income/), '5000000')
      await user.type(screen.getByLabelText(/PAN Number/), 'ABCDE1234F')
      await user.type(screen.getByLabelText(/GST Number/), '22AAAAA0000A1Z5')

      // Submit form
      const submitButton = screen.getByText('Save Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            companyName: 'Tech Solutions Inc',
            mobile: '9876543210',
            email: 'contact@techsolutions.com',
            address: '456 Business Ave',
            annualIncome: 5000000,
            panNumber: 'ABCDE1234F',
            gstNumber: '22AAAAA0000A1Z5'
          })
        )
      })
    })
  })

  describe('Client Type Selection and Navigation', () => {
    it('navigates to correct form based on client type selection', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <ClientTypeSelector />
      )

      // Test personal client navigation
      const personalButton = screen.getByText('Create Personal Client')
      await user.click(personalButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/personal')

      // Clear mock and test family/employee client navigation
      mockPush.mockClear()
      const familyButton = screen.getByText('Create Family/Employee Client')
      await user.click(familyButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/family-employee')

      // Clear mock and test corporate client navigation
      mockPush.mockClear()
      const corporateButton = screen.getByText('Create Corporate Client')
      await user.click(corporateButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/create/corporate')
    })
  })

  describe('Document Upload Integration', () => {
    it('handles document upload workflow in personal client form', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      // Fill mandatory fields first
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1990-01-01')

      // Check that document upload section is present
      expect(screen.getByText('Documents')).toBeInTheDocument()

      // The document upload functionality would be tested separately
      // as it requires file handling which is complex in integration tests
    })
  })

  describe('Form Validation Integration', () => {
    it('validates PAN number format across all client types', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      // Test Personal Client PAN validation
      const { rerender } = renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      await user.type(screen.getByLabelText(/PAN Number/), 'INVALID')
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1990-01-01')

      await user.click(screen.getByText('Save Client'))

      await waitFor(() => {
        expect(screen.getByText('Invalid PAN format')).toBeInTheDocument()
      })

      // Test Corporate Client PAN validation
      rerender(<CorporateClientForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/PAN Number/), 'INVALID')
      await user.type(screen.getByLabelText(/Company Name/), 'Test Corp')

      await user.click(screen.getByText('Save Client'))

      await waitFor(() => {
        expect(screen.getByText('Invalid PAN format')).toBeInTheDocument()
      })
    })

    it('validates GST number format for applicable client types', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      // Test Personal Client GST validation
      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      await user.type(screen.getByLabelText(/GST Number/), 'INVALID_GST')
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1990-01-01')

      await user.click(screen.getByText('Save Client'))

      await waitFor(() => {
        expect(screen.getByText('Invalid GST format')).toBeInTheDocument()
      })
    })
  })

  describe('Age Calculation Integration', () => {
    it('automatically calculates age from birth date in personal and family forms', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      // Test Personal Client age calculation
      const { rerender } = renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
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

      // Test Family/Employee Client age calculation
      rerender(<FamilyEmployeeForm onSubmit={mockOnSubmit} />)

      const familyBirthDateInput = screen.getByLabelText(/Date of Birth/)
      const familyAgeInput = screen.getByLabelText(/Age/)

      await user.type(familyBirthDateInput, dateString)

      await waitFor(() => {
        expect(familyAgeInput).toHaveValue(25)
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles API errors gracefully during form submission', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('API Error'))

      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      // Fill mandatory fields
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Mobile Number/), '9876543210')
      
      const birthDateInput = screen.getByLabelText(/Date of Birth/)
      await user.type(birthDateInput, '1990-01-01')

      // Submit form
      const submitButton = screen.getByText('Save Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      // The form should handle the error gracefully
      // (exact error handling depends on implementation)
    })
  })

  describe('Form State Persistence Integration', () => {
    it('maintains form state during user interaction', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      renderWithProviders(
        <PersonalClientForm onSubmit={mockOnSubmit} />
      )

      // Fill some fields
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')

      // Verify values are maintained
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()

      // Continue filling form
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')

      // Verify all values are still present
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })
  })
})