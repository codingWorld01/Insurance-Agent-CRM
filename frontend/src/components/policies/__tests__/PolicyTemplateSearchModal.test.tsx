import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PolicyTemplateSearchModal } from '../PolicyTemplateSearchModal';
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

// Mock the toast notifications hook
vi.mock('@/hooks/useToastNotifications', () => ({
  useToastNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

describe('PolicyTemplateSearchModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    clientId: 'client-1',
    clientName: 'John Doe',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('renders search phase correctly', () => {
    render(<PolicyTemplateSearchModal {...defaultProps} />);
    
    expect(screen.getByText('Add Policy to John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by policy number or provider...')).toBeInTheDocument();
    expect(screen.getByText('Search for existing policy templates to add to this client')).toBeInTheDocument();
  });

  it('shows search results when searching', async () => {
    const user = userEvent.setup();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'template-1',
            policyNumber: 'POL-001',
            policyType: 'Life',
            provider: 'Test Provider',
            description: 'Test Description',
            instanceCount: 5,
          },
        ],
      }),
    });

    render(<PolicyTemplateSearchModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by policy number or provider...');
    await user.type(searchInput, 'POL-001');

    await waitFor(() => {
      expect(screen.getByText('Found 1 policy template')).toBeInTheDocument();
      expect(screen.getByText('POL-001')).toBeInTheDocument();
      expect(screen.getByText('Test Provider')).toBeInTheDocument();
      expect(screen.getByText('5 clients')).toBeInTheDocument();
    });
  });

  it('shows instance creation form when template is selected', async () => {
    const user = userEvent.setup();
    
    // Mock template search
    (fetch as unknown).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'template-1',
            policyNumber: 'POL-001',
            policyType: 'Life',
            provider: 'Test Provider',
            instanceCount: 5,
          },
        ],
      }),
    });

    render(<PolicyTemplateSearchModal {...defaultProps} />);
    
    // Search and select template
    const searchInput = screen.getByPlaceholderText('Search by policy number or provider...');
    await user.type(searchInput, 'POL-001');

    await waitFor(() => {
      expect(screen.getByText('POL-001')).toBeInTheDocument();
    });

    const templateCard = screen.getByText('POL-001').closest('.cursor-pointer');
    if (templateCard) {
      await user.click(templateCard);
    }

    await waitFor(() => {
      expect(screen.getByLabelText('Start Date *')).toBeInTheDocument();
      expect(screen.getByLabelText('Premium Amount *')).toBeInTheDocument();
      expect(screen.getByLabelText('Commission Amount *')).toBeInTheDocument();
      expect(screen.getByText('Add Policy')).toBeInTheDocument();
    });
  });
});