// Etiqueta de color con el estado del producto: OK, STOCK BAJO, AGOTADO o INACTIVO.

import { estadoDelProducto } from '../utilidades/calculos.js'

export default function EtiquetaEstado({ producto }) {
  const estado = estadoDelProducto(producto)
  return <b className={estado.clase}>{estado.texto}</b>
}
