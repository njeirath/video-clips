import { useState, useRef, useEffect } from 'react';
import { confirmSignUp, confirmSignIn } from 'aws-amplify/auth';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ConfirmSignUp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If cognitoUser is present, this is a sign-in confirmation, otherwise sign-up
  const isSignIn = Boolean(location.state?.cognitoUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isSignIn) {
        // Confirm sign in with the code (challengeResponse only)
  await confirmSignIn({ challengeResponse: code });
        setSuccess('Sign in successful! Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      } else {
        // Confirm sign up with the code
        await confirmSignUp({ username: email, confirmationCode: code });
  setSuccess('Confirmation successful! You can now sign in.');
  setTimeout(() => navigate('/signin', { state: { email } }), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {isSignIn ? 'Enter One Time Password' : 'Confirm Sign Up'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!location.state?.email}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="code"
            label="Confirmation Code"
            name="code"
            inputRef={codeInputRef}
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm'
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
