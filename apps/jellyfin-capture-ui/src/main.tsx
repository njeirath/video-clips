import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import ClipProcessor from './app/clip-processor';
import VideoPoc from './app/video-poc';

const route = window.location.pathname;
const currentApp =
  route === '/poc' ? (
    <VideoPoc />
  ) : route === '/process' ? (
    <ClipProcessor />
  ) : (
    <App />
  );

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<StrictMode>{currentApp}</StrictMode>);
