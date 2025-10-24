import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockActivities } from '@/test/utils'
import { RecentActivities } from '../RecentActivities'

describe('RecentActivities', () => {
  it('renders activities list with correct title', () => {
    renderWithProviders(<RecentActivities activities={mockActivities} />)
    
    expect(screen.getByText('Recent Activities')).toBeInTheDocument()
  })

  it('displays all activities', () => {
    renderWithProviders(<RecentActivities activities={mockActivities} />)
    
    expect(screen.getByText('Created new lead: John Doe')).toBeInTheDocument()
    expect(screen.getByText('Added new client: Alice Johnson')).toBeInTheDocument()
  })

  it('displays relative timestamps', () => {
    renderWithProviders(<RecentActivities activities={mockActivities} />)
    
    // Should display some form of time indication
    const timeElements = screen.getAllByText(/ago|hours|minutes|days/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('handles empty activities list', () => {
    renderWithProviders(<RecentActivities activities={[]} />)
    
    expect(screen.getByText('Recent Activities')).toBeInTheDocument()
    expect(screen.getByText('No recent activities')).toBeInTheDocument()
  })

  it('limits activities to maximum of 5', () => {
    const manyActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      action: 'test_action',
      description: `Activity ${i + 1}`,
      createdAt: new Date().toISOString(),
    }))
    
    renderWithProviders(<RecentActivities activities={manyActivities} />)
    
    // Should only show first 5 activities
    expect(screen.getByText('Activity 1')).toBeInTheDocument()
    expect(screen.getByText('Activity 5')).toBeInTheDocument()
    expect(screen.queryByText('Activity 6')).not.toBeInTheDocument()
  })
})