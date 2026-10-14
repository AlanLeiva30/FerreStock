import {bd, consultar} from '../basedatos/baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, texto} from '../comun/http.js';
import {datosDelNegocio} from './negocio.js';
import {buscarProducto} from '../inventario/productos.js';
import {ADMINISTRADOR} from '../acceso/roles.js';
import {transaccion} from '../basedatos/transaccion.js';
const MOTIVO_DE_VENTA = 'Venta al Contado';
const CLIENTE_SIN_NOMBRE = 'Consumidor Final';
// "descuento" es el porcentaje que se rebajó al total de la venta (0 = sin descuento). La columna se crea sola
// al arrancar el servidor si falta; las ventas anteriores quedan con 0.
const columnaLista = consultar('ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS descuento numeric(5,2) NOT NULL DEFAULT 0').catch(error => {
  console.error('[FerreStock] No se pudo preparar la columna de descuento:', error.code || error.message);
});
const SELECCIONAR_VENTAS = `
  SELECT v.id, v.total, v.descuento, v.recibido, v.cambio, v.fecha, v.usuario_id, u.nombre AS vendedor,
    v.cliente, v.cliente_documento,
    (SELECT COUNT(*) FROM movimientos m WHERE m.venta_id = v.id) AS productos
  FROM ventas v JOIN usuarios u ON u.id = v.usuario_id`;
const DE_HOY = "(v.fecha AT TIME ZONE 'America/El_Salvador')::date = (now() AT TIME ZONE 'America/El_Salvador')::date";
const consultas = {
  crearVenta: bd.prepare('INSERT INTO ventas (usuario_id, total, descuento, recibido, cambio, cliente, cliente_documento) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  agregarSalida: bd.prepare(`
    INSERT INTO movimientos (producto_id, tipo, motivo, cantidad, usuario, nota, venta_id, precio_unitario)
    VALUES (?, 'salida', ?, ?, ?, ?, ?, ?)`),
  restarStock: bd.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?'),
  una: bd.prepare(`${SELECCIONAR_VENTAS} WHERE v.id = ?`),
  detalle: bd.prepare(`
    SELECT p.codigo, p.nombre, p.unidad, m.cantidad, m.precio_unitario
    FROM movimientos m JOIN productos p ON p.id = m.producto_id
    WHERE m.venta_id = ? ORDER BY m.id`),
  deHoy: bd.prepare(`${SELECCIONAR_VENTAS} WHERE ${DE_HOY} ORDER BY v.id DESC`),
  deHoyDeUnVendedor: bd.prepare(`${SELECCIONAR_VENTAS} WHERE ${DE_HOY} AND v.usuario_id = ? ORDER BY v.id DESC`),
  porDia: bd.prepare(`
    WITH RECURSIVE dias(dia) AS (
      SELECT (now() AT TIME ZONE 'America/El_Salvador')::date + (?::interval)::interval
      UNION ALL SELECT dia + interval '1 day' FROM dias WHERE dia < (now() AT TIME ZONE 'America/El_Salvador')::date
    )
    SELECT d.dia::date AS fecha, COUNT(v.id) AS facturas, COALESCE(SUM(v.total), 0) AS total
    FROM dias d LEFT JOIN ventas v ON (v.fecha AT TIME ZONE 'America/El_Salvador')::date = d.dia::date
    GROUP BY d.dia ORDER BY d.dia`)
};
export async function cobrarVenta(datos, vendedor) {
  await columnaLista;
  const carrito = Array.isArray(datos?.productos) ? datos.productos : [];
  if (!carrito.length) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Agrega al menos un producto a la venta');
  const cliente = texto(datos?.cliente) || CLIENTE_SIN_NOMBRE;
  const clienteDocumento = texto(datos?.clienteDocumento);
  if (cliente.length > 80) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El nombre del cliente es muy largo (máximo 80 letras)');
  if (clienteDocumento.length > 30) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El DUI/NIT del cliente es muy largo (máximo 30 caracteres)');
  const descuento = datos?.descuento === undefined || datos.descuento === null || datos.descuento === '' ? 0 : Number(datos.descuento);
  if (!(descuento >= 0 && descuento <= 100)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El descuento debe estar entre 0 y 100 %');
  const cantidades = new Map();
  for (const item of carrito) {
    const productoId = Number(item?.productoId);
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(productoId) || (!Number.isFinite(cantidad) || !(cantidad > 0))) {
      throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Hay una cantidad inválida en la venta');
    }
    cantidades.set(productoId, (cantidades.get(productoId) ?? 0) + cantidad);
  }
  return await transaccion(bd, async () => {
    await consultar('SELECT id FROM productos WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE', [[...cantidades.keys()]]);
    const lineas = await Promise.all([...cantidades].map(async ([productoId, cantidad]) => {
      const producto = await buscarProducto(productoId);
      if (!producto.activo) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `"${producto.nombre}" está desactivado`);
      if (cantidad > producto.stock) {
        throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `No alcanza el stock de "${producto.nombre}": solo hay ${producto.stock} ${producto.unidad}`);
      }
      return {
        producto,
        cantidad,
        subtotal: redondear(cantidad * producto.precio)
      };
    }));
    const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0));
    const total = redondear(subtotal - redondear(subtotal * descuento / 100));
    let recibido = null;
    let cambio = null;
    if (datos.recibido !== undefined && datos.recibido !== null && datos.recibido !== '') {
      recibido = Number(datos.recibido);
      if (!Number.isFinite(recibido) || recibido < total) {
        throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'El efectivo recibido no alcanza para pagar el total');
      }
      cambio = redondear(recibido - total);
    }
    const {lastInsertRowid: ventaId} = await consultas.crearVenta.run(vendedor.id, total, redondear(descuento), recibido, cambio, cliente, clienteDocumento);
    for (const {producto, cantidad} of lineas) {
      await consultas.agregarSalida.run(producto.id, MOTIVO_DE_VENTA, cantidad, vendedor.nombre, `Venta #${ventaId}`, ventaId, producto.precio);
      await consultas.restarStock.run(cantidad, producto.id);
    }
    return await facturaCompleta(ventaId);
  });
}
export async function verFactura(ventaId, usuario) {
  await columnaLista;
  const venta = await consultas.una.get(ventaId);
  if (!venta || usuario.rol !== ADMINISTRADOR && venta.usuario_id !== usuario.id) {
    throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Factura no encontrada');
  }
  return await facturaCompleta(ventaId);
}
export async function ventasDeHoy(usuario) {
  await columnaLista;
  const ventas = usuario.rol === ADMINISTRADOR ? await consultas.deHoy.all() : await consultas.deHoyDeUnVendedor.all(usuario.id);
  return {
    ventas,
    cantidad: ventas.length,
    total: redondear(ventas.reduce((suma, venta) => suma + venta.total, 0))
  };
}
// Historial de facturas. El administrador ve todas; el vendedor, solo las suyas.
// Filtros opcionales: desde / hasta (AAAA-MM-DD), q (cliente, DUI/NIT, vendedor o número de factura) y limite.
export async function listarVentas(parametros, usuario) {
  await columnaLista;
  const dia = /^\d{4}-\d{2}-\d{2}$/;
  const desde = parametros.get('desde') || '';
  const hasta = parametros.get('hasta') || '';
  if (desde && !dia.test(desde) || hasta && !dia.test(hasta)) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Las fechas no son válidas');
  const limite = Math.min(Math.max(Math.trunc(Number(parametros.get('limite'))) || 100, 1), 300);
  const busqueda = texto(parametros.get('q')).slice(0, 80);
  const condiciones = [];
  const valores = [];
  const agregar = valor => '$' + valores.push(valor);
  const EL_DIA = "(v.fecha AT TIME ZONE 'America/El_Salvador')::date";
  if (usuario.rol !== ADMINISTRADOR) condiciones.push(`v.usuario_id = ${agregar(usuario.id)}`);
  if (desde) condiciones.push(`${EL_DIA} >= ${agregar(desde)}::date`);
  if (hasta) condiciones.push(`${EL_DIA} <= ${agregar(hasta)}::date`);
  if (busqueda) {
    const comodin = agregar(`%${busqueda.replace(/[\\%_]/g, '\\$&')}%`);
    const numero = /^\d{1,9}$/.test(busqueda) ? ` OR v.id = ${agregar(Number(busqueda))}` : '';
    condiciones.push(`(v.cliente ILIKE ${comodin} OR v.cliente_documento ILIKE ${comodin} OR u.nombre ILIKE ${comodin}${numero})`);
  }
  const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  const ventas = (await consultar(`${SELECCIONAR_VENTAS}${donde} ORDER BY v.id DESC LIMIT ${limite}`, valores)).rows;
  return {
    ventas,
    cantidad: ventas.length,
    total: redondear(ventas.reduce((suma, venta) => suma + Number(venta.total), 0))
  };
}
export async function ventasPorDia(dias) {
  const cantidadDeDias = Number(dias ?? 7);
  if (!Number.isInteger(cantidadDeDias) || cantidadDeDias < 1 || cantidadDeDias > 90) {
    throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Elige entre 1 y 90 días');
  }
  return (await consultas.porDia.all(`-${cantidadDeDias - 1} days`)).map(dia => ({
    ...dia,
    total: redondear(dia.total)
  }));
}
async function facturaCompleta(ventaId) {
  const detalle = (await consultas.detalle.all(ventaId)).map(linea => ({
    ...linea,
    subtotal: redondear(linea.cantidad * linea.precio_unitario)
  }));
  const venta = await consultas.una.get(ventaId);
  const subtotal = redondear(detalle.reduce((suma, linea) => suma + linea.subtotal, 0));
  return {
    ...venta,
    subtotal,
    descuento_monto: redondear(subtotal - venta.total),
    detalle,
    negocio: await datosDelNegocio()
  };
}
const redondear = numero => Math.round(numero * 100) / 100;
