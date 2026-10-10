// Dibuja las filas de una tabla agrupadas por categoría:
//
//   🔨 Herramientas  2 productos      ← fila de título del grupo (con el ícono y el color de su área)
//   FER-1001  Martillo …              ← filas de productos
//   FER-1002  Taladro …
//   🔩 Ferretería  2 productos
//   …
//
// "dibujarFila" es la función que dibuja la fila de cada producto;
// cada pantalla decide qué columnas mostrar. Recibe el producto y su área
// ({ icono, color }), por si la pantalla quiere pintar la fila con ese color.
// Los íconos y colores de cada área están en src/utilidades/areas.js.

import { Fragment } from 'react'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { agruparPorCategoria } from '../utilidades/calculos.js'
import IconoDeArea from './IconoDeArea.jsx'

export default function FilasPorCategoria({ productos, columnas, dibujarFila }) {
  return agruparPorCategoria(productos).map((grupo) => {
    const area = areaDeLaCategoria(grupo.categoria)
    return (
      <Fragment key={grupo.categoria}>
        <tr className="group-row" style={{ '--color-area': area.color }}>
          <td colSpan={columnas}>
            <IconoDeArea categoria={grupo.categoria} />
            {grupo.categoria}
            <span className="grupo-cantidad">{grupo.productos.length} producto{grupo.productos.length === 1 ? '' : 's'}</span>
          </td>
        </tr>
        {grupo.productos.map((producto) => dibujarFila(producto, area))}
      </Fragment>
    )
  })
}
