import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import App from './app';
import Home from './home';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MockedProvider addTypename={false}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );
    expect(getByText(/Video Clips/i)).toBeInTheDocument();
  });
});
