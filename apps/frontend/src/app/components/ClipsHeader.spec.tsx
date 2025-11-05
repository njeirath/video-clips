import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { ClipsHeader } from './ClipsHeader';

describe('ClipsHeader', () => {
  const mockOnSortChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Explore Clips" heading', () => {
    render(<ClipsHeader sortBy="createdAt" onSortChange={mockOnSortChange} />);

    expect(screen.getByText('Explore Clips')).toBeInTheDocument();
  });

  it('renders the sort dropdown', () => {
    render(<ClipsHeader sortBy="createdAt" onSortChange={mockOnSortChange} />);

    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('displays the current sort option', () => {
    render(<ClipsHeader sortBy="createdAt" onSortChange={mockOnSortChange} />);

    // Check that the select displays the correct label for "createdAt"
    expect(screen.getByText('Most Recent')).toBeInTheDocument();
  });

  it('calls onSortChange when sort option is changed', async () => {
    const user = userEvent.setup();
    render(<ClipsHeader sortBy="createdAt" onSortChange={mockOnSortChange} />);

    const sortSelect = screen.getByLabelText('Sort by');
    await user.click(sortSelect);

    const nameOption = await screen.findByRole('option', { name: /Name \(A-Z\)/i });
    await user.click(nameOption);

    expect(mockOnSortChange).toHaveBeenCalledWith('name');
  });
});
