import {bd} from './baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, texto} from './http.js';
import {transaccion} from './transaccion.js';
const consultas = {
  todas: bd.prepare(`
    SELECT c.id, c.nombre, c.orden, COUNT(p.id) AS productos
    FROM categorias c LEFT JOIN productos p ON p.categoria_id = c.id
    GROUP BY c.id ORDER BY c.orden, c.nombre`),
  una: bd.prepare('SELECT * FROM categorias WHERE id = ?'),
  crear: bd.prepare('INSERT INTO categorias (nombre, orden) VALUES (?, (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias))'),
  renombrar: bd.prepare('UPDATE categorias SET nombre = ? WHERE id = ?'),
  cambiarOrden: bd.prepare('UPDATE categorias SET orden = ? WHERE id = ?'),
  borrar: bd.prepare('DELETE FROM categorias WHERE id = ?'),
  contarProductos: bd.prepare('SELECT COUNT(*) AS n FROM productos WHERE categoria_id = ?')
};
export async function listarCategorias() {
  return await consultas.todas.all();
}
export async function existeCategoria(id) {
  return Boolean(await consultas.una.get(id));
}
export async function crearCategoria(datos) {
  const {lastInsertRowid: id} = await consultas.crear.run(await nombreValido(datos, null));
  return await consultas.una.get(id);
}
export async function renombrarCategoria(id, datos) {
  await buscarCategoria(id);
  await consultas.renombrar.run(await nombreValido(datos, id), id);
  return await consultas.una.get(id);
}
export async function moverCategoria(id, datos) {
  const direccion = Number(datos?.direccion);
  if (direccion !== 1 && direccion !== -1) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Dirección inválida');
  await transaccion(bd, async () => {
    await buscarCategoria(id);
    const lista = await consultas.todas.all();
    const posicion = lista.findIndex(categoria => categoria.id === id);
    const nuevaPosicion = posicion + direccion;
    if (nuevaPosicion < 0 || nuevaPosicion >= lista.length) return;
    [lista[posicion], lista[nuevaPosicion]] = [lista[nuevaPosicion], lista[posicion]];
    await Promise.all(lista.map(async (categoria, indice) => await consultas.cambiarOrden.run(indice + 1, categoria.id)));
  });
  return await consultas.todas.all();
}
export async function borrarCategoria(id) {
  const categoria = await buscarCategoria(id);
  const {n: cantidad} = await consultas.contarProductos.get(id);
  if (cantidad > 0) {
    throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, `No se puede borrar "${categoria.nombre}": tiene ${cantidad} producto(s). Muévelos a otra categoría primero.`);
  }
  await consultas.borrar.run(id);
  return {
    ok: true
  };
}
async function buscarCategoria(id) {
  const categoria = await consultas.una.get(id);
  if (!categoria) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Categoría no encontrada');
  return categoria;
}
async function nombreValido(datos, idPropio) {
  const nombre = texto(datos?.nombre);
  if (!nombre) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Escribe un nombre para la categoría');
  if (nombre.length > 40) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El nombre es demasiado largo (máximo 40 caracteres)');
  const repetida = (await consultas.todas.all()).find(categoria => categoria.id !== idPropio && categoria.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'));
  if (repetida) throw new ErrorParaElUsuario(CODIGOS.CONFLICTO, `Ya existe la categoría "${repetida.nombre}"`);
  return nombre;
}
