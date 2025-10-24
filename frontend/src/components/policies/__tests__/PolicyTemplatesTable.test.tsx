import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PolicyTemplatesTable } from '../PolicyTemplatesTable';
import { PolicyTemplate } from '@/types';

// Mock the currency utils
vi.mock('@/utils/currencyUtils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

// Mock the date utils
vi.mock('@/utils/dateUtils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

const mockTemplates: PolicyTemplate[] = [
  {
    id: 'template-1',
    policyNumber: 'POL-001',
    policyType: 'Life',
    provider: 'Life Insurance Co',
    description: 'Comprehensive life insurance policy',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    instanceCount: 5,
    activeInstanceCount: 3,
  },
  {
    id: 'template-2',
    policyNumber: 'POL-002',
    policyType: 'Health',
    provider: 'Health Corp',
    description: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    instanceCount: 2,
    activeInstanceCount: 2,
  },
];

describe('PolicyTemplatesTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with policy templates', () => {
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('POL-001')).toBeInTheDocument();
    expect(screen.getByText('POL-002')).toBeInTheDocument();
    expect(screen.getByText('Life Insurance Co')).toBeInTheDocument();
    expect(screen.getByText('Health Corp')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <PolicyTemplatesTable
        templates={[]}
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('shows empty state when no templates', () => {
    render(
      <PolicyTemplatesTable
        templates={[]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('No policy templates found')).toBeInTheDocument();
    expect(screen.getByText('Create your first policy template to get started')).toBeInTheDocument();
  });

  it('displays policy type with icon', () => {
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Life')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('shows description or fallback text', () => {
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Comprehensive life insurance policy')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('displays instance counts with badges', () => {
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Total instances
    expect(screen.getByText('3')).toBeInTheDocument(); // Active instances
    expect(screen.getByText('2')).toBeInTheDocument(); // Both total and active for second template
  });

  it('calls onViewDetails when policy number is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    const policyNumberLink = screen.getByText('POL-001');
    await user.click(policyNumberLink);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('opens actions menu and calls edit', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Click on the first actions button
    const actionsButtons = screen.getAllByRole('button', { name: /actions/i });
    await user.click(actionsButtons[0]);

    // Click edit option
    const editButton = screen.getByText('Edit Template');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('opens actions menu and calls delete', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Click on the first actions button
    const actionsButtons = screen.getAllByRole('button', { name: /actions/i });
    await user.click(actionsButtons[0]);

    // Click delete option
    const deleteButton = screen.getByText('Delete Template');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('shows formatted creation date', () => {
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Should show formatted dates
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('1/2/2024')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyTemplatesTable
        templates={mockTemplates}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    const policyNumberLink = screen.getByText('POL-001');
    policyNumberLink.focus();
    
    await user.keyboard('{Enter}');
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('shows correct badge variants for instance counts', () => {
    const templatesWithZeroCounts = [
      {
        ...mockTemplates[0],
        instanceCount: 0,
        activeInstanceCount: 0,
      }
    ];

    render(
      <PolicyTemplatesTable
        templates={templatesWithZeroCounts}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Should show secondary variant for zero counts
    const badges = screen.getAllByText('0');
    expect(badges).toHaveLength(2);
  });
});