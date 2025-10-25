// This file is required for Material UI theming and configuration. You can customize the theme here.
import { createTheme } from '@mui/material/styles';


const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a2332', // dark blue background matching design
      paper: '#2a3544',   // slightly lighter for cards/surfaces
    },
    primary: {
      main: '#3b9dd6', // bright blue for Login button and accents
      contrastText: '#fff',
    },
    secondary: {
      main: '#fc923d', // Logo orange (kept for potential use)
      contrastText: '#000',
    },
    success: {
      main: '#a3ee6b', // Logo green (kept for potential use)
      contrastText: '#000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af', // light gray for secondary text
    },
    divider: '#374151', // subtle divider color
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#1a2332', // match main background
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#2a3544',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#2a3544',
          },
        },
      },
    },
  },
});

export default theme;
