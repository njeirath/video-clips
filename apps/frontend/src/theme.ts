// This file is required for Material UI theming and configuration. You can customize the theme here.
import { createTheme } from '@mui/material/styles';


const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181a1b', // dark gray for main background
      paper: '#23272a',   // slightly lighter for surfaces
    },
    primary: {
      main: '#22d2fe', // Logo blue
      contrastText: '#000',
    },
    secondary: {
      main: '#fc923d', // Logo orange
      contrastText: '#000',
    },
    success: {
      main: '#a3ee6b', // Logo green
      contrastText: '#000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#000000', // pure black header
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
          color: '#ffffff',
        },
      },
    },
  },
});

export default theme;
