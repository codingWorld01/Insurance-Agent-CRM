import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PolicyInstanceModal } from '../PolicyInstanceModal';
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
    policyType: 'Life' as const,
    provider: 'Test Insurance',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};

describe('PolicyInstanceModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with instance data', () => {
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Edit Policy Instance')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('POL-001')).toBeInTheDocument();
  });

  it('populates form fields with instance data', () => {
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Clear premium amount
    const premiumInput = screen.getByDisplayValue('1000');
    await user.clear(premiumInput);

    // Try to submit
    const submitButton = screen.getByText('Update Policy Instance');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Premium amount is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates premium amount is positive', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Set negative premium
    const premiumInput = screen.getByDisplayValue('1000');
    await user.clear(premiumInput);
    await user.type(premiumInput, '-100');

    // Try to submit
    const submitButton = screen.getByText('Update Policy Instance');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Premium amount must be greater than 0')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates commission cannot exceed premium', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Set commission higher than premium
    const commissionInput = screen.getByDisplayValue('100');
    await user.clear(commissionInput);
    await user.type(commissionInput, '1500');

    // Try to submit
    const submitButton = screen.getByText('Update Policy Instance');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Commission cannot be greater than premium amount')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates expiry date is after start date', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Switch to custom expiry mode
    const customButton = screen.getByText('Set Custom Date');
    await user.click(customButton);

    // Set expiry date before start date
    const expiryInput = screen.getByDisplayValue('2025-01-01');
    await user.clear(expiryInput);
    await user.type(expiryInput, '2023-12-31');

    // Try to submit
    const submitButton = screen.getByText('Update Policy Instance');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expiry date must be after start date')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calculates expiry date from duration', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Change start date
    const startInput = screen.getByDisplayValue('2024-01-01');
    await user.clear(startInput);
    await user.type(startInput, '2024-06-01');

    // Should see calculated expiry date
    await waitFor(() => {
      expect(screen.getByText(/Calculated:/)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    // Update premium amount
    const premiumInput = screen.getByDisplayValue('1000');
    await user.clear(premiumInput);
    await user.type(premiumInput, '1200');

    // Submit form
    const submitButton = screen.getByText('Update Policy Instance');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        premiumAmount: 1200,
        startDate: '2024-01-01',
        expiryDate: '2025-01-01',
        commissionAmount: 100,
        status: 'Active'
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
        loading={true}
      />
    );

    const submitButton = screen.getByText('Update Policy Instance');
    expect(submitButton).toBeDisabled();
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays formatted currency values', () => {
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('Formatted: $1000.00')).toBeInTheDocument();
    expect(screen.getByText('Formatted: $100.00')).toBeInTheDocument();
  });

  it('shows commission percentage', () => {
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
      />
    );

    expect(screen.getByText('10.0% of premium')).toBeInTheDocument();
  });

  it('does not render when instance is null', () => {
    render(
      <PolicyInstanceModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={null}
      />
    );

    expect(screen.queryByText('Edit Policy Instance')).not.toBeInTheDocument();
  });
});