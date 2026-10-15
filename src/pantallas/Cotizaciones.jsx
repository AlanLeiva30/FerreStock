// ─────────────────────────────────────────────────────────────
// PANTALLA: COTIZACIONES (las ya guardadas)
// ─────────────────────────────────────────────────────────────
// La lista de cotizaciones hechas, de la más reciente a la más antigua. Por defecto muestra los últimos
// 30 días; se puede cambiar el rango de fechas o buscar por cliente, DUI/NIT o número.
// Al tocar una se abre para verla, imprimirla o guardarla como PDF, o para "usarla como base" de una nueva.
// El administrador ve las de todos; el vendedor, solo las suyas (lo decide el servidor).

import { useEffect, useState } from 'react'
import FilaVacia from '../componentes/FilaVacia.jsx'
import Icono from '../componentes/Icono.jsx'
import Ventana from '../componentes/Ventana.jsx'
import { borradorDesde, guardarBorrador } from '../utilidades/borradorDeCotizacion.js'
import { diaDeHoy } from '../utilidades/fechas.js'
import { prepararVenta } from '../utilidades/ventaDesdeCotizacion.js'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import VerCotizacion from '../ventanas/VerCotizacion.jsx'

const DIA_EN_MS = 24 * 60 * 60 * 1000

export default function Cotizaciones({ esAdmin, productos, irA, avisar }) {
  const [desde, setDesde] = useState(diaDeHoy(-29))
  const [hasta, setHasta] = useState(diaDeHoy())
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState({ cotizaciones: [], cantidad: 0, total: 0 })
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState(null) // cotización abierta en la ventana (null = ninguna)

  // Vuelve a pedir la lista al cambiar un filtro (el texto espera un momento a que termines de escribir).
  useEffect(() => {
    let vigente = true
    const espera = setTimeout(async () => {
      setCargando(true)
      try {
        const respuesta = await servidor.listaDeCotizaciones({ desde, hasta, q: texto.trim(), limite: 200 })
        if (vigente) setLista(respuesta)
      } catch (problema) {
        if (vigente) avisar(`Error: ${problema.message}`)
      } finally {
        if (vigente) setCargando(false)
      }
    }, 250)
    return () => { vigente = false; clearTimeout(espera) }
  }, [desde, hasta, texto, avisar])

  const abrir = async (id) => {
    try {
      setAbierta(await servidor.verCotizacion(id))
    } catch (problema) {
      avisar(`Error: ${problema.message}`)
    }
  }

  // Copia la cotización a la pantalla Cotizar para armar una parecida (con los precios de hoy).
  const usarComoBase = (cotizacion) => {
    const { omitidos, ...borrador } = borradorDesde(cotizacion, productos)
    guardarBorrador(borrador)
    setAbierta(null)
    irA('cotizar')
    avisar(omitidos ? `Copiada. ${omitidos} producto${omitidos === 1 ? '' : 's'} ya no está${omitidos === 1 ? '' : 'n'} en el catálogo y se omitió` : 'Copiada: ajusta lo que necesites y guárdala como una cotización nueva')
  }

  // Lleva la cotización a la pantalla Vender para cobrarla (ver utilidades/ventaDesdeCotizacion.js).
  const pasarAVenta = (cotizacion) => {
    prepararVenta(cotizacion, productos)
    setAbierta(null)
    irA('vender')
  }

  const vigente = (cotizacion) => new Date(cotizacion.fecha).getTime() + cotizacion.validez * DIA_EN_MS >= Date.now()

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="carpeta" className="antes" />Cotizaciones ({lista.cantidad})</h2>
        <div className="toolbar filtros-facturas">
          <label>Desde <input type="date" value={desde} max={hasta || undefined} onChange={(evento) => setDesde(evento.target.value)} /></label>
          <label>Hasta <input type="date" value={hasta} min={desde || undefined} onChange={(evento) => setHasta(evento.target.value)} /></label>
          <input className="pos-buscar" value={texto} onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar cliente, DUI/NIT o N.º…" aria-label="Buscar cotización" />
          <button className="primary" onClick={() => irA('cotizar')}><Icono nombre="mas" tamano={16} className="antes" />Nueva cotización</button>
        </div>
      </div>

      <div className="ventas-hoy-resumen">
        <span>{lista.cantidad} cotizaci{lista.cantidad === 1 ? 'ón' : 'ones'}{lista.cantidad >= 200 ? ' (las 200 más recientes)' : ''}</span>
        <strong>{formato.dinero(lista.total)}</strong>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>N.º</th><th>Fecha</th><th>Cliente</th><th>Productos</th>{esAdmin && <th>Atendió</th>}<th>Estado</th><th>Total</th></tr></thead>
          <tbody>
            {lista.cotizaciones.map((cotizacion) => (
              <tr key={cotizacion.id} onClick={() => abrir(cotizacion.id)} title="Ver, imprimir o guardar como PDF">
                <td className="yellow">{formato.cotizacion(cotizacion.id)}</td>
                <td>{formato.fechaCompleta(cotizacion.fecha)}</td>
                <td>{cotizacion.cliente || <span className="muted">Cliente general</span>}{cotizacion.cliente_documento && <small className="muted"> · {cotizacion.cliente_documento}</small>}</td>
                <td>{cotizacion.productos}</td>
                {esAdmin && <td className="muted">{cotizacion.atendio}</td>}
                <td>{cotizacion.venta_id
                  ? <span className="status vendida" title={`Factura ${formato.factura(cotizacion.venta_id)}`}>VENDIDA</span>
                  : <span className={vigente(cotizacion) ? 'status ok' : 'status off'}>{vigente(cotizacion) ? 'VIGENTE' : 'VENCIDA'}</span>}</td>
                <td className="green"><b>{formato.dinero(cotizacion.total)}</b>{cotizacion.descuento > 0 && <small className="muted"> −{formato.numero(cotizacion.descuento)}%</small>}</td>
              </tr>
            ))}
            {!lista.cotizaciones.length && <FilaVacia columnas={esAdmin ? '7' : '6'}>{cargando ? 'Cargando cotizaciones…' : 'No hay cotizaciones con esos filtros.'}</FilaVacia>}
          </tbody>
        </table>
      </div>

      {abierta && (
        <Ventana alCerrar={() => setAbierta(null)} ancha="grande">
          <VerCotizacion guardada={abierta} alPasarAVenta={pasarAVenta} alUsarComoBase={usarComoBase} alCerrar={() => setAbierta(null)} />
        </Ventana>
      )}
    </section>
  )
}
