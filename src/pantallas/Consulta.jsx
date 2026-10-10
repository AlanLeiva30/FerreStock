// ─────────────────────────────────────────────────────────────
// PANTALLA: CONSULTA DE INVENTARIO (para el mostrador)
// ─────────────────────────────────────────────────────────────
// Búsqueda rápida de productos activos, agrupados por categoría.
// Al hacer clic en un producto con stock se abre el registro de una venta.

import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import { formato } from '../utilidades/formato.js'

export default function Consulta({ productosFiltrados, busqueda, abrirMovimiento }) {
  const filas = productosFiltrados.filter((producto) => producto.activo)

  const venderProducto = (producto) => {
    if (producto.stock > 0) abrirMovimiento({ productoId: producto.id, tipo: 'salida', motivo: 'Venta al Contado' })
  }

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2>⌕ Consulta de Inventario</h2>
        <small className="muted">Haz clic en un producto para registrar una venta</small>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Código</th><th>Producto</th><th>Disponible</th><th>Precio</th><th>Estado</th></tr></thead>
          <tbody>
            <FilasPorCategoria productos={filas} columnas="5" dibujarFila={(producto) => (
              <tr key={producto.id} onClick={() => venderProducto(producto)}>
                <td className="yellow">{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td className="big">{formato.cantidad(producto.stock, producto.unidad)}</td>
                <td>{formato.dinero(producto.precio)}</td>
                <td><EtiquetaEstado producto={producto} /></td>
              </tr>
            )} />
            {!filas.length && (
              <FilaVacia columnas="5">
                {busqueda ? `No se encontraron productos con “${busqueda}”.` : 'No hay productos activos. Actívalos desde el Catálogo.'}
              </FilaVacia>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
