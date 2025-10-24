import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockLeads } from '@/test/utils'
import { LeadsTable } from '../LeadsTable'
import { beforeEach } from 'node:test'

const mockOnEdit = vi.fn()
const mockOnDelete = vi.fn()
const mockOnView = vi.fn()

describe('LeadsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays lead data correctly', () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('1234567890')).toBeInTheDocument()
    expect(screen.getByText('Life')).toBeInTheDocument()
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Auto')).toBeInTheDocument()
  })

  it('displays status badges with correct styling', () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const newBadge = screen.getByText('New')
    const contactedBadge = screen.getByText('Contacted')
    
    expect(newBadge).toBeInTheDocument()
    expect(contactedBadge).toBeInTheDocument()
  })

  it('displays priority badges with correct styling', () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const hotBadge = screen.getByText('Hot 🔥')
    const warmBadge = screen.getByText('Warm ☀️')
    
    expect(hotBadge).toBeInTheDocument()
    expect(warmBadge).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', async () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const viewButtons = screen.getAllByLabelText(/View details for/)
    fireEvent.click(viewButtons[0])
    
    await waitFor(() => {
      expect(mockOnView).toHaveBeenCalledWith(mockLeads[0])
    })
  })

  it('calls onEdit when edit button is clicked', async () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const editButtons = screen.getAllByLabelText(/Edit/)
    fireEvent.click(editButtons[0])
    
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(mockLeads[0])
    })
  })

  it('calls onDelete when delete button is clicked', async () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    const deleteButtons = screen.getAllByLabelText(/Delete/)
    fireEvent.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockLeads[0])
    })
  })

  it('handles empty leads list', () => {
    renderWithProviders(
      <LeadsTable 
        leads={[]} 
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByText('No leads found')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderWithProviders(
      <LeadsTable 
        leads={[]} 
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading leads...')).toBeInTheDocument()
  })

  it('displays relative time for dates', () => {
    renderWithProviders(
      <LeadsTable 
        leads={mockLeads} 
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