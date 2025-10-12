import { useState } from 'react';
import { graphql } from '../gql';
import { useMutation } from '@apollo/client/react';

export const SIGNUP_MUTATION = graphql(`
  mutation Signup($username: String!, $password: String!) {
    signup(username: $username, password: $password) {
      message
      userSub
    }
  }
`);

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const [signup, { loading, error }] = useMutation(SIGNUP_MUTATION, {
    onCompleted: (data) => {
      setSuccess(data.signup.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    signup({ variables: { username, password } });
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {error && <div style={{ color: 'red' }}>{error.message}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </div>
  );
}
