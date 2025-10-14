import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from './app';

// Simple test component to avoid rendering Home with Grid issues in tests
function TestHome() {
  return <div>Test Home</div>;
}

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<TestHome />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have an app bar', () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<TestHome />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    // Check for app bar by looking for MuiAppBar in class names
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });
});
