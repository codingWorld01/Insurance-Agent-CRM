import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/sonner'

// Mock user for authenticated tests
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
}

// Mock auth context values
export const mockAuthContextValue = {
  user: mockUser,
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  isAuthenticated: true,
}

// Mock the AuthProvider
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContextValue,
}))

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authenticated?: boolean
}

export function renderWithProviders(
  ui: React.ReactElement,
  { authenticated = false, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  statusCode: success ? 200 : 400,
  message: success ? 'Success' : 'Error',
})

// Mock fetch responses
export const mockFetch = (response: unknown, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: vi.fn().mockResolvedValue(response),
  })
}

// Mock leads data
export const mockLeads = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    insuranceInterest: 'Life' as const,
    status: 'New' as const,
    priority: 'Hot' as const,
    notes: 'Interested in life insurance',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    insuranceInterest: 'Auto' as const,
    status: 'Contacted' as const,
    priority: 'Warm' as const,
    notes: 'Looking for auto insurance',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

// Mock policies data
export const mockPolicies = [
  {
    id: '1',
    policyNumber: 'POL-001',
    policyType: 'Life' as const,
    provider: 'Life Insurance Co',
    premiumAmount: 1000,
    commissionAmount: 100,
    status: 'Active' as const,
    startDate: '2024-01-01T00:00:00Z',
    expiryDate: '2025-01-01T00:00:00Z',
    clientId: 'client-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    policyNumber: 'POL-002',
    policyType: 'Auto' as const,
    provider: 'Auto Insurance Co',
    premiumAmount: 800,
    commissionAmount: 80,
    status: 'Active' as const,
    startDate: '2024-02-01T00:00:00Z',
    expiryDate: '2025-02-01T00:00:00Z',
    clientId: 'client-1',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
]

// Mock clients data
export const mockClients = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '1111111111',
    dateOfBirth: '1990-01-01',
    address: '123 Main St',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    policies: [],
  },
  {
    id: '2',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: '2222222222',
    dateOfBirth: '1985-05-15',
    address: '456 Oak Ave',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    policies: [],
  },
]

// Mock dashboard stats
export const mockDashboardStats = {
  totalLeads: 25,
  totalClients: 15,
  activePolices: 30,
  commissionThisMonth: 5000,
  leadsChange: 15.5,
  clientsChange: 8.2,
  policiesChange: 12.1,
  commissionChange: 22.3,
}

// Mock chart data
export const mockChartData = [
  { status: 'New', count: 10 },
  { status: 'Contacted', count: 8 },
  { status: 'Qualified', count: 5 },
  { status: 'Won', count: 2 },
  { status: 'Lost', count: 3 },
]

// Mock activities
export const mockActivities = [
  {
    id: '1',
    action: 'lead_created',
    description: 'Created new lead: John Doe',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    action: 'client_added',
    description: 'Added new client: Alice Johnson',
    createdAt: '2024-01-01T09:00:00Z',
  },
]

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))