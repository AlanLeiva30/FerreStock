import {bd} from './baseDeDatos.js';
import {existeCategoria} from './categorias.js';
import {CODIGOS, ErrorParaElUsuario, texto} from './http.js';
import {ADMINISTRADOR, VENDEDOR} from './roles.js';
const SELECCIONAR_PRODUCTOS = `
  SELECT p.*, c.nombre AS categoria
  FROM productos p JOIN categorias c ON c.id = p.categoria_id`;
const consultas = {
  todos: bd.prepare(`${SELECCIONAR_PRODUCTOS} ORDER BY c.orden, c.nombre, p.nombre`),
  uno: bd.prepare(`${SELECCIONAR_PRODUCTOS} WHERE p.id = ?`),
  crear: bd.prepare(`
    INSERT INTO productos (codigo, nombre, categoria_id, unidad, stock, minimo, costo, precio)
    VALUES (:codigo, :nombre, :categoria_id, :unidad, :stock, :minimo, :costo, :precio)`),
  editar: bd.prepare(`
    UPDATE productos
    SET codigo = :codigo, nombre = :nombre, categoria_id = :categoria_id, unidad = :unidad,
        minimo = :minimo, costo = :costo, precio = :precio
    WHERE id = :id`),
  cambiarActivo: bd.prepare('UPDATE productos SET activo = ? WHERE id = ?')
};
export async function listarProductos(usuario) {
  const productos = await consultas.todos.all();
  if (usuario.rol === ADMINISTRADOR) return productos;
  const activos = productos.filter(producto => producto.activo);
  if (usuario.rol === VENDEDOR) return activos.map(({costo, ...resto}) => resto);
  return activos.map(({costo, precio, ...resto}) => resto);
}
export async function buscarProducto(id) {
  const producto = await consultas.uno.get(id);
  if (!producto) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Producto no encontrado');
  return producto;
}
export async function crearProducto(datos) {
  const {lastInsertRowid: id} = await consultas.crear.run(await revisarDatos(datos, {
    esNuevo: true
  }));
  return await consultas.uno.get(id);
}
export async function editarProducto(id, datos) {
  await buscarProducto(id);
  await consultas.editar.run({
    ...await revisarDatos(datos, {
      esNuevo: false
    }),
    id
  });
  return await consultas.uno.get(id);
}
export async function activarODesactivarProducto(id, datos) {
  await buscarProducto(id);
  await consultas.cambiarActivo.run(datos?.activo ? 1 : 0, id);
  return await consultas.uno.get(id);
}
async function revisarDatos(datos, {esNuevo}) {
  const limpio = {
    codigo: texto(datos?.codigo).toUpperCase(),
    nombre: texto(datos?.nombre),
    unidad: texto(datos?.unidad),
    categoria_id: Number(datos?.categoria_id)
  };
  if (!limpio.codigo) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El código es obligatorio');
  if (!limpio.nombre) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El nombre es obligatorio');
  if (!limpio.unidad) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'La unidad es obligatoria');
  if (!await existeCategoria(limpio.categoria_id)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Categoría inválida');
  const camposNumericos = esNuevo ? ['stock', 'minimo', 'costo', 'precio'] : ['minimo', 'costo', 'precio'];
  for (const campo of camposNumericos) {
    limpio[campo] = Number(datos?.[campo] ?? 0);
    if (!Number.isFinite(limpio[campo]) || limpio[campo] < 0) {
      throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `El campo "${campo}" debe ser un número positivo`);
    }
  }
  return limpio;
}
