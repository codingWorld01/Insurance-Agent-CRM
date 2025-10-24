import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockChartData } from '@/test/utils'
import { LeadsChart } from '../LeadsChart'

describe('LeadsChart', () => {
  it('renders chart with correct title', () => {
    renderWithProviders(<LeadsChart data={mockChartData} />)
    
    expect(screen.getByText('Leads by Status')).toBeInTheDocument()
  })

  it('renders chart container', () => {
    renderWithProviders(<LeadsChart data={mockChartData} />)
    
    // Check if the chart container is rendered
    const chartContainer = screen.getByRole('img', { hidden: true })
    expect(chartContainer).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    renderWithProviders(<LeadsChart data={[]} />)
    
    expect(screen.getByText('Leads by Status')).toBeInTheDocument()
    // Chart should still render even with empty data
    const chartContainer = screen.getByRole('img', { hidden: true })
    expect(chartContainer).toBeInTheDocument()
  })

  it('renders with different data sets', () => {
    const customData = [
      { status: 'New', count: 5 },
      { status: 'Won', count: 3 },
    ]
    
    renderWithProviders(<LeadsChart data={customData} />)
    
    expect(screen.getByText('Leads by Status')).toBeInTheDocument()
  })
})