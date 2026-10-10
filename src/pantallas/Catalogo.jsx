// ─────────────────────────────────────────────────────────────
// PANTALLA: CATÁLOGO DE PRODUCTOS
// ─────────────────────────────────────────────────────────────
// Todos los productos agrupados por categoría. Desde aquí se puede:
// crear, editar, activar o desactivar productos, registrar un movimiento
// y administrar las categorías.

import { useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import { formato } from '../utilidades/formato.js'

export default function Catalogo({ productosFiltrados, configuracion, categoria, elegirCategoria, abrirProducto, abrirMovimiento, abrirCategorias, activarODesactivar }) {
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const filas = productosFiltrados.filter((producto) => mostrarInactivos || producto.activo)
  const cantidadDeInactivos = productosFiltrados.filter((producto) => !producto.activo).length

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2>◇ Catálogo de Productos ({filas.length})</h2>

        {/* Barra de herramientas: filtro de categoría, mostrar inactivos y botones */}
        <div className="toolbar">
          <select value={categoria} onChange={(evento) => elegirCategoria(evento.target.value)} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {configuracion.categorias.map((opcion) => <option key={opcion.id} value={opcion.nombre}>{opcion.nombre}</option>)}
          </select>
          <label className="check">
            <input type="checkbox" checked={mostrarInactivos} onChange={(evento) => setMostrarInactivos(evento.target.checked)} />
            {' '}Mostrar inactivos{cantidadDeInactivos > 0 && ` (${cantidadDeInactivos})`}
          </label>
          <button onClick={abrirCategorias}>▤ Categorías</button>
          <button className="primary" onClick={() => abrirProducto()}>＋ Nuevo producto</button>
        </div>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Código</th><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Costo</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            <FilasPorCategoria productos={filas} columnas="8" dibujarFila={(producto) => (
              <tr key={producto.id} className={producto.activo ? '' : 'inactive'}>
                <td className="yellow">{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td>{formato.cantidad(producto.stock, producto.unidad)}</td>
                <td>{formato.cantidad(producto.minimo, producto.unidad)}</td>
                <td>{formato.dinero(producto.costo)}</td>
                <td>{formato.dinero(producto.precio)}</td>
                <td><EtiquetaEstado producto={producto} /></td>
                <td className="row-actions">
                  <button onClick={() => abrirProducto(producto)}>Editar</button>
                  {producto.activo ? <button onClick={() => abrirMovimiento({ productoId: producto.id })}>Movimiento</button> : null}
                  <button onClick={() => activarODesactivar(producto)}>{producto.activo ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            )} />

            {!filas.length && (
              <FilaVacia columnas="8">
                {!mostrarInactivos && cantidadDeInactivos > 0 ? (
                  <>
                    Hay {cantidadDeInactivos} producto(s) inactivo(s) oculto(s).{' '}
                    <button className="link" onClick={() => setMostrarInactivos(true)}>Mostrar inactivos</button>
                  </>
                ) : 'No se encontraron productos con los filtros actuales.'}
              </FilaVacia>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
