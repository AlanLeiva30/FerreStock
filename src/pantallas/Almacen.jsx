// ─────────────────────────────────────────────────────────────
// PANTALLA: STOCK DEL ALMACÉN (para el trabajador de almacén)
// ─────────────────────────────────────────────────────────────
// Muestra cuánto hay de cada producto, agrupado por categoría. Solo se mira:
// aquí no se cambia nada, y no aparecen precios ni costos (el servidor ni
// siquiera se los envía al trabajador).
//
// Los botones de arriba filtran la lista: Todos / Con stock / Stock bajo / Agotados.
// El buscador de arriba busca por nombre, código o categoría.

import { useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import { formato } from '../utilidades/formato.js'

// Cada filtro dice qué productos deja pasar.
const FILTROS = [
  { id: 'todos', texto: 'Todos', dejaPasar: () => true },
  { id: 'con-stock', texto: 'Con stock', dejaPasar: (producto) => producto.stock > 0 },
  { id: 'bajo', texto: 'Stock bajo', dejaPasar: (producto) => producto.stock > 0 && producto.stock < producto.minimo },
  { id: 'agotados', texto: 'Agotados', dejaPasar: (producto) => producto.stock <= 0 },
]

export default function Almacen({ productosFiltrados, busqueda, recargar }) {
  const [filtro, setFiltro] = useState('todos')
  const activos = productosFiltrados.filter((producto) => producto.activo)
  const filtroElegido = FILTROS.find((opcion) => opcion.id === filtro)
  const filas = activos.filter(filtroElegido.dejaPasar)

  return (
    <section className="panel view solo-lectura">
      <div className="panelhead">
        <h2>▤ Stock del Almacén ({filas.length})</h2>
        <div className="toolbar">
          <div className="filtros" role="group" aria-label="Filtrar por estado">
            {FILTROS.map((opcion) => (
              <button key={opcion.id} className={filtro === opcion.id ? 'on' : ''} aria-pressed={filtro === opcion.id} onClick={() => setFiltro(opcion.id)}>
                {opcion.texto} <span>{activos.filter(opcion.dejaPasar).length}</span>
              </button>
            ))}
          </div>
          <button onClick={recargar} title="Volver a leer el stock (por si alguien vendió o recibió mercadería)">↻ Actualizar</button>
        </div>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Código</th><th>Producto</th><th>En almacén</th><th>Mínimo</th><th>Estado</th></tr></thead>
          <tbody>
            <FilasPorCategoria productos={filas} columnas="5" dibujarFila={(producto) => (
              <tr key={producto.id}>
                <td className="yellow">{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td className="big">{formato.cantidad(producto.stock, producto.unidad)}</td>
                <td>{formato.cantidad(producto.minimo, producto.unidad)}</td>
                <td><EtiquetaEstado producto={producto} /></td>
              </tr>
            )} />
            {!filas.length && (
              <FilaVacia columnas="5">
                {busqueda ? `No se encontraron productos con “${busqueda}”.` : `No hay productos en “${filtroElegido.texto}”.`}
              </FilaVacia>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
