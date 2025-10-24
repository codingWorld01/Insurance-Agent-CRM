import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockClients } from '@/test/utils'
import { ClientsTable } from '../ClientsTable'
import { beforeEach } from 'node:test'

const mockOnEdit = vi.fn()
const mockOnDelete = vi.fn()
const mockOnView = vi.fn()

describe('ClientsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays client data correctly', () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('1111111111')).toBeInTheDocument()
    
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    expect(screen.getByText('2222222222')).toBeInTheDocument()
  })

  it('calculates and displays age correctly', () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    // Should calculate age from date of birth
    // Alice born 1990-01-01 should be around 34 years old
    // Bob born 1985-05-15 should be around 39 years old
    const ageElements = screen.getAllByText(/\d+ years/)
    expect(ageElements.length).toBeGreaterThan(0)
  })

  it('displays policy count correctly', () => {
    const clientsWithPolicies = [
      {
        ...mockClients[0],
        policies: [
          { id: '1', policyNumber: 'P001' },
          { id: '2', policyNumber: 'P002' },
        ],
      },
    ]
    
    renderWithProviders(
      <ClientsTable 
        clients={clientsWithPolicies} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', async () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const viewButtons = screen.getAllByLabelText(/View details for/)
    fireEvent.click(viewButtons[0])
    
    await waitFor(() => {
      expect(mockOnView).toHaveBeenCalledWith(mockClients[0])
    })
  })

  it('calls onEdit when edit button is clicked', async () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const editButtons = screen.getAllByLabelText(/Edit/)
    fireEvent.click(editButtons[0])
    
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(mockClients[0])
    })
  })

  it('calls onDelete when delete button is clicked', async () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const deleteButtons = screen.getAllByLabelText(/Delete/)
    fireEvent.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockClients[0])
    })
  })

  it('handles empty clients list', () => {
    renderWithProviders(
      <ClientsTable 
        clients={[]} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByText('No clients found')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderWithProviders(
      <ClientsTable 
        clients={[]} 
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays relative time for dates', () => {
    renderWithProviders(
      <ClientsTable 
        clients={mockClients} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    // Should display relative time (e.g., "3 years ago")
    const timeElements = screen.getAllByText(/ago/)
    expect(timeElements.length).toBeGreaterThan(0)
  })
})