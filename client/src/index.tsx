import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root element for React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render application with React StrictMode for better development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start application performance measurement
// For production, you can pass a function to send data to analytics
reportWebVitals();
