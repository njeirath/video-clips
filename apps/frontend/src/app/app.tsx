
import { Route, Routes, Link } from 'react-router-dom';
import Signup from './signup';


export function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/signup">Sign Up</Link>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <h1>Welcome to Video Clips!</h1>
              <p>
                <Link to="/signup">Create an account</Link> to get started.
              </p>
            </div>
          }
        />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default App;
