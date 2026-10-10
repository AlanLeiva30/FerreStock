// ─────────────────────────────────────────────────────────────
// PUNTO DE ARRANQUE
// ─────────────────────────────────────────────────────────────
// Es lo primero que se ejecuta en el navegador: carga los estilos y dibuja
// la aplicación (App.jsx) dentro del <div id="root"> de index.html.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './estilos.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
