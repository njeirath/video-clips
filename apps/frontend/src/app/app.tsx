import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import Signup from './signup';
import SignIn from './signin';
import ConfirmSignUp from './confirm';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useLocation } from 'react-router-dom';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

export function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth state on mount and whenever the route changes
  useEffect(() => {
    let mounted = true;
    async function checkUser() {
      setChecking(true);
      try {
          const currentUser = await getCurrentUser();
          if (mounted) {
            setSignedIn(true);
            // Prefer email from signInDetails if available, fallback to username
            setUser(
              (currentUser.signInDetails as { loginId?: string } | undefined)?.loginId ||
              currentUser.username ||
              null
            );
          }
      } catch {
        if (mounted) {
          setSignedIn(false);
          setUser(null);
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkUser();
    return () => { mounted = false; };
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
    setUser(null);
    setAnchorEl(null);
    navigate('/');
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" sx={{ backgroundColor: '#000 !important', boxShadow: 'none' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/" sx={{ p: 0, minWidth: 0 }}>
              <img
                src="/logo-64.png"
                alt="Home"
                width={40}
                height={40}
                style={{ display: 'block' }}
              />
            </Button>
          </Box>
          {!checking && !signedIn && (
            <Button color="inherit" component={Link} to="/signup" sx={{ mr: 1 }}>
              Sign Up
            </Button>
          )}
          {!checking && !signedIn && (
            <Button color="inherit" component={Link} to="/signin">
              Sign In
            </Button>
          )}
          {!checking && signedIn && (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                onClick={handleMenu}
                sx={{ ml: 1 }}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  {user ? `Signed in as ${user}` : 'Signed in'}
                </MenuItem>
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Typography variant="h3" gutterBottom>
                Welcome to Video Clips!
              </Typography>
            </div>
          }
        />
  <Route path="/signup" element={<Signup />} />
  <Route path="/signin" element={<SignIn />} />
  <Route path="/confirm" element={<ConfirmSignUp />} />
      </Routes>
    </Box>
  );
}

export default App;
