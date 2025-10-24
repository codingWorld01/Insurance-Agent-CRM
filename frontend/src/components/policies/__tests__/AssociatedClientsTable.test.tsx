import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AssociatedClientsTable } from '../AssociatedClientsTable';
import { PolicyInstanceWithClient } from '@/types';

// Mock the currency utils
vi.mock('@/utils/currencyUtils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

// Mock the date utils
vi.mock('@/utils/dateUtils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
  isExpiringSoon: (date: string) => {
    const expiryDate = new Date(date);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate <= thirtyDaysFromNow && expiryDate > now;
  },
}));

const mockInstances: PolicyInstanceWithClient[] = [
  {
    id: 'instance-1',
    policyTemplateId: 'template-1',
    clientId: 'client-1',
    premiumAmount: 1000,
    status: 'Active',
    startDate: '2024-01-01T00:00:00.000Z',
    expiryDate: '2025-01-01T00:00:00.000Z',
    commissionAmount: 100,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    client: {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    policyTemplate: {
      id: 'template-1',
      policyNumber: 'POL-001',
      policyType: 'Life',
      provider: 'Life Insurance Co',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'instance-2',
    policyTemplateId: 'template-1',
    clientId: 'client-2',
    premiumAmount: 1500,
    status: 'Expired',
    startDate: '2023-01-01T00:00:00.000Z',
    expiryDate: '2024-01-01T00:00:00.000Z',
    commissionAmount: 150,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    client: {
      id: 'client-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    policyTemplate: {
      id: 'template-1',
      policyNumber: 'POL-001',
      policyType: 'Life',
      provider: 'Life Insurance Co',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
];

describe('AssociatedClientsTable', () => {
  const mockOnEditInstance = vi.fn();
  const mockOnDeleteInstance = vi.fn();
  const mockOnClientClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with policy instances', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <AssociatedClientsTable
        instances={[]}
        loading={true}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('Loading clients...')).toBeInTheDocument();
  });

  it('shows empty state when no instances', () => {
    render(
      <AssociatedClientsTable
        instances={[]}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('No clients associated with this policy template')).toBeInTheDocument();
    expect(screen.getByText('Add clients to this policy template to see them here')).toBeInTheDocument();
  });

  it('displays formatted currency amounts', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$1500.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('1/1/2025')).toBeInTheDocument();
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
  });

  it('shows status badges with correct variants', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows expiry warning for policies expiring soon', () => {
    const expiringSoonInstance = {
      ...mockInstances[0],
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    };

    render(
      <AssociatedClientsTable
        instances={[expiringSoonInstance]}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    // Should show warning icon for expiring policies
    expect(screen.getByRole('img', { name: /warning/i })).toBeInTheDocument();
  });

  it('calls onClientClick when client name is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const clientLink = screen.getByText('John Doe');
    await user.click(clientLink);

    expect(mockOnClientClick).toHaveBeenCalledWith('client-1');
  });

  it('calls onEditInstance when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(mockOnEditInstance).toHaveBeenCalledWith(mockInstances[0]);
  });

  it('calls onDeleteInstance when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockOnDeleteInstance).toHaveBeenCalledWith(mockInstances[0]);
  });

  it('calculates and displays policy duration', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    // Should calculate duration between start and expiry dates
    // This would depend on the actual implementation
    expect(screen.getByText(/12 months/)).toBeInTheDocument();
  });

  it('sorts instances by client name by default', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const clientNames = screen.getAllByText(/John Doe|Jane Smith/);
    // Should be sorted alphabetically
    expect(clientNames[0]).toHaveTextContent('Jane Smith');
    expect(clientNames[1]).toHaveTextContent('John Doe');
  });

  it('handles keyboard navigation for client links', async () => {
    const user = userEvent.setup();
    
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const clientLink = screen.getByText('John Doe');
    clientLink.focus();
    
    await user.keyboard('{Enter}');
    expect(mockOnClientClick).toHaveBeenCalledWith('client-1');
  });

  it('shows commission percentage relative to premium', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    // Should show commission percentage (100/1000 = 10%, 150/1500 = 10%)
    expect(screen.getAllByText('10%')).toHaveLength(2);
  });

  it('disables actions for expired policies', () => {
    render(
      <AssociatedClientsTable
        instances={mockInstances}
        loading={false}
        onEditInstance={mockOnEditInstance}
        onDeleteInstance={mockOnDeleteInstance}
        onClientClick={mockOnClientClick}
      />
    );

    const actionButtons = screen.getAllByRole('button');
    const expiredPolicyButtons = actionButtons.filter(button => 
      button.closest('tr')?.textContent?.includes('Expired')
    );

    // Expired policy action buttons should be disabled or have different styling
    expiredPolicyButtons.forEach(button => {
      expect(button).toHaveAttribute('disabled');
    });
  });
});