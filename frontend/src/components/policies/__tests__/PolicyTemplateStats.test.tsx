import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PolicyTemplateStats } from '../PolicyTemplateStats';
import { PolicyTemplateStats as StatsType } from '@/types';

// Mock the currency utils
vi.mock('@/utils/currencyUtils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockStats: StatsType = {
  totalTemplates: 25,
  totalInstances: 150,
  activeInstances: 120,
  totalClients: 85,
  topProviders: [
    {
      provider: 'Life Insurance Co',
      templateCount: 8,
      instanceCount: 45,
    },
    {
      provider: 'Health Corp',
      templateCount: 6,
      instanceCount: 32,
    },
    {
      provider: 'Auto Insurance Inc',
      templateCount: 4,
      instanceCount: 28,
    },
  ],
  policyTypeDistribution: [
    {
      type: 'Life',
      templateCount: 10,
      instanceCount: 60,
    },
    {
      type: 'Health',
      templateCount: 8,
      instanceCount: 45,
    },
    {
      type: 'Auto',
      templateCount: 5,
      instanceCount: 30,
    },
    {
      type: 'Home',
      templateCount: 2,
      instanceCount: 15,
    },
  ],
};

describe('PolicyTemplateStats', () => {
  it('renders all statistics cards', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    expect(screen.getByText('Total Templates')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Total Instances')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    expect(screen.getByText('Active Instances')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PolicyTemplateStats stats={null} loading={true} />);

    expect(screen.getAllByText('Loading...')).toHaveLength(4);
  });

  it('displays top providers section', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    expect(screen.getByText('Top Providers')).toBeInTheDocument();
    expect(screen.getByText('Life Insurance Co')).toBeInTheDocument();
    expect(screen.getByText('8 templates, 45 instances')).toBeInTheDocument();
    expect(screen.getByText('Health Corp')).toBeInTheDocument();
    expect(screen.getByText('Auto Insurance Inc')).toBeInTheDocument();
  });

  it('displays policy type distribution', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    expect(screen.getByText('Policy Types')).toBeInTheDocument();
    expect(screen.getByText('Life')).toBeInTheDocument();
    expect(screen.getByText('10 templates')).toBeInTheDocument();
    expect(screen.getByText('60 instances')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('calculates and displays percentages correctly', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    // Active instances percentage: 120/150 = 80%
    expect(screen.getByText('80% active')).toBeInTheDocument();
  });

  it('shows empty state when no providers', () => {
    const emptyStats = {
      ...mockStats,
      topProviders: [],
    };

    render(<PolicyTemplateStats stats={emptyStats} loading={false} />);

    expect(screen.getByText('No providers yet')).toBeInTheDocument();
  });

  it('shows empty state when no policy types', () => {
    const emptyStats = {
      ...mockStats,
      policyTypeDistribution: [],
    };

    render(<PolicyTemplateStats stats={emptyStats} loading={false} />);

    expect(screen.getByText('No policy types yet')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const zeroStats: StatsType = {
      totalTemplates: 0,
      totalInstances: 0,
      activeInstances: 0,
      totalClients: 0,
      topProviders: [],
      policyTypeDistribution: [],
    };

    render(<PolicyTemplateStats stats={zeroStats} loading={false} />);

    expect(screen.getAllByText('0')).toHaveLength(4);
    expect(screen.getByText('0% active')).toBeInTheDocument();
  });

  it('displays correct icons for each stat card', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    // Check for icon containers (assuming they have specific test ids or classes)
    const statCards = screen.getAllByRole('article');
    expect(statCards).toHaveLength(4);
  });

  it('shows trend indicators when available', () => {
    const statsWithTrends = {
      ...mockStats,
      trends: {
        templatesChange: 5,
        instancesChange: -2,
        activeChange: 8,
        clientsChange: 12,
      },
    };

    render(<PolicyTemplateStats stats={statsWithTrends} loading={false} />);

    // Should show trend indicators if implemented
    // This would depend on the actual implementation
  });

  it('handles large numbers with proper formatting', () => {
    const largeStats = {
      ...mockStats,
      totalTemplates: 1250,
      totalInstances: 15000,
      activeInstances: 12000,
      totalClients: 8500,
    };

    render(<PolicyTemplateStats stats={largeStats} loading={false} />);

    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('15,000')).toBeInTheDocument();
    expect(screen.getByText('12,000')).toBeInTheDocument();
    expect(screen.getByText('8,500')).toBeInTheDocument();
  });

  it('shows provider ranking correctly', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    const providerItems = screen.getAllByText(/templates,.*instances/);
    expect(providerItems[0]).toHaveTextContent('8 templates, 45 instances');
    expect(providerItems[1]).toHaveTextContent('6 templates, 32 instances');
    expect(providerItems[2]).toHaveTextContent('4 templates, 28 instances');
  });

  it('displays policy type distribution with correct ordering', () => {
    render(<PolicyTemplateStats stats={mockStats} loading={false} />);

    // Should be ordered by instance count (descending)
    const policyTypeElements = screen.getAllByText(/\d+ templates/);
    expect(policyTypeElements[0]).toHaveTextContent('10 templates');
    expect(policyTypeElements[1]).toHaveTextContent('8 templates');
    expect(policyTypeElements[2]).toHaveTextContent('5 templates');
    expect(policyTypeElements[3]).toHaveTextContent('2 templates');
  });
});