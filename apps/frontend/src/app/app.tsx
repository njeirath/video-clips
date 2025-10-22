import { Link, useNavigate, Outlet } from 'react-router-dom';
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
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
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
            (currentUser.signInDetails as { loginId?: string } | undefined)
              ?.loginId ||
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
    return () => {
      mounted = false;
    };
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
      <AppBar
        position="static"
        color="transparent"
        sx={{ 
          backgroundColor: '#1a2332 !important', 
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          {/* VideoClips Logo/Brand */}
          <Box 
            component={Link}
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              mr: 4 
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 4L20 12L4 20V4Z" fill="#3b9dd6" />
              </svg>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.25rem'
              }}
            >
              VideoClips
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search for video clips..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#2a3544',
                  '& fieldset': { border: 'none' },
                  '&:hover': {
                    bgcolor: '#323f50',
                  },
                }
              }}
            />
          </Box>

          {/* Auth Buttons */}
          {!checking && !signedIn && (
            <>
              <Button
                component={Link}
                to="/signin"
                variant="contained"
                sx={{ 
                  mr: 2,
                  bgcolor: '#3b9dd6',
                  color: '#fff',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#2d8ac4',
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="outlined"
                sx={{ 
                  borderColor: '#374151',
                  color: '#fff',
                  px: 3,
                  '&:hover': {
                    borderColor: '#4b5563',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                SignUp
              </Button>
            </>
          )}
          {!checking && signedIn && (
            <Button
              color="inherit"
              component={Link}
              to="/add-clip"
              sx={{ mr: 1 }}
            >
              Add Clip
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
      {/* Main app content goes here. Routing is handled in main.tsx. */}
      <Outlet />
    </Box>
  );
}

export default App;
