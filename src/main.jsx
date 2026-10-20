import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const Passenger = lazy(() => import('./Passenger.jsx'));
const isPassengerPage =
  window.location.pathname.replace(/[\\/]+$/, '') === '/passenger';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPassengerPage ? (
      <Suspense fallback={<div className="loading-screen">Loading passenger page...</div>}>
        <Passenger />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
