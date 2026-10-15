// ─────────────────────────────────────────────────────────────
// PERFIL: la foto y los ajustes de cada usuario
// ─────────────────────────────────────────────────────────────
// Cada persona puede cambiar SU foto, SUS ajustes (tema, pantalla de inicio, etc.)
// y SU contraseña. Nadie puede tocar el perfil de otro desde aquí: siempre se usa
// el usuario de la sesión, nunca un número que llegue desde la pantalla.
//
// Se guardan en columnas de la tabla "usuarios" (el sexo, que decide si el rol se muestra en femenino, se pide al crear o editar):
//   foto          → la imagen ya reducida, como texto (data:image/jpeg;base64,…)
//   preferencias  → los ajustes, en formato JSON: {"tema":"light","saludo":false,…}
//   ultima_conexion → cuándo fue la última vez que la persona entró o usó el programa (la ve el administrador en Usuarios)
//
// Si la base todavía no tiene esas columnas, se crean solas al iniciar el servidor.

import { bd, consultar } from '../basedatos/baseDeDatos.js'
import { CODIGOS, ErrorParaElUsuario } from '../comun/http.js'
import { conNombreDeRol } from './roles.js'
import { claveCorrecta, protegerClave } from './seguridad.js'
import { claveValida } from './usuarios.js'

const TEMAS = ['dark', 'light']
const ESTILOS_DE_CHEQUES = ['clasico', 'circulos', 'iconos', 'palabras'] // cómo se dibujan los recibos de tus mensajes del chat
const COLORES_DE_CHEQUES = ['azul', 'verde', 'naranja', 'morado', 'rosa'] //  color de «leído»
const LARGO_MAXIMO_DE_FOTO = 90_000 // la pantalla la reduce a 256 × 256 px, que pesa unos 20 000
const FORMATO_DE_FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/

// Se ejecuta una sola vez al arrancar: crea las columnas si faltan.
export const columnasListas = asegurarColumnas().catch((error) => {
  console.error('[FerreStock] No se pudieron preparar las columnas del perfil:', error.code || error.message)
})

async function asegurarColumnas() {
  const { rows } = await consultar(`SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name IN ('foto', 'preferencias', 'sexo', 'ultima_conexion')`)
  if (rows.length === 4) return
  // sexo: 'F' (femenino) o 'M' (masculino); vacío en las personas que aún no lo han indicado
  await consultar('ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto text, ADD COLUMN IF NOT EXISTS preferencias text, ADD COLUMN IF NOT EXISTS sexo text, ADD COLUMN IF NOT EXISTS ultima_conexion timestamptz')
}

// Deja solo los ajustes conocidos y con valores válidos; lo demás se descarta.
//   tema         → 'dark' o 'light'
//   saludo       → true/false: mostrar la bienvenida al entrar
//   menuCompacto → true/false: menú lateral sin las descripciones
//   inicio       → id de la pantalla con la que se abre (null = la primera de su menú)
//   chequesEstilo / chequesColor / chequesDetalle → cómo ve esa persona los recibos de SUS mensajes del chat
//                  (estilo de los chequecitos, color de «leído» y si se muestran las horas debajo de cada mensaje)
export function normalizarPreferencias(entrada) {
  const salida = {}
  if (!entrada || typeof entrada !== 'object') return salida
  if (TEMAS.includes(entrada.tema)) salida.tema = entrada.tema
  if (typeof entrada.saludo === 'boolean') salida.saludo = entrada.saludo
  if (typeof entrada.menuCompacto === 'boolean') salida.menuCompacto = entrada.menuCompacto
  if (ESTILOS_DE_CHEQUES.includes(entrada.chequesEstilo)) salida.chequesEstilo = entrada.chequesEstilo
  if (COLORES_DE_CHEQUES.includes(entrada.chequesColor)) salida.chequesColor = entrada.chequesColor
  if (typeof entrada.chequesDetalle === 'boolean') salida.chequesDetalle = entrada.chequesDetalle
  if (entrada.inicio === null || entrada.inicio === '') salida.inicio = null
  else if (typeof entrada.inicio === 'string' && /^[a-z]{1,20}$/.test(entrada.inicio)) salida.inicio = entrada.inicio
  return salida
}

// Convierte el texto guardado en la base en un objeto de ajustes.
export function conPreferencias(fila) {
  if (!fila) return fila
  let guardadas = {}
  try {
    guardadas = JSON.parse(fila.preferencias || '{}')
  } catch {
    // Texto dañado: se ignora y se usan los valores por defecto.
  }
  return conNombreDeRol({ ...fila, preferencias: normalizarPreferencias(guardadas) })
}

const consultas = {
  preferencias: bd.prepare('SELECT preferencias FROM usuarios WHERE id = ?'),
  cambiarFoto: bd.prepare('UPDATE usuarios SET foto = ? WHERE id = ?'),
  cambiarPreferencias: bd.prepare('UPDATE usuarios SET preferencias = ? WHERE id = ?'),
  claves: bd.prepare('SELECT clave_hash, clave_sal FROM usuarios WHERE id = ?'),
  existe: bd.prepare('SELECT id FROM usuarios WHERE id = ? AND eliminado IS NULL'),
  cambiarClave: bd.prepare('UPDATE usuarios SET clave_hash = ?, clave_sal = ? WHERE id = ?'),
  cerrarLasOtrasSesiones: bd.prepare('DELETE FROM sesiones WHERE usuario_id = ? AND token_hash != ?'),
  datos: bd.prepare(`SELECT u.id, u.usuario, u.nombre, u.rol, u.sexo, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion, u.foto, u.preferencias
    FROM usuarios u JOIN roles r ON r.clave = u.rol WHERE u.id = ?`),
}

// Los datos completos de un usuario (con foto y ajustes), como los necesita la pantalla.
export async function datosCompletosDelUsuario(id) {
  await columnasListas
  return conPreferencias(await consultas.datos.get(id))
}

function validarFoto(valor) {
  if (valor === null) return null
  if (typeof valor !== 'string' || valor.length > LARGO_MAXIMO_DE_FOTO || !FORMATO_DE_FOTO.test(valor)) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'La foto no es válida. Usa una imagen JPG, PNG o WebP.')
  }
  return valor
}

// Cambia la foto y/o los ajustes de quien tiene la sesión abierta.
//   datos = { foto: 'data:image/jpeg;base64,…' | null, preferencias: { tema: 'light', … } }
// Solo se tocan las partes que vengan en "datos"; los ajustes se mezclan con los que ya había.
export async function guardarPerfil(usuario, datos) {
  await columnasListas
  if (datos?.foto !== undefined) await consultas.cambiarFoto.run(validarFoto(datos.foto), usuario.id)
  if (datos?.preferencias !== undefined) {
    const actuales = conPreferencias(await consultas.preferencias.get(usuario.id)).preferencias
    const mezcladas = { ...actuales, ...normalizarPreferencias(datos.preferencias) }
    for (const clave of Object.keys(mezcladas)) if (mezcladas[clave] === null) delete mezcladas[clave]
    await consultas.cambiarPreferencias.run(JSON.stringify(mezcladas), usuario.id)
  }
  return await datosCompletosDelUsuario(usuario.id)
}

// SOLO ADMINISTRADOR: cambia o quita la foto de OTRA persona (la ruta exige ese rol en servidor/api.js).
//   datos = { foto: 'data:image/jpeg;base64,…' | null }   (null = quitar la foto)
export async function cambiarFotoDeUsuario(id, datos) {
  await columnasListas
  if (datos?.foto === undefined) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Falta la foto (o null para quitarla)')
  const foto = validarFoto(datos.foto)
  if (!await consultas.existe.get(id)) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Usuario no encontrado')
  await consultas.cambiarFoto.run(foto, id)
  return { id, foto }
}

// Cambia la contraseña de quien tiene la sesión abierta. Pide la actual para confirmar que es esa persona.
// Las demás sesiones de esta persona (otros navegadores o equipos) se cierran; la actual sigue abierta.
export async function cambiarMiClave(usuario, datos, huellaDeLaSesionActual) {
  const guardada = await consultas.claves.get(usuario.id)
  // Se responde 400 (no 401) para que la pantalla no crea que la sesión venció.
  if (!guardada || !claveCorrecta(datos?.actual, guardada.clave_hash, guardada.clave_sal)) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'La contraseña actual no es correcta')
  }
  const nueva = claveValida(datos?.nueva)
  if (nueva === String(datos.actual)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'La contraseña nueva debe ser distinta de la actual')
  const { hash, sal } = protegerClave(nueva)
  await consultas.cambiarClave.run(hash, sal, usuario.id)
  await consultas.cerrarLasOtrasSesiones.run(usuario.id, huellaDeLaSesionActual ?? '')
  return { ok: true }
}
