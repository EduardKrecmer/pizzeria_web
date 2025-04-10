import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import Vercel kompatibilné verzie store-ov
// Súbor musíme vytvoriť a aktualizovať, aby používal lokálne API funkcie
import './store/pizzaStore.vercel';
import './store/cartStore.vercel';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);