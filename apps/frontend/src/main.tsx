
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Root from './root';
import App from './app/app';
import Signup from './app/auth/signup';
import SignIn from './app/auth/signin';
import ConfirmSignUp from './app/auth/confirm';
import Home from './app/home';
import AddVideoClip from './app/add-video-clip';
import VideoClipDetail from './app/video-clip-detail';
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
        element: <Home />,
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
      {
        path: 'add-clip',
        element: <AddVideoClip />,
      },
      {
        path: 'clip/:id',
        element: <VideoClipDetail />,
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
