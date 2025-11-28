/**
 * main.jsx
 * Point d'entrée du client React (Vite). Monte l'application React dans le DOM.
 * Ce fichier importe `App` et les styles globaux.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service worker registered.', reg))
      .catch(err => console.log('Service worker registration failed:', err));
  });
}
