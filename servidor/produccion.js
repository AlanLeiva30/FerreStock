// ─────────────────────────────────────────────────────────────
// SERVIDOR DE PRODUCCIÓN (para publicar FerreStock en la nube)
// ─────────────────────────────────────────────────────────────
// En tu computadora, Vite hace dos cosas: mostrar las pantallas y pasarle las
// peticiones /api al servidor. En la nube no hay Vite, así que este archivo hace lo mismo:
//   - Las peticiones que empiezan con /api las atiende servidor/api.js (igual que siempre).
//   - Todo lo demás son las pantallas ya compiladas (carpeta dist/, creada con "npm run build").
//
// Se inicia con "npm start". Escucha en el puerto que indique la variable PORT
// (Google Cloud Run la define sola; en tu computadora se usa el 8080).

import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atenderPeticion } from './api.js'
import { cerrarBase } from './basedatos/baseDeDatos.js'

const CARPETA_DE_PANTALLAS = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PUERTO = Number(process.env.PORT) || 8080

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
}

// Protecciones básicas del navegador. Los estilos "en línea" hacen falta porque React los usa en varias pantallas;
// las imágenes "data:" son las fotos de perfil.
const ENCABEZADOS_DE_SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

function enviarArchivo(peticion, respuesta, ruta, estado) {
  const extension = extname(ruta).toLowerCase()
  respuesta.writeHead(200, {
    ...ENCABEZADOS_DE_SEGURIDAD,
    'Content-Type': TIPOS[extension] || 'application/octet-stream',
    'Content-Length': estado.size,
    // Los archivos de /assets tienen un nombre único por versión, así que el navegador los puede guardar mucho tiempo.
    'Cache-Control': ruta.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  if (peticion.method === 'HEAD') return respuesta.end()
  createReadStream(ruta).pipe(respuesta)
}

function archivoExistente(ruta) {
  try {
    const estado = statSync(ruta)
    return estado.isFile() ? estado : null
  } catch {
    return null
  }
}

const servidor = createServer((peticion, respuesta) => {
  const direccion = peticion.url || '/'

  // 1) La API: se le quita el "/api" del principio, igual que hace Vite.
  if (direccion === '/api' || direccion.startsWith('/api/') || direccion.startsWith('/api?')) {
    peticion.url = direccion.slice(4) || '/'
    return atenderPeticion(peticion, respuesta)
  }

  // 2) Las pantallas (solo lectura).
  if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
    respuesta.writeHead(405, { Allow: 'GET, HEAD', ...ENCABEZADOS_DE_SEGURIDAD })
    return respuesta.end()
  }
  let nombre
  try {
    nombre = decodeURIComponent(new URL(direccion, 'http://localhost').pathname)
  } catch {
    respuesta.writeHead(400, ENCABEZADOS_DE_SEGURIDAD)
    return respuesta.end()
  }
  const ruta = resolve(join(CARPETA_DE_PANTALLAS, nombre))
  // Nunca salir de la carpeta dist (evita pedir archivos como ../../.env.local).
  if (ruta !== CARPETA_DE_PANTALLAS && !ruta.startsWith(CARPETA_DE_PANTALLAS + sep)) {
    respuesta.writeHead(403, ENCABEZADOS_DE_SEGURIDAD)
    return respuesta.end()
  }
  const estado = archivoExistente(ruta)
  if (estado) return enviarArchivo(peticion, respuesta, ruta, estado)

  // Un archivo que no existe dentro de /assets es un error; cualquier otra dirección abre la aplicación.
  if (nombre.startsWith('/assets/')) {
    respuesta.writeHead(404, ENCABEZADOS_DE_SEGURIDAD)
    return respuesta.end()
  }
  const inicio = join(CARPETA_DE_PANTALLAS, 'index.html')
  const estadoInicio = archivoExistente(inicio)
  if (!estadoInicio) {
    respuesta.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    return respuesta.end('Falta compilar las pantallas: ejecuta "npm run build".')
  }
  enviarArchivo(peticion, respuesta, inicio, estadoInicio)
})

servidor.listen(PUERTO, '0.0.0.0', () => console.log(`[FerreStock] Escuchando en el puerto ${PUERTO}`))

// Al apagarse (Cloud Run avisa con SIGTERM), terminar las conexiones con calma.
for (const señal of ['SIGTERM', 'SIGINT']) {
  process.on(señal, () => {
    servidor.close(async () => {
      await cerrarBase().catch(() => {})
      process.exit(0)
    })
    setTimeout(() => process.exit(0), 8000).unref()
  })
}
