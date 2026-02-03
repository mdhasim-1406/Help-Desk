import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Graceful recovery for dynamic import failures (chunk load errors)
window.addEventListener('error', (event) => {
  if (event.message?.includes('Failed to fetch dynamically imported module')) {
    console.warn('Chunk load failed — reloading page...');
    window.location.reload();
  }
});

// Error Boundary could be added here later
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
