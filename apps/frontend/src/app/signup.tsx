import { useState } from 'react';
import { graphql } from '../gql';
import { useMutation } from '@apollo/client/react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

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
    <Box maxWidth={400} mx="auto" mt={6} p={3} boxShadow={3} borderRadius={2} bgcolor="background.paper">
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Sign Up
      </Typography>
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth size="large" sx={{ mt: 1 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
}
