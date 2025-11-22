import { Link, useNavigate, Outlet } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useEffect, useState, useRef } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useLocation } from 'react-router-dom';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { SearchProvider, useSearch } from './SearchContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <SearchProvider>
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
  <Toolbar sx={{ py: 1, position: 'relative', flexWrap: 'wrap', gap: 1 }}>
          {/* VideoClips Logo/Brand */}
          <Box 
            component={Link}
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              mr: { xs: 'auto', md: 4 }
            }}
          >
            <Box
              sx={{
                width: { xs: 28, md: 32 },
                height: { xs: 28, md: 32 },
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
                fontSize: { xs: '1.1rem', md: '1.25rem' }
              }}
            >
              VideoClips
            </Typography>
          </Box>

          {/* Centered Search Bar - Hidden on mobile */}
          {!isMobile && (
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(760px, 60%)',
              }}
            >
              <HeaderSearch />
            </Box>
          )}

          {/* Right aligned action buttons */}
          <Box sx={{ marginLeft: { xs: 0, md: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
            {!checking && !signedIn && (
              <>
                <Button
                  component={Link}
                  to="/signin"
                  variant="contained"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ 
                    bgcolor: '#3b9dd6',
                    color: '#fff',
                    px: { xs: 2, md: 3 },
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
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ 
                    borderColor: '#374151',
                    color: '#fff',
                    px: { xs: 2, md: 3 },
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
                size={isMobile ? 'small' : 'medium'}
                sx={{ mr: 1 }}
              >
                Add Clip
              </Button>
            )}
            {!checking && signedIn && (
              <>
                <IconButton
                  size={isMobile ? 'medium' : 'large'}
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
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Search Bar - Shows below header on mobile */}
      {isMobile && (
        <Box sx={{ 
          bgcolor: '#1a2332',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          px: 2,
          py: 1.5
        }}>
          <HeaderSearch />
        </Box>
      )}
      {/* Main app content goes here. Routing is handled in main.tsx. */}
      <Outlet />
    </Box>
    </SearchProvider>
  );
}

export default App;

function HeaderSearch() {
  const { searchInput, setSearchInput } = useSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    setSearchInput('');
    // return focus to the input
    inputRef.current?.focus();
  };

  return (
    <TextField
      inputRef={inputRef}
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      fullWidth
      size="small"
      placeholder="Search for video clips..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: '#9ca3af' }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleClear}
              aria-label="clear search"
              sx={{ color: searchInput ? '#fff' : 'rgba(255,255,255,0.35)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
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
  );
}
