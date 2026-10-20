import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Passenger from './Passenger.jsx';
import './styles.css';

const isPassengerPage = window.location.pathname.replace(/[\/]+$/, '') === '/passenger';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPassengerPage ? <Passenger /> : <App />}
  </React.StrictMode>
);
