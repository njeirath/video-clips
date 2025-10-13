import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from './app';
import Home from './home';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(getByText(/Welcome to Video Clips!/i)).toBeInTheDocument();
  });
});
