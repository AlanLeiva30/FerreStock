// ─────────────────────────────────────────────────────────────
// BORRADOR DE LA COTIZACIÓN
// ─────────────────────────────────────────────────────────────
// Lo que se va escribiendo en la pantalla Cotizar se recuerda mientras la pestaña siga abierta
// (sessionStorage). También sirve para "Usar como base" una cotización ya guardada: se copia su
// contenido aquí y se abre la pantalla Cotizar.

const GUARDADO = 'ferrestock-cotizacion'

// lineas: [{ clave, productoId, cantidad (texto) }] · el resto son los datos que se escriben a mano
export const BORRADOR_VACIO = { lineas: [], cliente: '', documento: '', contacto: '', descuento: '', validez: '15', notas: '' }

// Lo escrito antes en esta pestaña (si el navegador no deja leerlo, se empieza en blanco).
export function leerBorrador() {
  try {
    const guardado = { ...BORRADOR_VACIO, ...JSON.parse(sessionStorage.getItem(GUARDADO) ?? '{}') }
    return { ...guardado, lineas: guardado.lineas.filter((linea) => linea.productoId) }
  } catch { return BORRADOR_VACIO }
}

export function guardarBorrador(borrador) {
  try { sessionStorage.setItem(GUARDADO, JSON.stringify(borrador)) } catch { /* sin guardado, sigue funcionando */ }
}

// Convierte una cotización guardada en un borrador nuevo (los precios se toman del catálogo de hoy).
// Solo se copian los productos que todavía existen en el catálogo.
export function borradorDesde(cotizacion, productos) {
  const lineas = cotizacion.detalle
    .map((linea, posicion) => ({ producto: productos.find((producto) => producto.codigo === linea.codigo && producto.activo), linea, posicion }))
    .filter(({ producto }) => producto)
    .map(({ producto, linea, posicion }) => ({ clave: `p${producto.id}-${posicion}`, productoId: producto.id, cantidad: String(linea.cantidad) }))
  return {
    lineas,
    cliente: cotizacion.cliente,
    documento: cotizacion.cliente_documento,
    contacto: cotizacion.contacto,
    descuento: cotizacion.descuento ? String(cotizacion.descuento) : '',
    validez: String(cotizacion.validez),
    notas: cotizacion.notas,
    omitidos: cotizacion.detalle.length - lineas.length, // productos que ya no están en el catálogo
  }
}
