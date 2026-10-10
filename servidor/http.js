// ─────────────────────────────────────────────────────────────
// PETICIONES Y RESPUESTAS
// ─────────────────────────────────────────────────────────────
// Herramientas para leer lo que envían las pantallas y para contestarles.

// Códigos de respuesta estándar de internet (los mismos del famoso "error 404").
export const CODIGOS = {
  OK: 200,
  CREADO: 201,
  DATOS_INCORRECTOS: 400, //   faltan datos o no tienen sentido (ej. cantidad negativa)
  NO_AUTORIZADO: 401, //       no inició sesión, o la contraseña es incorrecta
  PROHIBIDO: 403, //           inició sesión, pero su rol no le permite hacer eso
  NO_EXISTE: 404, //           el producto o la categoría no existe
  CONFLICTO: 409, //           choca con algo existente (ej. código repetido)
  DEMASIADO_GRANDE: 413,
  DEMASIADOS_INTENTOS: 429, // demasiadas contraseñas equivocadas seguidas
  ERROR_INTERNO: 500, //     un fallo inesperado del programa
}

// Error con un mensaje pensado para mostrarse tal cual en la pantalla.
// Ejemplo: throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Producto no encontrado')
export class ErrorParaElUsuario extends Error {
  constructor(codigo, mensaje) {
    super(mensaje)
    this.codigo = codigo
  }
}

// Lee los datos que envió la pantalla (vienen en formato JSON, un texto con llaves y comillas).
export function leerDatosEnviados(peticion) {
  return new Promise((listo, fallo) => {
    let contenido = ''
    peticion.on('data', (pedazo) => {
      contenido += pedazo
      if (contenido.length > 100_000) fallo(new ErrorParaElUsuario(CODIGOS.DEMASIADO_GRANDE, 'Solicitud demasiado grande'))
    })
    peticion.on('end', () => {
      try {
        listo(contenido ? JSON.parse(contenido) : {})
      } catch {
        fallo(new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Los datos enviados no se pudieron leer'))
      }
    })
    peticion.on('error', fallo)
  })
}

// Contesta a la pantalla con un código y unos datos.
export function responder(respuesta, codigo, datos) {
  respuesta.statusCode = codigo
  respuesta.setHeader('Content-Type', 'application/json; charset=utf-8')
  respuesta.end(JSON.stringify(datos))
}

// Convierte cualquier error en una respuesta con un mensaje entendible.
export function responderError(respuesta, error) {
  if (error instanceof ErrorParaElUsuario) {
    return responder(respuesta, error.codigo, { error: error.message })
  }
  // La base de datos rechazó un dato repetido (código de producto o nombre de categoría).
  if (error.code === '23505' || String(error.message).includes('UNIQUE')) {
    const queSeRepite = String(error.message).includes('categorias') ? 'una categoría con ese nombre' : 'un producto con ese código'
    return responder(respuesta, CODIGOS.CONFLICTO, { error: `Ya existe ${queSeRepite}` })
  }
  console.error('[FerreStock]', error.code || error.name) // se muestra en la terminal para poder revisarlo
  responder(respuesta, CODIGOS.ERROR_INTERNO, { error: 'Error interno del servidor' })
}

// COOKIES: un pequeño dato que el navegador guarda y envía solo en cada pedido.
// Se usa para recordar la sesión. "HttpOnly" impide que otros programas de la
// página la lean, y "SameSite=Strict" que otras páginas web la usen.
export function leerCookie(peticion, nombre) {
  for (const parte of (peticion.headers.cookie || '').split(';')) {
    const [clave, ...valor] = parte.trim().split('=')
    if (clave === nombre) return decodeURIComponent(valor.join('='))
  }
  return null
}

export function ponerCookie(respuesta, nombre, valor, segundos) {
  respuesta.setHeader('Set-Cookie', `${nombre}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${segundos}`)
}

// Convierte cualquier valor en texto sin espacios al inicio ni al final.
export const texto = (valor) => String(valor ?? '').trim()
