// ─────────────────────────────────────────────────────────────
// PANTALLA: FACTURAS
// ─────────────────────────────────────────────────────────────
// El historial de facturas, de la más reciente a la más antigua. Por defecto muestra los
// últimos 30 días; se puede cambiar el rango de fechas o buscar por cliente, DUI/NIT o número.
// Al tocar una factura se abre para verla o reimprimirla.
// El administrador ve las de todos; el vendedor, solo las suyas (lo decide el servidor).

import { useEffect, useState } from 'react'
import FilaVacia from '../componentes/FilaVacia.jsx'
import Icono from '../componentes/Icono.jsx'
import Ventana from '../componentes/Ventana.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import VerFactura from '../ventanas/VerFactura.jsx'

// Fecha de la computadora como 'AAAA-MM-DD', moviéndola unos días (0 = hoy, -29 = hace 29 días).
const dia = (desplazamiento = 0) => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + desplazamiento)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export default function Facturas({ esAdmin, avisar }) {
  const [desde, setDesde] = useState(dia(-29))
  const [hasta, setHasta] = useState(dia())
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState({ ventas: [], cantidad: 0, total: 0 })
  const [cargando, setCargando] = useState(true)
  const [factura, setFactura] = useState(null) // factura abierta en la ventana (null = ninguna)

  // Vuelve a pedir la lista al cambiar un filtro (el texto espera un momento a que termines de escribir).
  useEffect(() => {
    let vigente = true
    const espera = setTimeout(async () => {
      setCargando(true)
      try {
        const respuesta = await servidor.listaDeVentas({ desde, hasta, q: texto.trim(), limite: 200 })
        if (vigente) setLista(respuesta)
      } catch (problema) {
        if (vigente) avisar(`Error: ${problema.message}`)
      } finally {
        if (vigente) setCargando(false)
      }
    }, 250)
    return () => { vigente = false; clearTimeout(espera) }
  }, [desde, hasta, texto, avisar])

  const abrirFactura = async (ventaId) => {
    try {
      setFactura(await servidor.verFactura(ventaId))
    } catch (problema) {
      avisar(`Error: ${problema.message}`)
    }
  }

  const columnas = esAdmin ? 6 : 5

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="factura" className="antes" />Facturas ({lista.cantidad})</h2>
        <div className="toolbar filtros-facturas">
          <label>Desde <input type="date" value={desde} max={hasta || undefined} onChange={(evento) => setDesde(evento.target.value)} /></label>
          <label>Hasta <input type="date" value={hasta} min={desde || undefined} onChange={(evento) => setHasta(evento.target.value)} /></label>
          <input className="pos-buscar" value={texto} onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar cliente, DUI/NIT o N.º…" aria-label="Buscar factura" />
        </div>
      </div>

      <div className="ventas-hoy-resumen">
        <span>{lista.cantidad} factura{lista.cantidad === 1 ? '' : 's'}{lista.cantidad >= 200 ? ' (las 200 más recientes)' : ''}</span>
        <strong>{formato.dinero(lista.total)}</strong>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>N.º</th><th>Fecha</th><th>Cliente</th><th>Productos</th>{esAdmin && <th>Vendedor</th>}<th>Total</th></tr></thead>
          <tbody>
            {lista.ventas.map((venta) => (
              <tr key={venta.id} onClick={() => abrirFactura(venta.id)} title="Ver o reimprimir la factura">
                <td className="yellow">{formato.factura(venta.id)}</td>
                <td>{formato.fechaCompleta(venta.fecha)}</td>
                <td>{venta.cliente}{venta.cliente_documento && <small className="muted"> · {venta.cliente_documento}</small>}</td>
                <td>{Number(venta.productos)}</td>
                {esAdmin && <td className="muted">{venta.vendedor}</td>}
                <td className="green"><b>{formato.dinero(venta.total)}</b></td>
              </tr>
            ))}
            {!lista.ventas.length && <FilaVacia columnas={String(columnas)}>{cargando ? 'Cargando facturas…' : 'No hay facturas con esos filtros.'}</FilaVacia>}
          </tbody>
        </table>
      </div>

      {factura && (
        <Ventana alCerrar={() => setFactura(null)}>
          <VerFactura venta={factura} alCerrar={() => setFactura(null)} />
        </Ventana>
      )}
    </section>
  )
}
