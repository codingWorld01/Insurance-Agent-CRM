import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PolicyTemplateCreateModal } from '../PolicyTemplateCreateModal';
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

// Mock the fetch function
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('PolicyTemplateCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    loading: false,
  };

  it('renders create modal correctly', () => {
    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    expect(screen.getByText('Create Policy Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Policy Number *')).toBeInTheDocument();
    expect(screen.getByLabelText('Policy Type *')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders edit modal correctly when template is provided', () => {
    const template = {
      id: '1',
      policyNumber: 'POL-001',
      policyType: 'Life' as const,
      provider: 'Test Provider',
      description: 'Test Description',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      instanceCount: 5,
      activeInstanceCount: 3,
    };

    render(<PolicyTemplateCreateModal {...defaultProps} template={template} />);
    
    expect(screen.getByText('Edit Policy Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('POL-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Policy number is required')).toBeInTheDocument();
      expect(screen.getByText('Provider is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates policy number format', async () => {
    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const policyNumberInput = screen.getByLabelText('Policy Number *');
    fireEvent.change(policyNumberInput, { target: { value: 'invalid policy number!' } });

    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Policy number can only contain letters, numbers, hyphens, and underscores')).toBeInTheDocument();
    });
  });

  it('validates description character limit', async () => {
    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText('Description');
    const longDescription = 'a'.repeat(501);
    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    // Mock successful policy number validation
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Policy Number *'), {
      target: { value: 'POL-001' }
    });
    fireEvent.change(screen.getByLabelText('Provider *'), {
      target: { value: 'Test Provider' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    });

    // Wait for policy number validation
    await waitFor(() => {
      expect(screen.getByText('Policy number is available')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        policyNumber: 'POL-001',
        policyType: 'Life',
        provider: 'Test Provider',
        description: 'Test Description',
      });
    });
  });

  it('shows policy number uniqueness validation', async () => {
    // Mock policy number already exists
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ policyNumber: 'POL-001' }]
      }),
    });

    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const policyNumberInput = screen.getByLabelText('Policy Number *');
    fireEvent.change(policyNumberInput, { target: { value: 'POL-001' } });

    await waitFor(() => {
      expect(screen.getByText('Policy number already exists')).toBeInTheDocument();
    });
  });

  it('disables submit button during validation', async () => {
    // Mock slow validation response
    (fetch as unknown).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      }), 100))
    );

    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const policyNumberInput = screen.getByLabelText('Policy Number *');
    fireEvent.change(policyNumberInput, { target: { value: 'POL-001' } });

    // Submit button should be disabled during validation
    const submitButton = screen.getByText('Create Template');
    expect(submitButton).toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<PolicyTemplateCreateModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});