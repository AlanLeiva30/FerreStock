// ─────────────────────────────────────────────────────────────
// PANTALLA: ENTRADAS Y SALIDAS
// ─────────────────────────────────────────────────────────────
// El historial completo de movimientos, del más reciente al más antiguo.
// Se puede filtrar por tipo (entradas o salidas), por día (Hoy, Ayer o una fecha) y con el buscador.

import { useEffect, useState } from 'react'
import FilaVacia from '../componentes/FilaVacia.jsx'
import { coincideConBusqueda } from '../utilidades/calculos.js'
import { diaDeHoy } from '../utilidades/fechas.js'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import Icono from '../componentes/Icono.jsx'

export default function EntradasYSalidas({ movimientos, busqueda, abrirMovimiento }) {
  const [tipo, setTipo] = useState('') // '' = todos, 'entrada' o 'salida'
  const [dia, setDia] = useState('') //                    día elegido ('AAAA-MM-DD'); vacío = todos los días
  const [delDia, setDelDia] = useState([]) //              movimientos del día elegido (los pide el servidor)
  const [cargando, setCargando] = useState(false)
  const hoy = diaDeHoy()

  useEffect(() => {
    if (!dia) return
    let vigente = true
    setCargando(true)
    servidor.movimientosDelDia(dia)
      .then((filas) => vigente && setDelDia(filas)).catch(() => vigente && setDelDia([]))
      .finally(() => vigente && setCargando(false))
    return () => { vigente = false }
  }, [dia, movimientos]) // también se vuelve a pedir cuando se registra un movimiento nuevo

  const filas = (dia ? delDia : movimientos).filter((movimiento) =>
    (!tipo || movimiento.tipo === tipo) &&
    coincideConBusqueda(busqueda, movimiento.codigo, movimiento.nombre, movimiento.categoria, movimiento.motivo, movimiento.usuario))

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="movimientos" className="antes" />Entradas y Salidas ({filas.length})</h2>
        <div className="toolbar">
          {/* Filtro por día: "Todos" muestra el historial completo; "Hoy" y "Ayer" son atajos; la fecha permite elegir cualquier día. */}
          <div className="filtro-dia filtro-dia-barra" role="group" aria-label="Ver por fecha">
            <button className={!dia ? 'on' : ''} aria-pressed={!dia} onClick={() => setDia('')}>Todos</button>
            <button className={dia === hoy ? 'on' : ''} aria-pressed={dia === hoy} onClick={() => setDia(hoy)}>Hoy</button>
            <button className={dia === diaDeHoy(-1) ? 'on' : ''} aria-pressed={dia === diaDeHoy(-1)} onClick={() => setDia(diaDeHoy(-1))}>Ayer</button>
            <input type="date" value={dia} max={hoy} onChange={(evento) => setDia(evento.target.value)} aria-label="Elegir un día" />
          </div>
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
            {!filas.length && <FilaVacia columnas="8">{cargando ? 'Cargando movimientos…' : dia ? 'No hay movimientos ese día con esos filtros.' : 'No hay movimientos que coincidan.'}</FilaVacia>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
