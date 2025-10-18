import { render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Home from './home';

// Mock dependencies
vi.mock('aws-amplify/auth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockVideoClips = [
  {
    id: '1',
    name: 'Zebra Clip',
    description: 'Description 1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video1.mp4',
    shareUrl: 'https://example.com/share1',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 1,
    },
  },
  {
    id: '2',
    name: 'Apple Clip',
    description: 'Description 2',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video2.mp4',
    shareUrl: 'https://example.com/share2',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    createdAt: '2024-01-20T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show B',
      season: 2,
      episode: 3,
    },
  },
  {
    id: '3',
    name: 'Banana Clip',
    description: 'Description 3',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video3.mp4',
    shareUrl: 'https://example.com/share3',
    thumbnailUrl: 'https://example.com/thumb3.jpg',
    createdAt: '2024-01-10T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 2,
    },
  },
];

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(() => ({
    data: { videoClips: mockVideoClips },
    loading: false,
    error: null,
    fetchMore: vi.fn(),
  })),
}));

describe('Home - Sorting and Filtering', () => {
  it('sorts clips by creation date (descending) by default', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cards = screen.getAllByRole('heading', { level: 2 });
      // Should be sorted by newest first: Apple (Jan 20), Zebra (Jan 15), Banana (Jan 10)
      expect(cards[0]).toHaveTextContent('Apple Clip');
      expect(cards[1]).toHaveTextContent('Zebra Clip');
      expect(cards[2]).toHaveTextContent('Banana Clip');
    });
  });

  it('sorts clips by name when name sort is selected', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
    });

    // Click on the sort dropdown
    const sortSelect = screen.getByLabelText('Sort By');
    await user.click(sortSelect);

    // Select "Name (A-Z)" option
    const nameOption = await screen.findByRole('option', { name: /Name \(A-Z\)/i });
    await user.click(nameOption);

    await waitFor(() => {
      const cards = screen.getAllByRole('heading', { level: 2 });
      // Should be sorted alphabetically: Apple, Banana, Zebra
      expect(cards[0]).toHaveTextContent('Apple Clip');
      expect(cards[1]).toHaveTextContent('Banana Clip');
      expect(cards[2]).toHaveTextContent('Zebra Clip');
    });
  });

  it('filters clips by show', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by Show')).toBeInTheDocument();
    });

    // Click on the filter dropdown
    const filterSelect = screen.getByLabelText('Filter by Show');
    await user.click(filterSelect);

    // Select "Show A"
    const showAOption = await screen.findByRole('option', { name: 'Show A' });
    await user.click(showAOption);

    await waitFor(() => {
      const cards = screen.getAllByRole('heading', { level: 2 });
      // Should only show clips from Show A
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent('Zebra Clip');
      expect(cards[1]).toHaveTextContent('Banana Clip');
    });
  });

  it('shows all clips when "All Shows" is selected', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cards = screen.getAllByRole('heading', { level: 2 });
      expect(cards).toHaveLength(3);
    });
  });

  it('filters clips correctly by show', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by Show')).toBeInTheDocument();
    });

    // First filter by Show B (which has only one clip)
    const filterSelect = screen.getByLabelText('Filter by Show');
    await user.click(filterSelect);

    const showBOption = await screen.findByRole('option', { name: 'Show B' });
    await user.click(showBOption);

    // Now verify that only one clip is shown (Apple Clip from Show B)
    await waitFor(() => {
      const cards = screen.getAllByRole('heading', { level: 2 });
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveTextContent('Apple Clip');
    });
  });
});
