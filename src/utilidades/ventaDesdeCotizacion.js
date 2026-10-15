// ─────────────────────────────────────────────────────────────
// PASAR UNA COTIZACIÓN A VENTA
// ─────────────────────────────────────────────────────────────
// Desde una cotización guardada, «Pasar a venta» deja aquí los productos, el cliente y el descuento
// y abre la pantalla Vender, que los carga en la venta actual. La venta se cobra como cualquier otra
// (con los precios y el stock de ese momento); al cobrarla, la cotización queda marcada como vendida.
// Se usa sessionStorage para llevar los datos de una pantalla a la otra.

import { formato } from './formato.js'

const GUARDADO = 'ferrestock-venta-desde-cotizacion'

// Prepara los datos de la venta a partir de la cotización. Devuelve un resumen para avisar a la persona.
export function prepararVenta(cotizacion, productos) {
  const lineas = []
  let omitidos = 0
  let preciosCambiaron = false
  cotizacion.detalle.forEach((linea, posicion) => {
    const producto = productos.find((opcion) => opcion.codigo === linea.codigo && opcion.activo)
    if (!producto) { omitidos += 1; return }
    if (producto.precio !== linea.precio) preciosCambiaron = true
    lineas.push({ productoId: producto.id, cantidad: String(linea.cantidad) })
  })
  const datos = {
    cotizacionId: cotizacion.id,
    numero: formato.cotizacion(cotizacion.id),
    lineas,
    cliente: cotizacion.cliente ?? '',
    documento: cotizacion.cliente_documento ?? '',
    descuento: cotizacion.descuento > 0 ? String(cotizacion.descuento) : '',
    omitidos,
    preciosCambiaron,
  }
  try { sessionStorage.setItem(GUARDADO, JSON.stringify(datos)) } catch { /* sin guardado no se puede llevar la cotización */ }
  return datos
}

// Lo que dejó «Pasar a venta» (o null si no hay nada). No lo borra: así funciona aunque React dibuje dos veces.
export function leerVentaPendiente() {
  try {
    const datos = JSON.parse(sessionStorage.getItem(GUARDADO) ?? 'null')
    return datos?.cotizacionId && Array.isArray(datos.lineas) ? datos : null
  } catch { return null }
}

export function limpiarVentaPendiente() {
  try { sessionStorage.removeItem(GUARDADO) } catch { /* nada que limpiar */ }
}
