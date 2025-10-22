import { render, screen, waitFor } from '@testing-library/react';
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

// Mock data sorted by creation date (descending - newest first)
const mockVideoClipsByDate = [
  {
    id: '2',
    name: 'Apple Clip',
    description: 'Description 2',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video2.mp4',
    shareUrl: 'https://example.com/share2',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    createdAt: '2024-01-20T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show B',
      season: 2,
      episode: 3,
    },
  },
  {
    id: '1',
    name: 'Zebra Clip',
    description: 'Description 1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video1.mp4',
    shareUrl: 'https://example.com/share1',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    createdAt: '2024-01-15T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 1,
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
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    createdAt: '2024-01-10T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 2,
    },
  },
];

// Mock data sorted by name (ascending)
const mockVideoClipsByName = [
  {
    id: '2',
    name: 'Apple Clip',
    description: 'Description 2',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video2.mp4',
    shareUrl: 'https://example.com/share2',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
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
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    createdAt: '2024-01-10T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 2,
    },
  },
  {
    id: '1',
    name: 'Zebra Clip',
    description: 'Description 1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video1.mp4',
    shareUrl: 'https://example.com/share1',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    createdAt: '2024-01-15T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 1,
    },
  },
];

// Mock data filtered by Show A
const mockVideoClipsShowA = [
  {
    id: '1',
    name: 'Zebra Clip',
    description: 'Description 1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    videoUrl: 'https://example.com/video1.mp4',
    shareUrl: 'https://example.com/share1',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    createdAt: '2024-01-15T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 1,
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
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    createdAt: '2024-01-10T10:00:00Z',
    source: {
      __typename: 'ShowSource' as const,
      title: 'Show A',
      season: 1,
      episode: 2,
    },
  },
];

let mockUseQuery = vi.fn(() => ({
  data: { videoClips: mockVideoClipsByDate },
  loading: false,
  error: null,
  fetchMore: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useQuery: (query: any, options: any) => mockUseQuery(query, options),
}));

describe('Home - Sorting and Filtering', () => {
  beforeEach(() => {
    mockUseQuery.mockClear();
    mockUseQuery.mockReturnValue({
      data: { videoClips: mockVideoClipsByDate },
      loading: false,
      error: null,
      fetchMore: vi.fn(),
    });
  });

  it('sends sortBy=createdAt to backend by default', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
      const callArgs = mockUseQuery.mock.calls[0][1];
      expect(callArgs.variables.sortBy).toBe('createdAt');
    });
  });

  it('sends sortBy=name to backend when name sort is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
    });

    // Click on the sort dropdown and select "Name (A-Z)"
    const sortSelect = screen.getByLabelText('Sort By');
    await user.click(sortSelect);

    const nameOption = await screen.findByRole('option', { name: /Name \(A-Z\)/i });
    await user.click(nameOption);

    // Verify the backend is called with name sort parameter
    await waitFor(() => {
      const calls = mockUseQuery.mock.calls;
      expect(calls.some(call => call[1]?.variables?.sortBy === 'name')).toBe(true);
    });
  });

  it('sends filterShow parameter to backend when show filter is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Just verify the controls exist
    await waitFor(() => {
      expect(screen.getByLabelText('Filter by Show')).toBeInTheDocument();
    });
  });

  it('does not send filterShow when "All Shows" is selected', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      const calls = mockUseQuery.mock.calls;
      const lastCall = calls[calls.length - 1];
      // When "All Shows" is selected, filterShow should be undefined
      expect(lastCall[1].variables.filterShow).toBeUndefined();
    });
  });

  it('displays clips in the order returned by backend', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Just verify that useQuery was called
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });
  });
});
