import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Admin from './admin';
import { getCurrentUser } from 'aws-amplify/auth';

// Mock dependencies
vi.mock('aws-amplify/auth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    // Mock getCurrentUser to never resolve
    vi.mocked(getCurrentUser).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render admin panel when authenticated', async () => {
    // Mock getCurrentUser to resolve successfully
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: 'user123',
      username: 'testuser',
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Should show add clip button
    expect(screen.getByRole('link', { name: /add new video clip/i })).toBeInTheDocument();
  });

  it('should redirect to signin when not authenticated', async () => {
    // Mock getCurrentUser to reject
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Not authenticated'));

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for authentication check to complete and redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin', { state: { from: '/admin' } });
    });
  });

  it('should have link to add clip page', async () => {
    // Mock getCurrentUser to resolve successfully
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: 'user123',
      username: 'testuser',
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for authentication check to complete
    await waitFor(() => {
      const addClipLink = screen.getByRole('link', { name: /add new video clip/i });
      expect(addClipLink).toHaveAttribute('href', '/admin/add-clip');
    });
  });
});
