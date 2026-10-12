import {bd} from '../basedatos/baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, leerCookie, ponerCookie, texto} from '../comun/http.js';
import {ADMINISTRADOR} from './roles.js';
import {claveCorrecta, huellaDeLaLlave, nuevaLlaveDeSesion, protegerClave} from './seguridad.js';
import {buscarParaIngresar, crearUsuario, hayUsuarios} from './usuarios.js';
import {columnasListas, conPreferencias, datosCompletosDelUsuario} from './perfil.js';
const NOMBRE_DE_LA_COOKIE = 'ferrestock_sesion';
const HORAS_DE_SESION = 12;
const INTENTOS_PERMITIDOS = 5;
const SEGUNDOS_DE_BLOQUEO = 60;
const RELLENO = protegerClave('relleno');
const intentosFallidos = new Map();
const DATOS_DE_LA_SESION = 'u.id, u.usuario, u.nombre, u.rol, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion, u.preferencias';
const consultas = {
  crear: bd.prepare(`INSERT INTO sesiones (token_hash, usuario_id, expira)
    VALUES (?, ?, now() + interval '${HORAS_DE_SESION} hours')`),
  buscar: bd.prepare(`
    SELECT ${DATOS_DE_LA_SESION}
    FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id JOIN roles r ON r.clave = u.rol
    WHERE s.token_hash = ? AND s.expira > now() AND u.activo = 1`),
  borrar: bd.prepare('DELETE FROM sesiones WHERE token_hash = ?'),
  borrarVencidas: bd.prepare("DELETE FROM sesiones WHERE expira <= now()")
};
// Quién hace la petición. No incluye la foto (pesa) porque esto se consulta en cada petición.
export async function usuarioDeLaPeticion(peticion) {
  const llave = leerCookie(peticion, NOMBRE_DE_LA_COOKIE);
  if (!llave) return null;
  await columnasListas;
  return conPreferencias(await consultas.buscar.get(huellaDeLaLlave(llave)) ?? null);
}
// La "huella" de la sesión actual (para cerrar las demás sesiones al cambiar la contraseña).
export function huellaDeLaSesion(peticion) {
  const llave = leerCookie(peticion, NOMBRE_DE_LA_COOKIE);
  return llave ? huellaDeLaLlave(llave) : null;
}
export async function estadoDeSesion(peticion) {
  const sesion = await usuarioDeLaPeticion(peticion);
  return {
    usuario: sesion ? await datosCompletosDelUsuario(sesion.id) : null,
    necesitaConfiguracion: !await hayUsuarios()
  };
}
export async function iniciarSesion(datos, respuesta) {
  const nombreDeUsuario = texto(datos?.usuario).toLowerCase();
  const registro = intentosFallidos.get(nombreDeUsuario);
  if (registro?.bloqueadoHasta > Date.now()) {
    throw new ErrorParaElUsuario(CODIGOS.DEMASIADOS_INTENTOS, 'Demasiados intentos fallidos. Espera un minuto e inténtalo de nuevo.');
  }
  const usuario = await buscarParaIngresar(nombreDeUsuario);
  const correcta = usuario ? claveCorrecta(datos?.clave, usuario.clave_hash, usuario.clave_sal) : claveCorrecta(datos?.clave, RELLENO.hash, RELLENO.sal) && false;
  if (!correcta || !usuario.activo) {
    anotarIntentoFallido(nombreDeUsuario);
    const mensaje = correcta ? 'Este usuario está desactivado. Habla con un administrador.' : 'Usuario o contraseña incorrectos';
    throw new ErrorParaElUsuario(CODIGOS.NO_AUTORIZADO, mensaje);
  }
  intentosFallidos.delete(nombreDeUsuario);
  await abrirSesion(usuario.id, respuesta);
  return await datosCompletosDelUsuario(usuario.id);
}
export async function configurarPrimerAdministrador(datos, respuesta) {
  if (await hayUsuarios()) throw new ErrorParaElUsuario(CODIGOS.PROHIBIDO, 'El administrador ya fue creado. Inicia sesión.');
  const usuario = await crearUsuario({
    ...datos,
    rol: ADMINISTRADOR
  });
  await abrirSesion(usuario.id, respuesta);
  return await datosCompletosDelUsuario(usuario.id);
}
export async function cerrarSesion(peticion, respuesta) {
  const llave = leerCookie(peticion, NOMBRE_DE_LA_COOKIE);
  if (llave) await consultas.borrar.run(huellaDeLaLlave(llave));
  ponerCookie(respuesta, NOMBRE_DE_LA_COOKIE, '', 0);
  return {
    ok: true
  };
}
async function abrirSesion(usuarioId, respuesta) {
  await consultas.borrarVencidas.run();
  const llave = nuevaLlaveDeSesion();
  await consultas.crear.run(huellaDeLaLlave(llave), usuarioId);
  ponerCookie(respuesta, NOMBRE_DE_LA_COOKIE, llave, HORAS_DE_SESION * 60 * 60);
}
function anotarIntentoFallido(nombreDeUsuario) {
  const registro = intentosFallidos.get(nombreDeUsuario) ?? ({
    cantidad: 0,
    bloqueadoHasta: 0
  });
  registro.cantidad += 1;
  if (registro.cantidad >= INTENTOS_PERMITIDOS) {
    registro.cantidad = 0;
    registro.bloqueadoHasta = Date.now() + SEGUNDOS_DE_BLOQUEO * 1000;
  }
  intentosFallidos.set(nombreDeUsuario, registro);
}
