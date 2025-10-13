
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Root from './root';
import App from './app/app';
import Signup from './app/signup';
import SignIn from './app/signin';
import ConfirmSignUp from './app/confirm';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />, // Root wraps App with ApolloProvider
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
      {
        path: 'signin',
        element: <SignIn />,
      },
      {
        path: 'confirm',
        element: <ConfirmSignUp />,
      },
    ],
  },
], {
  future: { v7_relativeSplatPath: true },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
