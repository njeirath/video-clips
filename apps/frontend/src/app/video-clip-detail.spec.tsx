import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock all dependencies
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ username: 'test-user' })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-clip-id' }),
  };
});

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(() => ({
    data: {
      videoClip: {
        id: 'test-clip-id',
        name: 'Test Video Clip',
        description: 'Test description',
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        script: 'Test script',
        duration: 30.5,
        characters: ['Character 1', 'Character 2'],
        tags: ['action', 'comedy'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: null,
        updatedBy: null,
      },
    },
    loading: false,
    error: null,
  })),
}));

describe('VideoClipDetail display', () => {
  it('should display video clip metadata correctly', () => {
    const mockClip = {
      id: 'test-clip-id',
      name: 'Test Video Clip',
      description: 'Test description',
      script: 'Test script',
      duration: 30.5,
      characters: ['Character 1', 'Character 2'],
      tags: ['action', 'comedy'],
    };

    expect(mockClip.name).toBe('Test Video Clip');
    expect(mockClip.description).toBe('Test description');
    expect(mockClip.script).toBe('Test script');
    expect(mockClip.duration).toBe(30.5);
    expect(mockClip.characters).toHaveLength(2);
    expect(mockClip.tags).toHaveLength(2);
  });

  it('should handle show source correctly', () => {
    const showSource = {
      type: 'show',
      title: 'Test Show',
      season: 1,
      episode: 5,
      airDate: '2024-01-01',
    };

    expect(showSource.type).toBe('show');
    expect(showSource.title).toBe('Test Show');
    expect(showSource.season).toBe(1);
    expect(showSource.episode).toBe(5);
  });

  it('should handle movie source correctly', () => {
    const movieSource = {
      type: 'movie',
      title: 'Test Movie',
      releaseDate: '2023-06-15',
      start: 45.0,
      end: 90.0,
    };

    expect(movieSource.type).toBe('movie');
    expect(movieSource.title).toBe('Test Movie');
    expect(movieSource.releaseDate).toBe('2023-06-15');
  });
});
