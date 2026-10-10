// ─────────────────────────────────────────────────────────────
// CÁLCULOS DEL INVENTARIO
// ─────────────────────────────────────────────────────────────
// Operaciones que usan varias pantallas: estado de cada producto, alertas,
// búsquedas, totales y resúmenes por categoría.

// Estado de un producto, para mostrar su etiqueta de color.
// "clase" es el nombre del estilo en estilos.css.
export function estadoDelProducto(producto) {
  if (!producto.activo) return { texto: 'INACTIVO', clase: 'status off' }
  if (producto.stock <= 0) return { texto: 'AGOTADO', clase: 'status out' }
  if (producto.stock < producto.minimo) return { texto: 'STOCK BAJO', clase: 'status' }
  return { texto: 'OK', clase: 'status ok' }
}

// Productos activos con menos stock que el mínimo, primero los más urgentes
// (los que tienen menos stock en proporción a su mínimo).
export function listaDeAlertas(productos) {
  const urgencia = (producto) => producto.stock / (producto.minimo || 1)
  return productos
    .filter((producto) => producto.activo && producto.stock < producto.minimo)
    .sort((a, b) => urgencia(a) - urgencia(b))
}

// ¿Alguno de estos campos contiene el texto buscado? (sin importar mayúsculas)
// Si no se buscó nada, siempre responde que sí.
export function coincideConBusqueda(busqueda, ...campos) {
  const buscado = busqueda.trim().toLowerCase()
  return !buscado || campos.join(' ').toLowerCase().includes(buscado)
}

// Agrupa una lista de productos (ya ordenada por categoría) así:
// [{ categoria: 'Herramientas', productos: [...] }, { categoria: 'Ferretería', productos: [...] }, …]
export function agruparPorCategoria(productos) {
  const grupos = []
  for (const producto of productos) {
    const ultimoGrupo = grupos[grupos.length - 1]
    if (ultimoGrupo?.categoria === producto.categoria) ultimoGrupo.productos.push(producto)
    else grupos.push({ categoria: producto.categoria, productos: [producto] })
  }
  return grupos
}

// Totales del inventario (solo productos activos).
export function resumenDelInventario(productos) {
  const activos = productos.filter((producto) => producto.activo)
  const valorCosto = sumar(activos, (producto) => producto.stock * producto.costo)
  const valorVenta = sumar(activos, (producto) => producto.stock * producto.precio)
  const margen = valorCosto ? ((valorVenta - valorCosto) / valorCosto) * 100 : 0
  return { activos, valorCosto, valorVenta, margen }
}

// Un resumen por cada categoría (solo productos activos), en el orden de la lista de categorías.
export function resumenPorCategoria(productos, categorias) {
  return categorias.map(({ nombre }) => {
    const deEstaCategoria = productos.filter((producto) => producto.activo && producto.categoria === nombre)
    return {
      nombre,
      cantidadDeProductos: deEstaCategoria.length,
      unidades: sumar(deEstaCategoria, (producto) => producto.stock),
      valorCosto: sumar(deEstaCategoria, (producto) => producto.stock * producto.costo),
      valorVenta: sumar(deEstaCategoria, (producto) => producto.stock * producto.precio),
    }
  })
}

// Qué pasó en los últimos días: cuántas entradas y salidas hubo y los 5 productos más vendidos.
export function actividadReciente(movimientos, dias = 30) {
  const desde = Date.now() - dias * 24 * 60 * 60 * 1000
  const recientes = movimientos.filter((movimiento) => new Date(movimiento.fecha).getTime() >= desde)

  const vendidoPorProducto = new Map()
  for (const movimiento of recientes) {
    const esVenta = movimiento.tipo === 'salida' && movimiento.motivo.startsWith('Venta')
    if (!esVenta) continue
    const acumulado = vendidoPorProducto.get(movimiento.producto_id) || { nombre: movimiento.nombre, unidad: movimiento.unidad, cantidad: 0 }
    acumulado.cantidad += movimiento.cantidad
    vendidoPorProducto.set(movimiento.producto_id, acumulado)
  }

  return {
    masVendidos: [...vendidoPorProducto.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5),
    entradas: recientes.filter((movimiento) => movimiento.tipo === 'entrada').length,
    salidas: recientes.filter((movimiento) => movimiento.tipo === 'salida').length,
  }
}

function sumar(lista, valorDeCadaUno) {
  return lista.reduce((total, elemento) => total + valorDeCadaUno(elemento), 0)
}
