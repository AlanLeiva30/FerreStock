// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE VITE
// ─────────────────────────────────────────────────────────────
// Vite es la herramienta que abre FerreStock en el navegador (npm run dev).
// Aquí le decimos dos cosas:
//   1. Que las pantallas están hechas con React.
//   2. Que las peticiones que empiezan con /api las atienda nuestro servidor
//      (carpeta /servidor), que es el que lee y guarda en la base de datos.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function servidorDeFerreStock() {
  const conectar = async (servidorDeVite) => {
    // Se carga aquí adentro para que "npm run build" no abra la base de datos.
    const { atenderPeticion } = await import('./servidor/api.js')
    servidorDeVite.middlewares.use('/api', atenderPeticion)
  }
  return { name: 'servidor-de-ferrestock', configureServer: conectar, configurePreviewServer: conectar }
}

export default defineConfig({
  plugins: [react(), servidorDeFerreStock()],
  // No recargar la página cada vez que cambia la base de datos.
  server: {
    host: '127.0.0.1',
    watch: { ignored: ['**/data/**'] },
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**', '**/servidor/**'] },
  },
  preview: { host: '127.0.0.1' },
})
