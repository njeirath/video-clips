

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import Signup from './signup';
import * as AmplifyAuth from 'aws-amplify/auth';

vi.mock('aws-amplify/auth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign up form', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('submits the form and navigates on success', async () => {
  const signUp = vi.mocked(AmplifyAuth.signUp, true);
    signUp.mockResolvedValueOnce({
      isSignUpComplete: false,
  nextStep: { signUpStep: 'CONFIRM_SIGN_UP', codeDeliveryDetails: { attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'test@example.com' } }
    });
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({ username: 'test@example.com', options: { userAttributes: { email: 'test@example.com' } } });
      expect(mockNavigate).toHaveBeenCalledWith('/confirm', { state: { email: 'test@example.com' } });
    });
  });

  it('shows error on sign up failure', async () => {
  const signUp = vi.mocked(AmplifyAuth.signUp, true);
  signUp.mockRejectedValueOnce(new Error('Sign up failed'));
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => {
      expect(screen.getByText(/sign up failed/i)).toBeInTheDocument();
    });
  });
});
