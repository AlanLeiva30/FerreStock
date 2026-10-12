// ─────────────────────────────────────────────────────────────
// PANTALLA: CONSULTA DE INVENTARIO (para el mostrador)
// ─────────────────────────────────────────────────────────────
// Búsqueda rápida de productos activos, agrupados por categoría.
//
//   - Administrador: al hacer clic en un producto con stock se abre el registro de una venta.
//   - Vendedor: es de SOLO LECTURA. Puede buscar y ver cuánto hay y a qué precio (nunca el costo:
//     el servidor no se lo envía), pero no puede modificar nada. Arriba ve un aviso con cuántos
//     productos están quedando pocos y cuántos ya se agotaron, y puede filtrar por eso.

import { useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import Icono from '../componentes/Icono.jsx'
import { formato } from '../utilidades/formato.js'

// Cada filtro dice qué productos deja pasar (solo los ve el vendedor).
const FILTROS = [
  { id: 'todos', texto: 'Todos', dejaPasar: () => true },
  { id: 'con-stock', texto: 'Con stock', dejaPasar: (producto) => producto.stock > 0 },
  { id: 'bajo', texto: 'Poco stock', dejaPasar: (producto) => producto.stock > 0 && producto.stock < producto.minimo },
  { id: 'agotados', texto: 'Agotados', dejaPasar: (producto) => producto.stock <= 0 },
]

export default function Consulta({ esAdmin, productos, productosFiltrados, busqueda, abrirMovimiento, recargar, irA }) {
  const [filtro, setFiltro] = useState('todos')
  const filtroElegido = FILTROS.find((opcion) => opcion.id === filtro)
  const activos = productosFiltrados.filter((producto) => producto.activo)
  const filas = esAdmin ? activos : activos.filter(filtroElegido.dejaPasar)

  // Avisos para el vendedor (se cuentan sobre todos los productos activos, no solo los buscados).
  const todosActivos = productos.filter((producto) => producto.activo)
  const agotados = todosActivos.filter(FILTROS[3].dejaPasar).length
  const pocos = todosActivos.filter(FILTROS[2].dejaPasar).length

  const venderProducto = (producto) => {
    if (esAdmin && producto.stock > 0) abrirMovimiento({ productoId: producto.id, tipo: 'salida', motivo: 'Venta al Contado' })
  }

  return (
    <section className={esAdmin ? 'panel view' : 'panel view solo-lectura'}>
      {!esAdmin && (agotados > 0 || pocos > 0) && (
        <div className="aviso-stock" role="status">
          <Icono nombre="alerta" tamano={20} />
          <p>
            <b>Atención con el stock:</b>{' '}
            {pocos > 0 && <><b>{pocos}</b> producto{pocos === 1 ? '' : 's'} con poco stock</>}
            {pocos > 0 && agotados > 0 && ' y '}
            {agotados > 0 && <><b>{agotados}</b> agotado{agotados === 1 ? '' : 's'}</>}.
            {' '}Avisa al administrador para que se reponga.
          </p>
          <button type="button" onClick={() => irA('alertas')}>Ver alertas</button>
        </div>
      )}

      <div className="panelhead">
        <h2><Icono nombre="buscar" className="antes" />Consulta de Inventario ({filas.length})</h2>
        {esAdmin ? (
          <small className="muted">Haz clic en un producto para registrar una venta</small>
        ) : (
          <div className="toolbar">
            <div className="filtros" role="group" aria-label="Filtrar por estado">
              {FILTROS.map((opcion) => (
                <button key={opcion.id} className={filtro === opcion.id ? 'on' : ''} aria-pressed={filtro === opcion.id} onClick={() => setFiltro(opcion.id)}>
                  {opcion.texto} <span>{todosActivos.filter(opcion.dejaPasar).length}</span>
                </button>
              ))}
            </div>
            <button onClick={recargar} title="Volver a leer el stock (por si alguien vendió o recibió mercadería)">↻ Actualizar</button>
          </div>
        )}
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
                {busqueda ? `No se encontraron productos con “${busqueda}”.`
                  : esAdmin ? 'No hay productos activos. Actívalos desde el Catálogo.'
                  : `No hay productos en “${filtroElegido.texto}”.`}
              </FilaVacia>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
