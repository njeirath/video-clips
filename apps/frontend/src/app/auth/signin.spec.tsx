import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { vi } from 'vitest';
import * as AmplifyAuth from 'aws-amplify/auth';
import '@testing-library/jest-dom';
import SignIn from './signin';

vi.mock('aws-amplify/auth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: undefined }),
  };
});

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign in form', () => {
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('submits the form and navigates on success', async () => {
    const signIn = vi.mocked(AmplifyAuth.signIn, true);
    signIn.mockResolvedValueOnce({
      isSignedIn: false,
  nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE', codeDeliveryDetails: undefined }
    });
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({ username: 'test@example.com', options: {authFlowType: 'USER_AUTH', preferredChallenge: 'EMAIL_OTP'} });
      expect(mockNavigate).toHaveBeenCalledWith('/confirm', {
        state: {
          email: 'test@example.com',
          cognitoUser: {
            isSignedIn: false,
            nextStep: {
              signInStep: 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE',
              codeDeliveryDetails: undefined,
            },
          },
        },
      });
    });
  });

  it('shows error on sign in failure', async () => {
    const signIn = vi.mocked(AmplifyAuth.signIn, true);
    signIn.mockRejectedValueOnce(new Error('Failed to send OTP'));
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to send otp/i)).toBeInTheDocument();
    });
  });
});
