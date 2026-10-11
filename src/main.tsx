import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/audiowide/index.css';
import '@fontsource/vt323/index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
