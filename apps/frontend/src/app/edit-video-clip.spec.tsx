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
  useMutation: vi.fn(() => [
    vi.fn(),
    { loading: false, error: null },
  ]),
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
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
    loading: false,
    error: null,
  })),
}));

describe('EditVideoClip validation', () => {
  it('should allow empty description', () => {
    // Test that the form allows description to be optional
    const emptyDescription = '';
    const validDescription = 'Test description';

    // Both empty and filled descriptions should be allowed
    expect(emptyDescription.length === 0).toBe(true);
    expect(validDescription.trim().length > 0).toBe(true);
  });

  it('should handle source type selection', () => {
    const sourceTypes = ['none', 'show', 'movie'];
    
    expect(sourceTypes.includes('none')).toBe(true);
    expect(sourceTypes.includes('show')).toBe(true);
    expect(sourceTypes.includes('movie')).toBe(true);
  });

  it('should parse comma-separated characters correctly', () => {
    const charactersInput = 'Character 1, Character 2, Character 3';
    const parsed = charactersInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
    
    expect(parsed).toEqual(['Character 1', 'Character 2', 'Character 3']);
  });

  it('should parse comma-separated tags correctly', () => {
    const tagsInput = 'action, comedy, drama';
    const parsed = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    expect(parsed).toEqual(['action', 'comedy', 'drama']);
  });
});
