import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockDashboardStats } from '@/test/utils'
import { StatsCards } from '../StatsCards'

describe('StatsCards', () => {
  it('renders all four stat cards with correct values', () => {
    renderWithProviders(<StatsCards stats={mockDashboardStats} />)
    
    expect(screen.getByText('Total Leads')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    
    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    
    expect(screen.getByText('Active Policies')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    
    expect(screen.getByText('Commission This Month')).toBeInTheDocument()
    expect(screen.getByText('₹5,000')).toBeInTheDocument()
  })

  it('displays percentage changes correctly', () => {
    renderWithProviders(<StatsCards stats={mockDashboardStats} />)
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument()
    expect(screen.getByText('+8.2%')).toBeInTheDocument()
    expect(screen.getByText('+12.1%')).toBeInTheDocument()
    expect(screen.getByText('+22.3%')).toBeInTheDocument()
  })

  it('handles negative percentage changes', () => {
    const statsWithNegativeChange = {
      ...mockDashboardStats,
      leadsChange: -5.2,
      commissionChange: -10.1,
    }
    
    renderWithProviders(<StatsCards stats={statsWithNegativeChange} />)
    
    expect(screen.getByText('-5.2%')).toBeInTheDocument()
    expect(screen.getByText('-10.1%')).toBeInTheDocument()
  })

  it('handles zero values correctly', () => {
    const zeroStats = {
      totalLeads: 0,
      totalClients: 0,
      activePolices: 0,
      commissionThisMonth: 0,
      leadsChange: 0,
      clientsChange: 0,
      policiesChange: 0,
      commissionChange: 0,
    }
    
    renderWithProviders(<StatsCards stats={zeroStats} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('₹0')).toBeInTheDocument()
    expect(screen.getAllByText('0%')).toHaveLength(4)
  })

  it('formats commission amount correctly', () => {
    const statsWithLargeCommission = {
      ...mockDashboardStats,
      commissionThisMonth: 123456.78,
    }
    
    renderWithProviders(<StatsCards stats={statsWithLargeCommission} />)
    
    expect(screen.getByText('₹1,23,457')).toBeInTheDocument()
  })
})