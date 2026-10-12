import {bd, consultar} from '../basedatos/baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, texto} from '../comun/http.js';
import {MOTIVOS} from './motivos.js';
import {buscarProducto} from './productos.js';
import {transaccion} from '../basedatos/transaccion.js';
const SELECCIONAR_MOVIMIENTOS = `
  SELECT m.*, p.codigo, p.nombre, p.unidad, c.nombre AS categoria
  FROM movimientos m
    JOIN productos p ON p.id = m.producto_id
    JOIN categorias c ON c.id = p.categoria_id`;
const consultas = {
  ultimos: bd.prepare(`${SELECCIONAR_MOVIMIENTOS} ORDER BY m.fecha DESC, m.id DESC LIMIT ?`),
  uno: bd.prepare(`${SELECCIONAR_MOVIMIENTOS} WHERE m.id = ?`),
  crear: bd.prepare('INSERT INTO movimientos (producto_id, tipo, motivo, cantidad, usuario, nota) VALUES (?, ?, ?, ?, ?, ?)'),
  sumarAlStock: bd.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?')
};
export async function listarMovimientos(limite) {
  const cantidad = Math.trunc(Math.min(Math.max(Number(limite) || 50, 1), 1000));
  return await consultas.ultimos.all(cantidad);
}
export async function registrarMovimiento(datos, usuario) {
  const tipo = datos?.tipo;
  if (!MOTIVOS[tipo]) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Tipo de movimiento inválido');
  if (!MOTIVOS[tipo].includes(datos.motivo)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Motivo inválido para este tipo de movimiento');
  const cantidad = Number(datos.cantidad);
  if (!Number.isFinite(cantidad) || !(cantidad > 0)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'La cantidad debe ser mayor que cero');
  return await transaccion(bd, async () => {
    await consultar('SELECT id FROM productos WHERE id = $1 FOR UPDATE', [Number(datos.productoId)]);
    const producto = await buscarProducto(Number(datos.productoId));
    if (!producto.activo) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El producto está inactivo');
    if (tipo === 'salida' && cantidad > producto.stock) {
      throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `Stock insuficiente: solo hay ${producto.stock} ${producto.unidad}`);
    }
    const {lastInsertRowid: id} = await consultas.crear.run(producto.id, tipo, datos.motivo, cantidad, usuario.nombre, texto(datos.nota));
    await consultas.sumarAlStock.run(tipo === 'salida' ? -cantidad : cantidad, producto.id);
    return {
      movimiento: await consultas.uno.get(id),
      producto: await buscarProducto(producto.id)
    };
  });
}
