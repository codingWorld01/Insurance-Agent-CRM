import { render, screen } from '@testing-library/react';
import { StatusBadge, PriorityBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders status correctly', () => {
    render(<StatusBadge status="New" />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('handles undefined status gracefully', () => {
    // @ts-expect-error Testing undefined status
    render(<StatusBadge status={undefined} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('handles invalid status gracefully', () => {
    // @ts-expect-error Testing invalid status
    render(<StatusBadge status="InvalidStatus" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('renders priority correctly', () => {
    render(<PriorityBadge priority="Hot" />);
    expect(screen.getByText(/🔥.*Hot/)).toBeInTheDocument();
  });

  it('handles undefined priority gracefully', () => {
    // @ts-expect-error Testing undefined priority
    render(<PriorityBadge priority={undefined} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('handles invalid priority gracefully', () => {
    // @ts-expect-error Testing invalid priority
    render(<PriorityBadge priority="InvalidPriority" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});