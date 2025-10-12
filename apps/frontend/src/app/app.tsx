import { Route, Routes, Link } from 'react-router-dom';
import Signup from './signup';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export function App() {
  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/">
              Home
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
