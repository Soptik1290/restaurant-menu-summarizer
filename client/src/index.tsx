import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Vytvoření root elementu pro React aplikaci
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Vykreslení aplikace s React StrictMode pro lepší vývoj
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Spuštění měření výkonnosti aplikace
// Pro produkci můžete předat funkci pro odeslání dat do analytics
reportWebVitals();
