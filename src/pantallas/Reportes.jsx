// ─────────────────────────────────────────────────────────────
// PANTALLA: REPORTES Y ESTADÍSTICAS
// ─────────────────────────────────────────────────────────────
// De arriba hacia abajo:
//   1. Números principales: cuánto vale el inventario (a costo y a precio de venta)
//      y cuántas entradas y salidas hubo en los últimos 30 días.
//   2. Dos gráficas:
//        ▮ Ventas por día (barras): cuánto se vendió cada día, en los últimos 7 o 30 días.
//        ◔ Reparto del inventario (círculo): qué parte del valor está en cada categoría.
//   3. La tabla con el valor de cada categoría y los 5 productos más vendidos.
//
// Las ventas de cada día las calcula el servidor (servidor/ventas/ventas.js → ventasPorDia).

import { useEffect, useMemo, useState } from 'react'
import GraficaDeBarras from '../componentes/GraficaDeBarras.jsx'
import GraficaDeCirculo from '../componentes/GraficaDeCirculo.jsx'
import IconoDeArea from '../componentes/IconoDeArea.jsx'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { actividadReciente, resumenDelInventario, resumenPorCategoria } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import { conMayuscula, porcionesDelInventario } from '../utilidades/graficas.js'
import { servidor } from '../utilidades/servidor.js'
import Icono from '../componentes/Icono.jsx'
import Ventana from '../componentes/Ventana.jsx'
import VerInforme from '../ventanas/VerInforme.jsx'

// Botones para elegir cuántos días muestra la gráfica de barras.
const PERIODOS = [
  { dias: 7, texto: '7 días' },
  { dias: 30, texto: '30 días' },
]

export default function Reportes({ productos, movimientos, configuracion, usuario }) {
  const totales = useMemo(() => resumenDelInventario(productos), [productos])
  const categorias = useMemo(() => resumenPorCategoria(productos, configuracion.categorias), [productos, configuracion.categorias])
  const actividad = useMemo(() => actividadReciente(movimientos, 30), [movimientos])
  const porciones = useMemo(() => porcionesDelInventario(categorias), [categorias])
  const categoriasConStock = categorias.filter((categoria) => categoria.valorCosto > 0).length

  // Ventas de cada día (vienen del servidor). "dias" es el período que se está mostrando.
  const [periodo, setPeriodo] = useState(PERIODOS[0].dias)
  const [ventas, setVentas] = useState({ dias: periodo, lista: null, error: '' })
  const [verInforme, setVerInforme] = useState(false) // ventana del informe para imprimir o guardar en PDF

  // Se piden otra vez al cambiar de período o cuando se registra un movimiento nuevo.
  useEffect(() => {
    let vigente = true // si llega una respuesta vieja (de otro período), se ignora
    servidor.ventasPorDia(periodo)
      .then((lista) => vigente && setVentas({ dias: periodo, lista, error: '' }))
      .catch((error) => vigente && setVentas((anterior) => ({ ...anterior, error: error.message })))
    return () => { vigente = false }
  }, [periodo, movimientos])

  const barras = useMemo(() => barrasDeVentas(ventas), [ventas])
  const vendido = ventas.lista ? ventas.lista.reduce((suma, dia) => suma + dia.total, 0) : 0
  const facturas = ventas.lista ? ventas.lista.reduce((suma, dia) => suma + dia.facturas, 0) : 0

  // La categoría de mayor valor ocupa la barra completa; las demás, en proporción.
  const mayorValor = Math.max(...categorias.map((categoria) => categoria.valorCosto), 1)

  return (
    <>
      {/* Informe en PDF: abre la vista previa con las gráficas y las tablas, lista para imprimir */}
      <div className="reportes-barra">
        <p>Resumen de ventas, inventario y alertas. ¿Lo necesitas en papel o en archivo?</p>
        <button className="primary" onClick={() => setVerInforme(true)}><Icono nombre="impresora" tamano={16} className="antes" />Informe PDF / Imprimir</button>
      </div>

      {/* Números principales */}
      <section className="metrics">
        <div className="metric"><p>VALOR A COSTO</p><strong>{formato.dinero(totales.valorCosto)}</strong><small>{totales.activos.length} productos activos</small></div>
        <div className="metric"><p>VALOR A PRECIO DE VENTA</p><strong>{formato.dinero(totales.valorVenta)}</strong><small>Margen estimado +{totales.margen.toFixed(1)}%</small></div>
        <div className="metric"><p>ENTRADAS (30 DÍAS)</p><strong className="green">{actividad.entradas}</strong><small>Movimientos registrados</small></div>
        <div className="metric"><p>SALIDAS (30 DÍAS)</p><strong className="red">{actividad.salidas}</strong><small>Movimientos registrados</small></div>
      </section>

      <div className="grid graficas">
        {/* Gráfica de barras: ventas de cada día */}
        <section className="panel">
          <div className="panelhead">
            <h2>▮ Ventas por día</h2>
            <div className="grafica-periodo" role="group" aria-label="Período de la gráfica">
              {PERIODOS.map(({ dias, texto }) => (
                <button key={dias} type="button" className={periodo === dias ? 'on' : ''} aria-pressed={periodo === dias} onClick={() => setPeriodo(dias)}>
                  {texto}
                </button>
              ))}
            </div>
          </div>

          {ventas.error && <p className="grafica-mensaje">No se pudieron cargar las ventas: {ventas.error}</p>}
          {!ventas.error && !ventas.lista && <p className="grafica-mensaje">Cargando ventas…</p>}
          {ventas.lista && (
            <>
              <div className="grafica-resumen">
                <div><small>Vendido</small><b>{formato.dinero(vendido)}</b></div>
                <div><small>Facturas</small><b>{facturas}</b></div>
                <div><small>Promedio por día</small><b>{formato.dinero(vendido / ventas.dias)}</b></div>
              </div>
              {/* "key" hace que las barras vuelvan a crecer al cambiar de período */}
              <GraficaDeBarras key={ventas.dias} datos={barras} formatoDelValor={formato.dinero} mostrarValores={ventas.dias <= 7} />
            </>
          )}
        </section>

        {/* Gráfica de círculo: en qué categorías está el valor del inventario */}
        <section className="panel">
          <div className="panelhead"><h2>◔ Reparto del inventario</h2></div>
          {porciones.length ? (
            <GraficaDeCirculo datos={porciones} formatoDelValor={formato.dinero}
              textoDelTotal="Valor a costo" detalleDelTotal={categoriasConStock === 1 ? '1 categoría' : `${categoriasConStock} categorías`} />
          ) : (
            <p className="grafica-mensaje">Todavía no hay productos con stock.</p>
          )}
        </section>
      </div>

      <div className="grid">
        {/* Valor de cada categoría, con una barra para comparar */}
        <section className="panel">
          <div className="panelhead"><h2><Icono nombre="reportes" className="antes" />Inventario por Categoría</h2></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Categoría</th><th>Productos</th><th>Unidades</th><th>Valor costo</th><th>Valor venta</th><th></th></tr></thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.nombre} style={{ '--color-area': areaDeLaCategoria(categoria.nombre).color }}>
                    <td><span className="con-area"><IconoDeArea categoria={categoria.nombre} pequeno /> {categoria.nombre}</span></td>
                    <td>{categoria.cantidadDeProductos}</td>
                    <td>{formato.cantidad(categoria.unidades, '')}</td>
                    <td>{formato.dinero(categoria.valorCosto)}</td>
                    <td>{formato.dinero(categoria.valorVenta)}</td>
                    <td className="barcell"><span className="bar" style={{ width: `${(categoria.valorCosto / mayorValor) * 100}%` }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Los 5 productos más vendidos */}
        <section className="panel moves">
          <div className="panelhead"><h2><Icono nombre="tendencia" className="antes" />Más Vendidos (30 días)</h2></div>
          {actividad.masVendidos.map((producto, posicion) => (
            <article key={producto.nombre}>
              <div><b>{posicion + 1}. {producto.nombre}</b></div>
              <div className="minus"><b>{formato.cantidad(producto.cantidad, producto.unidad)}</b></div>
            </article>
          ))}
          {!actividad.masVendidos.length && <p className="muted">Sin ventas registradas en los últimos 30 días.</p>}
        </section>
      </div>

      {verInforme && (
        <Ventana alCerrar={() => setVerInforme(false)} ancha="grande">
          <VerInforme productos={productos} movimientos={movimientos} configuracion={configuracion} usuario={usuario}
            diasIniciales={periodo === 7 ? 7 : 30} alCerrar={() => setVerInforme(false)} />
        </Ventana>
      )}
    </>
  )
}

// Una barra por día. Con 7 días, cada barra dice el día ("lun 21"); con 30 días
// no caben todas, así que solo se escribe el número cada 5 días (y "Hoy").
function barrasDeVentas({ dias, lista }) {
  if (!lista) return []
  return lista.map((dia, posicion) => {
    const esHoy = posicion === lista.length - 1
    const numeroDelDia = Number(dia.fecha.slice(8)) // '2026-09-24' → 24
    let etiqueta = ''
    if (dias <= 7) etiqueta = `${esHoy ? 'Hoy' : formato.diaDeLaSemana(dia.fecha)}\n${numeroDelDia}`
    else if (esHoy) etiqueta = 'Hoy'
    else if ((lista.length - 1 - posicion) % 5 === 0) etiqueta = String(numeroDelDia)

    const cuanto = dia.facturas
      ? `${formato.dinero(dia.total)} en ${dia.facturas} ${dia.facturas === 1 ? 'factura' : 'facturas'}`
      : 'sin ventas'
    return {
      clave: dia.fecha,
      valor: dia.total,
      etiqueta,
      destacada: esHoy,
      detalle: `${conMayuscula(formato.dia(dia.fecha))}${esHoy ? ' (hoy)' : ''}: ${cuanto}`,
    }
  })
}
