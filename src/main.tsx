import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './styles/app.css';

// Tells the recovery script in index.html that the bundle is alive, so it
// stands down rather than clearing the worker and reloading.
declare global { interface Window { __mmssimBooted?: boolean } }
window.__mmssimBooted = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
