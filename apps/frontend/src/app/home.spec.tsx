import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect, vi } from 'vitest';
import Home from './home';
import { GetVideoClipsDocument } from '../gql/graphql';

const mockVideoClips = [
  {
    id: '1',
    name: 'Introduction to React',
    description: 'Learn the basics of React development',
    userId: 'user1',
    userEmail: 'user1@example.com',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Advanced TypeScript',
    description: 'Deep dive into TypeScript features',
    userId: 'user2',
    userEmail: 'user2@example.com',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'GraphQL Tutorial',
    description: 'Building APIs with GraphQL',
    userId: 'user3',
    userEmail: 'user3@example.com',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
];

// Helper function to create many clips for pagination testing
const createManyClips = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `clip-${i + 1}`,
    name: `Video Clip ${i + 1}`,
    description: `Description for clip ${i + 1}`,
    userId: `user${i + 1}`,
    userEmail: `user${i + 1}@example.com`,
    createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
};

describe('Home', () => {
  it('should display loading state initially', () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display video clips after loading', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByText('GraphQL Tutorial')).toBeInTheDocument();
  });

  it('should display search bar', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('should filter clips by name when searching', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    await user.type(searchInput, 'React');

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      expect(screen.queryByText('Advanced TypeScript')).not.toBeInTheDocument();
      expect(screen.queryByText('GraphQL Tutorial')).not.toBeInTheDocument();
    });
  });

  it('should filter clips by description when searching', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    await user.type(searchInput, 'GraphQL');

    await waitFor(() => {
      expect(screen.getByText('GraphQL Tutorial')).toBeInTheDocument();
      expect(screen.queryByText('Introduction to React')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced TypeScript')).not.toBeInTheDocument();
    });
  });

  it('should show "no clips found" message when search has no results', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    await user.type(searchInput, 'NonexistentClip');

    await waitFor(() => {
      expect(screen.getByText(/no video clips found matching/i)).toBeInTheDocument();
    });
  });

  it('should show "no clips available" message when no data exists', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: [],
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no video clips available yet/i)).toBeInTheDocument();
    });
  });

  it('should display error message when query fails', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        error: new Error('Network error'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load video clips/i)).toBeInTheDocument();
    });
  });

  it('should display video clip cards with correct information', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: [mockVideoClips[0]],
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    expect(screen.getByText('Learn the basics of React development')).toBeInTheDocument();
    expect(screen.getByText(/Added:/)).toBeInTheDocument();
  });

  it('should be case-insensitive when searching', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    await user.type(searchInput, 'REACT');

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });
  });

  it('should handle clearing the search query', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    
    // Type search query
    await user.type(searchInput, 'React');
    await waitFor(() => {
      expect(screen.queryByText('Advanced TypeScript')).not.toBeInTheDocument();
    });

    // Clear search query
    await user.clear(searchInput);
    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
      expect(screen.getByText('GraphQL Tutorial')).toBeInTheDocument();
    });
  });

  it('should display clips in a grid layout', async () => {
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    // Check that cards are rendered within a Grid container
    const cards = screen.getAllByRole('heading', { level: 2 });
    expect(cards.length).toBe(3);
  });

  it('should initially display up to 12 clips', async () => {
    const manyClips = createManyClips(20);
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: manyClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Video Clip 1')).toBeInTheDocument();
    });

    // Should show 12 clips initially
    const cards = screen.getAllByRole('heading', { level: 2 });
    expect(cards.length).toBe(12);
  });

  it('should trim whitespace from search query', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GetVideoClipsDocument,
        },
        result: {
          data: {
            videoClips: mockVideoClips,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Home />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search video clips/i);
    await user.type(searchInput, '  React  ');

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      expect(screen.queryByText('Advanced TypeScript')).not.toBeInTheDocument();
    });
  });
});
