import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PolicyInstanceDeleteDialog } from '../PolicyInstanceDeleteDialog';
import { PolicyInstanceWithClient } from '@/types';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { beforeEach } from 'node:test';

// Mock the currency utils
vi.mock('@/utils/currencyUtils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockInstance: PolicyInstanceWithClient = {
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
    provider: 'Test Insurance',
  },
};

const expiredInstance: PolicyInstanceWithClient = {
  ...mockInstance,
  id: 'instance-2',
  status: 'Expired',
  expiryDate: '2023-01-01T00:00:00.000Z',
};

const expiringSoonInstance: PolicyInstanceWithClient = {
  ...mockInstance,
  id: 'instance-3',
  expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
};

describe('PolicyInstanceDeleteDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with instance details', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Delete Policy Instance')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('POL-001')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('shows active status badge for active policies', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows expired status for expired policies', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={expiredInstance}
      />
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('displays policy period correctly', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    expect(screen.getByText(/Jan 1, 2024 - Jan 1, 2025/)).toBeInTheDocument();
  });

  it('shows warning message about deletion consequences', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(/This will remove the policy association from the client/)).toBeInTheDocument();
    expect(screen.getByText(/The policy template will remain available for other clients/)).toBeInTheDocument();
    expect(screen.getByText(/This action will be logged in the activity history/)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard statistics will be updated to reflect this change/)).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    const deleteButton = screen.getByText('Delete Policy Instance');
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
        loading={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    
    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Deleting...');
    
    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('does not render when instance is null', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={null}
      />
    );

    expect(screen.queryByText('Delete Policy Instance')).not.toBeInTheDocument();
  });

  it('shows policy type badge', () => {
    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Life')).toBeInTheDocument();
  });

  it('handles missing policy template gracefully', () => {
    const instanceWithoutTemplate = {
      ...mockInstance,
      policyTemplate: undefined,
    };

    render(
      <PolicyInstanceDeleteDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        instance={instanceWithoutTemplate}
      />
    );

    expect(screen.getByText('Unknown Policy')).toBeInTheDocument();
  });
});