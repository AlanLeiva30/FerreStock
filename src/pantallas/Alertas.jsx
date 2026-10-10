// ─────────────────────────────────────────────────────────────
// PANTALLA: ALERTAS DE STOCK MÍNIMO
// ─────────────────────────────────────────────────────────────
// Productos con menos stock que el mínimo, los más urgentes primero.
// Muestra cuánto falta y cuánto costaría reponerlo. El botón "Reabastecer"
// abre el registro de la entrada con la cantidad que falta ya escrita.

import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import { coincideConBusqueda } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'

export default function Alertas({ alertas, busqueda, abrirMovimiento }) {
  const filas = alertas.filter((producto) => coincideConBusqueda(busqueda, producto.codigo, producto.nombre, producto.categoria))
  const costoTotalDeReponer = filas.reduce((total, producto) => total + (producto.minimo - producto.stock) * producto.costo, 0)

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2>△ Alertas de Stock Mínimo ({filas.length})</h2>
        <small className="muted">Costo estimado para llegar al mínimo: <b className="yellow">{formato.dinero(costoTotalDeReponer)}</b></small>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Código</th><th>Producto</th><th>Disponible</th><th>Mínimo</th><th>Faltan</th><th>Costo reposición</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filas.map((producto) => {
              const faltan = producto.minimo - producto.stock
              return (
                <tr key={producto.id}>
                  <td className="yellow">{producto.codigo}</td>
                  <td>{producto.nombre}</td>
                  <td className="yellow">{formato.cantidad(producto.stock, producto.unidad)}</td>
                  <td>{formato.cantidad(producto.minimo, producto.unidad)}</td>
                  <td className="red">{formato.cantidad(faltan, producto.unidad)}</td>
                  <td>{formato.dinero(faltan * producto.costo)}</td>
                  <td><EtiquetaEstado producto={producto} /></td>
                  <td className="row-actions">
                    <button onClick={() => abrirMovimiento({ productoId: producto.id, tipo: 'entrada', motivo: 'Reabastecimiento', cantidad: faltan })}>Reabastecer</button>
                  </td>
                </tr>
              )
            })}
            {!filas.length && <FilaVacia columnas="8">No hay productos por debajo del mínimo.</FilaVacia>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
