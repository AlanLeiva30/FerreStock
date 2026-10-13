import {bd} from '../basedatos/baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, texto} from '../comun/http.js';
import {ADMINISTRADOR, ROLES, conNombreDeRol} from './roles.js';
import {protegerClave} from './seguridad.js';
import {transaccion} from '../basedatos/transaccion.js';
const LARGO_MINIMO_DE_CLAVE = 4;
const SEXOS = ['F', 'M']; // F = femenino · M = masculino
const SELECCIONAR_USUARIOS = `
  SELECT u.id, u.usuario, u.nombre, u.rol, u.sexo, r.nombre AS rol_nombre, u.activo, u.creado, u.foto,
    (SELECT COUNT(*) FROM ventas v WHERE v.usuario_id = u.id) AS ventas
  FROM usuarios u JOIN roles r ON r.clave = u.rol
  WHERE u.eliminado IS NULL`;
const consultas = {
  todos: bd.prepare(`${SELECCIONAR_USUARIOS} ORDER BY u.activo DESC, r.orden, u.nombre`),
  uno: bd.prepare(`${SELECCIONAR_USUARIOS} AND u.id = ?`),
  roles: bd.prepare(`
    SELECT r.clave, r.nombre, r.descripcion,
      (SELECT COUNT(*) FROM usuarios u WHERE u.rol = r.clave AND u.activo = 1) AS usuarios_activos
    FROM roles r ORDER BY r.orden`),
  paraIngresar: bd.prepare('SELECT * FROM usuarios WHERE lower(usuario) = lower(?) AND eliminado IS NULL'),
  cantidad: bd.prepare('SELECT COUNT(*) AS n FROM usuarios'),
  otrosAdministradoresActivos: bd.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'administrador' AND activo = 1 AND id != ?"),
  crear: bd.prepare('INSERT INTO usuarios (usuario, nombre, rol, clave_hash, clave_sal, sexo) VALUES (?, ?, ?, ?, ?, ?)'),
  editar: bd.prepare('UPDATE usuarios SET usuario = ?, nombre = ?, rol = ?, activo = ?, sexo = ? WHERE id = ?'),
  cambiarClave: bd.prepare('UPDATE usuarios SET clave_hash = ?, clave_sal = ? WHERE id = ?'),
  cerrarSusSesiones: bd.prepare('DELETE FROM sesiones WHERE usuario_id = ?'),
  borrar: bd.prepare('DELETE FROM usuarios WHERE id = ?'),
  marcarEliminado: bd.prepare(`
    UPDATE usuarios SET activo = 0, eliminado = now(), usuario = usuario || '#' || id
    WHERE id = ?`)
};
export async function listarUsuarios() {
  return (await consultas.todos.all()).map(conNombreDeRol);
}
// Cada rol trae su nombre masculino ("nombre") y femenino ("nombre_femenino") para los formularios.
export async function listarRoles() {
  return (await consultas.roles.all()).map((rol) => ({...rol, nombre_femenino: ROLES.find((opcion) => opcion.clave === rol.clave)?.nombreFemenino ?? rol.nombre}));
}
export async function hayUsuarios() {
  return (await consultas.cantidad.get()).n > 0;
}
export async function buscarParaIngresar(nombreDeUsuario) {
  return await consultas.paraIngresar.get(texto(nombreDeUsuario)) ?? null;
}
export async function crearUsuario(datos) {
  const {usuario, nombre, rol, sexo} = await revisarDatos(datos, {});
  if (!sexo) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Indica el sexo de la persona (femenino o masculino)');
  const {hash, sal} = protegerClave(claveValida(datos?.clave));
  const {lastInsertRowid: id} = await consultas.crear.run(usuario, nombre, rol, hash, sal, sexo);
  return conNombreDeRol(await consultas.uno.get(id));
}
export async function editarUsuario(id, datos, quienEdita) {
  const actual = await consultas.uno.get(id);
  if (!actual) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Usuario no encontrado');
  const {usuario, nombre, rol, sexo} = await revisarDatos(datos, actual);
  const activo = datos?.activo === undefined ? actual.activo : datos.activo ? 1 : 0;
  const claveNueva = texto(datos?.clave) ? claveValida(datos.clave) : null;
  if (id === quienEdita.id && !activo) {
    throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, 'No puedes desactivar tu propio usuario');
  }
  const dejaDeSerAdministrador = actual.rol === ADMINISTRADOR && actual.activo && (rol !== ADMINISTRADOR || !activo);
  if (dejaDeSerAdministrador && (await consultas.otrosAdministradoresActivos.get(id)).n === 0) {
    throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, 'Debe quedar al menos un administrador activo');
  }
  await transaccion(bd, async () => {
    await consultas.editar.run(usuario, nombre, rol, activo, sexo, id);
    if (claveNueva) {
      const {hash, sal} = protegerClave(claveNueva);
      await consultas.cambiarClave.run(hash, sal, id);
    }
    if (!activo || claveNueva && id !== quienEdita.id) await consultas.cerrarSusSesiones.run(id);
  });
  return conNombreDeRol(await consultas.uno.get(id));
}
export async function eliminarUsuario(id, quienElimina) {
  const actual = await consultas.uno.get(id);
  if (!actual) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Usuario no encontrado');
  if (id === quienElimina.id) throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, 'No puedes eliminar tu propio usuario');
  if (actual.rol === ADMINISTRADOR && actual.activo && (await consultas.otrosAdministradoresActivos.get(id)).n === 0) {
    throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, 'Debe quedar al menos un administrador activo');
  }
  const borradoPorCompleto = actual.ventas === 0;
  await transaccion(bd, async () => {
    await consultas.cerrarSusSesiones.run(id);
    if (borradoPorCompleto) await consultas.borrar.run(id); else await consultas.marcarEliminado.run(id);
  });
  return {
    id,
    nombre: actual.nombre,
    borradoPorCompleto
  };
}
async function revisarDatos(datos, actual) {
  const usuario = texto(datos?.usuario ?? actual.usuario).toLowerCase();
  const nombre = texto(datos?.nombre ?? actual.nombre);
  const rol = datos?.rol ?? actual.rol;
  if (!(/^[a-z0-9._-]{3,30}$/).test(usuario)) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El usuario debe tener de 3 a 30 caracteres: letras sin acentos, números, punto, guion o guion bajo (sin espacios)');
  }
  if (!nombre || nombre.length > 60) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Escribe el nombre completo (máximo 60 caracteres)');
  if (!ROLES.some(opcion => opcion.clave === rol)) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `Rol inválido. Elige uno de estos: ${ROLES.map(opcion => opcion.nombre).join(', ')}`);
  }
  const sexo = datos?.sexo === undefined ? (actual.sexo ?? null) : datos.sexo;
  if (sexo !== null && !SEXOS.includes(sexo)) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El sexo debe ser femenino o masculino');
  }
  const repetido = await consultas.paraIngresar.get(usuario);
  if (repetido && repetido.id !== actual.id) throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, `Ya existe el usuario "${usuario}"`);
  return {
    usuario,
    nombre,
    rol,
    sexo
  };
}
export function claveValida(clave) {
  const valor = String(clave ?? '');
  if (valor.length < LARGO_MINIMO_DE_CLAVE) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `La contraseña debe tener al menos ${LARGO_MINIMO_DE_CLAVE} caracteres`);
  }
  return valor;
}
