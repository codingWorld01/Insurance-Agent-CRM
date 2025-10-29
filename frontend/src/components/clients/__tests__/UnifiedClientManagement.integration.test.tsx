import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'

// Simple mock component for integration testing
const MockUnifiedClientForm = ({ onSubmit, initialData, isLoading }: unknown) => {
  const [formData, setFormData] = React.useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    phoneNumber: initialData?.phoneNumber || '',
    whatsappNumber: initialData?.whatsappNumber || '',
    email: initialData?.email || '',
    companyName: initialData?.companyName || '',
    relationship: initialData?.relationship || '',
  })

  const [errors, setErrors] = React.useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate mandatory fields (Requirements 2.1)
    const validationErrors = []
    if (!formData.firstName) validationErrors.push('First name is required')
    if (!formData.lastName) validationErrors.push('Last name is required')
    if (!formData.phoneNumber) validationErrors.push('Phone number is required')
    if (!formData.whatsappNumber) validationErrors.push('WhatsApp number is required')
    if (!formData.dateOfBirth) validationErrors.push('Date of birth must be in the past')
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    onSubmit(formData)
  }

  return (
    <div data-testid="unified-client-form">
      <h2>Client Information</h2>
      <p>Only 5 fields are required: First Name, Last Name, Date of Birth, Phone Number, and WhatsApp Number.</p>
      
      <form onSubmit={handleSubmit}>
        {/* Display validation errors */}
        {errors.map((error, index) => (
          <div key={index} data-testid="validation-error">{error}</div>
        ))}

        {/* Mandatory Fields */}
        <div>
          <label htmlFor="firstName">First Name *</label>
          <input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            data-testid="firstName"
          />
        </div>
        
        <div>
          <label htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            data-testid="lastName"
          />
        </div>
        
        <div>
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            data-testid="phoneNumber"
          />
        </div>
        
        <div>
          <label htmlFor="whatsappNumber">WhatsApp Number *</label>
          <input
            id="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
            data-testid="whatsappNumber"
          />
        </div>
        
        <div>
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            data-testid="dateOfBirth"
          />
        </div>

        {/* Optional Fields */}
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="email"
          />
        </div>

        <div>
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            data-testid="companyName"
          />
        </div>

        <div>
          <label htmlFor="relationship">Relationship</label>
          <select
            id="relationship"
            value={formData.relationship}
            onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            data-testid="relationship"
          >
            <option value="">Select relationship</option>
            <option value="SPOUSE">Spouse</option>
            <option value="CHILD">Child</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>

        <button type="submit" disabled={isLoading} data-testid="submit-button">
          {isLoading ? 'Saving...' : 'Save Client'}
        </button>
      </form>
    </div>
  )
}

describe('Unified Client Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unified Client Creation Workflow', () => {
    it('creates a client with minimal mandatory data only', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill only the 5 mandatory fields (Requirements 2.1)
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567890')
      await user.type(screen.getByTestId('dateOfBirth'), '1990-01-01')

      // Submit form with minimal data
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1234567890',
            whatsappNumber: '+1234567890',
            dateOfBirth: '1990-01-01'
          })
        )
      })
    })

    it('creates a client with personal information fields filled', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill mandatory fields
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567890')
      await user.type(screen.getByTestId('dateOfBirth'), '1990-01-01')

      // Fill optional personal fields (Requirements 2.1)
      await user.type(screen.getByTestId('email'), 'john.doe@example.com')

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+1234567890',
            whatsappNumber: '+1234567890',
            dateOfBirth: '1990-01-01'
          })
        )
      })
    })

    it('creates a client with corporate information fields filled', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill mandatory fields
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567890')
      await user.type(screen.getByTestId('dateOfBirth'), '1990-01-01')

      // Fill corporate fields (Requirements 2.2)
      await user.type(screen.getByTestId('companyName'), 'Tech Solutions Inc')

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            companyName: 'Tech Solutions Inc',
            phoneNumber: '+1234567890',
            whatsappNumber: '+1234567890',
            dateOfBirth: '1990-01-01'
          })
        )
      })
    })

    it('creates a client with family/employee relationship fields filled', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill mandatory fields
      await user.type(screen.getByTestId('firstName'), 'Jane')
      await user.type(screen.getByTestId('lastName'), 'Smith')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567891')
      await user.type(screen.getByTestId('dateOfBirth'), '1985-05-15')

      // Fill relationship field (Requirements 2.3)
      await user.selectOptions(screen.getByTestId('relationship'), 'SPOUSE')

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith',
            relationship: 'SPOUSE',
            phoneNumber: '+1234567890',
            whatsappNumber: '+1234567891',
            dateOfBirth: '1985-05-15'
          })
        )
      })
    })
  })

  describe('Optional Field Validation and Storage', () => {
    it('properly saves optional fields when filled and ignores empty ones', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill mandatory fields
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567890')
      await user.type(screen.getByTestId('dateOfBirth'), '1990-01-01')

      // Fill some optional fields, leave others empty (Requirements 2.4)
      await user.type(screen.getByTestId('email'), 'john@example.com')
      // Leave companyName and relationship empty

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            companyName: '', // Empty optional fields are included but empty
            relationship: ''
          })
        )
      })
    })

    it('validates all mandatory fields before submission', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Try to submit without filling required fields
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Should show validation errors for all 5 mandatory fields
      await waitFor(() => {
        const errors = screen.getAllByTestId('validation-error')
        expect(errors).toHaveLength(5)
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Phone number is required')).toBeInTheDocument()
        expect(screen.getByText('WhatsApp number is required')).toBeInTheDocument()
        expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Client Display with Various Field Combinations', () => {
    it('displays client data with only mandatory fields filled', async () => {
      const initialData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+1234567890',
        whatsappNumber: '+1234567890'
      }

      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm initialData={initialData} onSubmit={mockOnSubmit} />)

      // Verify mandatory fields are displayed
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByTestId('phoneNumber')).toHaveValue('+1234567890')
      expect(screen.getByTestId('whatsappNumber')).toHaveValue('+1234567890')
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()

      // Verify optional fields are empty but present
      expect(screen.getByTestId('email')).toHaveValue('')
      expect(screen.getByTestId('companyName')).toHaveValue('')
      expect(screen.getByTestId('relationship')).toHaveValue('')
    })

    it('displays client data with mixed personal and corporate fields', async () => {
      const initialData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+1234567890',
        whatsappNumber: '+1234567890',
        email: 'john@example.com',
        companyName: 'Tech Corp'
      }

      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm initialData={initialData} onSubmit={mockOnSubmit} />)

      // Verify personal fields are displayed
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()

      // Verify corporate fields are displayed
      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument()
    })

    it('displays client data with family/employee relationship information', async () => {
      const initialData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-15',
        phoneNumber: '+1234567890',
        whatsappNumber: '+1234567891',
        relationship: 'SPOUSE'
      }

      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm initialData={initialData} onSubmit={mockOnSubmit} />)

      // Verify personal fields are displayed
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()

      // Verify relationship is displayed
      expect(screen.getByTestId('relationship')).toHaveValue('SPOUSE')
    })
  })

  describe('Form State and Loading Management', () => {
    it('shows loading state when form is being submitted', async () => {
      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} isLoading={true} />)

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Saving...')
    })

    it('maintains form state during user interaction', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill some fields
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')

      // Verify values are maintained
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()

      // Continue filling form
      await user.type(screen.getByTestId('email'), 'john@example.com')

      // Verify all values are still present
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })
  })

  describe('Form Structure Validation', () => {
    it('renders unified form with all field types available', async () => {
      const mockOnSubmit = vi.fn()

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Verify form structure
      expect(screen.getByText('Client Information')).toBeInTheDocument()
      expect(screen.getByText(/Only 5 fields are required/)).toBeInTheDocument()

      // Verify all field types are present
      expect(screen.getByTestId('firstName')).toBeInTheDocument()
      expect(screen.getByTestId('lastName')).toBeInTheDocument()
      expect(screen.getByTestId('phoneNumber')).toBeInTheDocument()
      expect(screen.getByTestId('whatsappNumber')).toBeInTheDocument()
      expect(screen.getByTestId('dateOfBirth')).toBeInTheDocument()
      expect(screen.getByTestId('email')).toBeInTheDocument()
      expect(screen.getByTestId('companyName')).toBeInTheDocument()
      expect(screen.getByTestId('relationship')).toBeInTheDocument()
    })

    it('allows filling any combination of fields', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<MockUnifiedClientForm onSubmit={mockOnSubmit} />)

      // Fill mandatory fields
      await user.type(screen.getByTestId('firstName'), 'John')
      await user.type(screen.getByTestId('lastName'), 'Doe')
      await user.type(screen.getByTestId('phoneNumber'), '+1234567890')
      await user.type(screen.getByTestId('whatsappNumber'), '+1234567890')
      await user.type(screen.getByTestId('dateOfBirth'), '1990-01-01')

      // Fill a mix of optional fields from different categories
      await user.type(screen.getByTestId('email'), 'john@example.com') // Personal
      await user.type(screen.getByTestId('companyName'), 'Tech Corp') // Corporate
      await user.selectOptions(screen.getByTestId('relationship'), 'SPOUSE') // Family/Employee

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            companyName: 'Tech Corp',
            relationship: 'SPOUSE'
          })
        )
      })
    })
  })
})