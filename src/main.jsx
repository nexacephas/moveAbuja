import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

function AppErrorFallback() {
  return (
    <main className="fatal-error" role="alert">
      <h1>MoveAbuja couldn&apos;t start</h1>
      <p>Try reloading the app. If the problem continues, check your connection and try again.</p>
      <button
        className="primary-button"
        type="button"
        onClick={() => window.location.reload()}
      >
        Reload app
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<AppErrorFallback />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
