import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { VideoClipPlayer } from './VideoClipPlayer';

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

const mockClip = {
  id: '1',
  name: 'Test Clip',
  description: 'Test Description',
  videoUrl: 'https://example.com/video.mp4',
  shareUrl: 'https://example.com/share/1',
  createdAt: '2024-01-15T10:00:00Z',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
};

describe('VideoClipPlayer', () => {
  it('renders clip name and description', () => {
    render(
      <BrowserRouter>
        <VideoClipPlayer clip={mockClip} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Clip')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders share button when shareUrl is provided', () => {
    render(
      <BrowserRouter>
        <VideoClipPlayer clip={mockClip} />
      </BrowserRouter>
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('does not render share button when shareUrl is not provided', () => {
    const clipWithoutShare = { ...mockClip, shareUrl: undefined };
    render(
      <BrowserRouter>
        <VideoClipPlayer clip={clipWithoutShare} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Share')).not.toBeInTheDocument();
  });

  it('renders play button when not playing', () => {
    render(
      <BrowserRouter>
        <VideoClipPlayer clip={mockClip} />
      </BrowserRouter>
    );

    const playButton = screen.getByLabelText('Play Test Clip');
    expect(playButton).toBeInTheDocument();
  });
});
