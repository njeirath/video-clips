import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import ConfirmSignUp from './confirm';
import * as AmplifyAuth from 'aws-amplify/auth';

vi.mock('aws-amplify/auth');

const mockNavigate = vi.fn();
const mockLocation = (state?: any) => ({ state });
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation({ email: 'test@example.com' }),
  };
});

describe('ConfirmSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  it('renders confirmation form', () => {
    render(
      <MemoryRouter>
        <ConfirmSignUp />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmation code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  it('submits confirmation code and navigates on success', async () => {
    vi.useRealTimers();
    const confirmSignUp = vi.mocked(AmplifyAuth.confirmSignUp, true);
    confirmSignUp.mockImplementationOnce(() =>
      Promise.resolve({
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      })
    );
    render(
      <MemoryRouter>
        <ConfirmSignUp />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/confirmation code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(confirmSignUp).toHaveBeenCalledWith({ username: 'test@example.com', confirmationCode: '123456' });
    });
    // Wait for setTimeout in component to fire
    await new Promise(resolve => setTimeout(resolve, 1300));
    expect(mockNavigate).toHaveBeenCalledWith('/signin', { state: { email: 'test@example.com' } });
  });

  it('shows error on confirmation failure', async () => {
    vi.useRealTimers();
    const confirmSignUp = vi.mocked(AmplifyAuth.confirmSignUp, true);
    confirmSignUp.mockRejectedValueOnce(new Error('Confirmation failed'));
    render(
      <MemoryRouter>
        <ConfirmSignUp />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/confirmation code/i), { target: { value: 'badcode' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(screen.getByText(/confirmation failed/i)).toBeInTheDocument();
    });
  });
});
