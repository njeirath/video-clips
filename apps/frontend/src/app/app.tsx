import { Route, Routes, Link } from 'react-router-dom';
import Signup from './signup';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export function App() {
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
          <Button color="inherit" component={Link} to="/signup">
            Sign Up
          </Button>
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
      </Routes>
    </Box>
  );
}

export default App;
