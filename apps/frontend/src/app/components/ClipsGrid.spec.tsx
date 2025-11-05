import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ClipsGrid } from './ClipsGrid';
import { createRef } from 'react';

// Mock react-blurhash to avoid canvas issues in tests
vi.mock('react-blurhash', () => ({
  Blurhash: () => <div data-testid="blurhash-mock">Blurhash</div>,
}));

// Mock react-router-dom useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockClips = [
  {
    id: '1',
    name: 'Test Clip 1',
    description: 'Description 1',
    videoUrl: 'https://example.com/video1.mp4',
    shareUrl: 'https://example.com/share/1',
    createdAt: '2024-01-15T10:00:00Z',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  },
  {
    id: '2',
    name: 'Test Clip 2',
    description: 'Description 2',
    videoUrl: 'https://example.com/video2.mp4',
    shareUrl: 'https://example.com/share/2',
    createdAt: '2024-01-16T10:00:00Z',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  },
];

describe('ClipsGrid', () => {
  const observerTarget = createRef<HTMLDivElement>();

  it('renders loading state when loading and no clips', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={[]}
          loading={true}
          error={null}
          hasMore={false}
          searchInput=""
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error message when there is an error', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={[]}
          loading={false}
          error={new Error('Test error')}
          hasMore={false}
          searchInput=""
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Failed to load video clips/i)).toBeInTheDocument();
  });

  it('renders empty state message when no clips and not loading', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={[]}
          loading={false}
          error={null}
          hasMore={false}
          searchInput=""
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/No video clips available yet/i)).toBeInTheDocument();
  });

  it('renders filtered empty state message when filters are active', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={[]}
          loading={false}
          error={null}
          hasMore={false}
          searchInput="test search"
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/No video clips match the selected filters/i)).toBeInTheDocument();
  });

  it('renders clips when available', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={mockClips}
          loading={false}
          error={null}
          hasMore={false}
          searchInput=""
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Clip 1')).toBeInTheDocument();
    expect(screen.getByText('Test Clip 2')).toBeInTheDocument();
  });

  it('renders infinite scroll trigger when hasMore is true', () => {
    render(
      <BrowserRouter>
        <ClipsGrid
          clips={mockClips}
          loading={false}
          error={null}
          hasMore={true}
          searchInput=""
          filterShow="all"
          filterCharacter="all"
          observerTarget={observerTarget}
        />
      </BrowserRouter>
    );

    // Should have loading spinner for infinite scroll
    const spinners = screen.getAllByRole('progressbar');
    expect(spinners.length).toBeGreaterThan(0);
  });
});
