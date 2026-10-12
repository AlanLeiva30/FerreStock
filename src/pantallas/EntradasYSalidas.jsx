// ─────────────────────────────────────────────────────────────
// PANTALLA: ENTRADAS Y SALIDAS
// ─────────────────────────────────────────────────────────────
// El historial completo de movimientos, del más reciente al más antiguo.
// Se puede filtrar por tipo (entradas o salidas) y con el buscador.

import { useState } from 'react'
import FilaVacia from '../componentes/FilaVacia.jsx'
import { coincideConBusqueda } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import Icono from '../componentes/Icono.jsx'

export default function EntradasYSalidas({ movimientos, busqueda, abrirMovimiento }) {
  const [tipo, setTipo] = useState('') // '' = todos, 'entrada' o 'salida'
  const filas = movimientos.filter((movimiento) =>
    (!tipo || movimiento.tipo === tipo) &&
    coincideConBusqueda(busqueda, movimiento.codigo, movimiento.nombre, movimiento.categoria, movimiento.motivo, movimiento.usuario))

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="movimientos" className="antes" />Entradas y Salidas ({filas.length})</h2>
        <div className="toolbar">
          <select value={tipo} onChange={(evento) => setTipo(evento.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
          <button className="primary" onClick={() => abrirMovimiento()}><Icono nombre="mas" tamano={16} className="antes" />Registrar movimiento</button>
        </div>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>Fecha</th><th>Referencia</th><th>Producto</th><th>Categoría</th><th>Motivo</th><th>Cantidad</th><th>Usuario</th><th>Nota</th></tr></thead>
          <tbody>
            {filas.map((movimiento) => {
              const esEntrada = movimiento.tipo === 'entrada'
              return (
                <tr key={movimiento.id}>
                  <td>{formato.fecha(movimiento.fecha)}</td>
                  <td className="yellow">{formato.referencia(movimiento.id)}</td>
                  <td>{movimiento.nombre}</td>
                  <td className="muted">{movimiento.categoria}</td>
                  <td>{movimiento.motivo}</td>
                  <td className={esEntrada ? 'green' : 'red'}>{esEntrada ? '+' : '−'}{formato.cantidad(movimiento.cantidad, movimiento.unidad)}</td>
                  <td>{movimiento.usuario}</td>
                  <td className="muted">{movimiento.nota}</td>
                </tr>
              )
            })}
            {!filas.length && <FilaVacia columnas="8">No hay movimientos que coincidan.</FilaVacia>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
