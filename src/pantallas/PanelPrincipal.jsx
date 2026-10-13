// ─────────────────────────────────────────────────────────────
// PANTALLA: PANEL PRINCIPAL
// ─────────────────────────────────────────────────────────────
// El resumen general, en cuatro partes:
//   1. Portada con botones rápidos
//   2. Cuatro tarjetas con números clave (productos, alertas, valor del inventario)
//   3. Productos con poco stock  +  últimos movimientos
//   4. Cuántos productos hay en cada categoría

import { useEffect, useMemo, useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import IconoDeArea from '../componentes/IconoDeArea.jsx'
import TarjetaMovimiento from '../componentes/TarjetaMovimiento.jsx'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { coincideConBusqueda, resumenDelInventario, resumenPorCategoria } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import Ventana from '../componentes/Ventana.jsx'
import VerFactura from '../ventanas/VerFactura.jsx'
import Icono from '../componentes/Icono.jsx'

// Hoy como 'AAAA-MM-DD' (según la hora de la computadora), moviéndolo unos días (-1 = ayer).
const diaDeHoy = (desplazamiento = 0) => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + desplazamiento)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export default function PanelPrincipal({ productos, movimientos, alertas, configuracion, busqueda, irA, abrirMovimiento, verCategoria }) {
  const [verMasMovimientos, setVerMasMovimientos] = useState(false)
  const [lista, setLista] = useState('movimientos') //   qué se ve en el recuadro de la derecha: 'movimientos' o 'facturas'
  const [facturas, setFacturas] = useState([]) //        facturas que se muestran (se piden al servidor)
  const [movimientosDelDia, setMovimientosDelDia] = useState([]) // movimientos del día elegido
  const [dia, setDia] = useState('') //                  día elegido ('AAAA-MM-DD'); vacío = los más recientes de todos los días
  const [factura, setFactura] = useState(null) //        factura abierta en la ventana (null = ninguna)
  // Al elegir un día, se piden al servidor las facturas y los movimientos de ese día.
  useEffect(() => {
    let vigente = true
    servidor.listaDeVentas(dia ? { desde: dia, hasta: dia, limite: 100 } : { limite: 15 })
      .then((respuesta) => vigente && setFacturas(respuesta.ventas)).catch(() => {}) // si falla, simplemente no se muestran
    if (dia) servidor.movimientosDelDia(dia).then((filas) => vigente && setMovimientosDelDia(filas)).catch(() => {})
    return () => { vigente = false }
  }, [dia])
  const hoy = diaDeHoy()
  const movimientosAMostrar = dia ? movimientosDelDia : movimientos
  const cuantos = dia ? (verMasMovimientos ? 200 : 15) : (verMasMovimientos ? 15 : 5) // cuántas tarjetas se muestran
  const abrirFactura = async (ventaId) => {
    try {
      setFactura(await servidor.verFactura(ventaId))
    } catch { /* si falla, no se abre */ }
  }
  const totales = useMemo(() => resumenDelInventario(productos), [productos])
  const categorias = useMemo(() => resumenPorCategoria(productos, configuracion.categorias), [productos, configuracion.categorias])
  const alertasVisibles = alertas.filter((producto) => coincideConBusqueda(busqueda, producto.codigo, producto.nombre, producto.categoria))

  // Las 4 tarjetas de arriba. Al hacer clic en una, se abre la pantalla indicada en "abre".
  const tarjetas = [
    { titulo: 'CATÁLOGO DE PRODUCTOS', valor: totales.activos.length, detalle: 'Artículos activos en sistema', icono: 'caja', abre: 'catalogo' },
    { titulo: 'ALERTAS DE STOCK MÍNIMO', valor: alertas.length, detalle: 'Requieren reabastecimiento', icono: 'alerta', abre: 'alertas' },
    { titulo: 'VALOR INVENTARIO (COSTO)', valor: formato.dinero(totales.valorCosto), detalle: 'Costo total acumulado en bodega', icono: 'dinero', abre: 'reportes' },
    { titulo: 'PROYECCIÓN VENTA TOTAL', valor: formato.dinero(totales.valorVenta), detalle: `Margen estimado: +${totales.margen.toFixed(1)}%`, icono: 'tendencia', abre: 'reportes' },
  ]

  return (
    <>
      {/* 1. Portada */}
      <section className="hero">
        <div>
          <span>Ferretería Medrano</span><small>Sistema FerreStock</small>
          <h1>Control e Inventario Centralizado</h1>
          <p>Supervisión en tiempo real de las existencias, alertas automáticas de reabastecimiento e historial completo de entradas y salidas.</p>
        </div>
        <div>
          <button onClick={() => abrirMovimiento()}><Icono nombre="mas" tamano={16} className="antes" />Nuevo Movimiento</button>
          <button className="dark" onClick={() => irA('consulta')}><Icono nombre="buscar" tamano={16} className="antes" />Consulta Mostrador</button>
        </div>
      </section>

      {/* 2. Tarjetas con números clave */}
      <section className="metrics">
        {tarjetas.map((tarjeta) => (
          <button key={tarjeta.titulo} className={tarjeta.abre === 'alertas' && alertas.length ? 'warn' : ''} onClick={() => irA(tarjeta.abre)}>
            <div><p>{tarjeta.titulo}</p><strong>{tarjeta.valor}</strong><small>{tarjeta.detalle}</small></div>
            <span><Icono nombre={tarjeta.icono} tamano={26} /></span>
          </button>
        ))}
      </section>

      <div className="grid">
        {/* 3a. Productos con poco stock (máximo 6). Al hacer clic se abre el reabastecimiento. */}
        <section className="panel">
          <div className="panelhead">
            <h2><Icono nombre="alerta" className="antes" />Productos en Nivel Crítico o Bajo Stock</h2>
            <button onClick={() => irA('alertas')}>Ver Módulo Alertas<Icono nombre="flechaDiagonal" tamano={14} className="despues" /></button>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Código</th><th>Producto</th><th>Disponible</th><th>Mínimo</th><th>Déficit</th><th>Estado</th></tr></thead>
              <tbody>
                {alertasVisibles.slice(0, 6).map((producto) => {
                  const faltan = producto.minimo - producto.stock
                  return (
                    <tr key={producto.id} onClick={() => abrirMovimiento({ productoId: producto.id, tipo: 'entrada', cantidad: faltan })}>
                      <td className="yellow">{producto.codigo}</td>
                      <td>{producto.nombre}</td>
                      <td className="yellow">{formato.cantidad(producto.stock, producto.unidad)}</td>
                      <td>{formato.cantidad(producto.minimo, producto.unidad)}</td>
                      <td className="red">−{formato.cantidad(faltan, producto.unidad)}</td>
                      <td><EtiquetaEstado producto={producto} /></td>
                    </tr>
                  )
                })}
                {!alertasVisibles.length && (
                  <FilaVacia columnas="6">
                    {busqueda ? `No hay alertas que coincidan con “${busqueda}”.` : 'Todo el inventario está sobre el mínimo. 🎉'}
                  </FilaVacia>
                )}
              </tbody>
            </table>
          </div>
          <footer>
            Haz clic en un producto para registrar su reabastecimiento
            <button onClick={() => irA('alertas')}>Gestionar reabastecimiento →</button>
          </footer>
        </section>

        {/* 3b. Últimos movimientos o últimas facturas (5, o 15 con "Ver más") */}
        <section className="panel moves">
          <div className="panelhead">
            <h2><Icono nombre={lista === 'facturas' ? 'factura' : 'movimientos'} className="antes" />{lista === 'facturas' ? 'Últimas Facturas' : 'Últimos Movimientos'}</h2>
            <button onClick={() => setVerMasMovimientos(!verMasMovimientos)}>{verMasMovimientos ? 'Ver menos' : 'Ver más'}</button>
          </div>
          <div className="pestanas" role="group" aria-label="Qué mostrar">
            <button className={lista === 'movimientos' ? 'on' : ''} aria-pressed={lista === 'movimientos'} onClick={() => setLista('movimientos')}>Movimientos</button>
            <button className={lista === 'facturas' ? 'on' : ''} aria-pressed={lista === 'facturas'} onClick={() => setLista('facturas')}>Facturas</button>
          </div>
          {/* Filtro por día: "Todos" muestra lo más reciente; "Hoy" y "Ayer" son atajos; la fecha permite elegir cualquier día. */}
          <div className="filtro-dia" role="group" aria-label="Ver por fecha">
            <button className={!dia ? 'on' : ''} aria-pressed={!dia} onClick={() => setDia('')}>Todos</button>
            <button className={dia === hoy ? 'on' : ''} aria-pressed={dia === hoy} onClick={() => setDia(hoy)}>Hoy</button>
            <button className={dia === diaDeHoy(-1) ? 'on' : ''} aria-pressed={dia === diaDeHoy(-1)} onClick={() => setDia(diaDeHoy(-1))}>Ayer</button>
            <input type="date" value={dia} max={hoy} onChange={(evento) => setDia(evento.target.value)} aria-label="Elegir un día" />
          </div>
          {lista === 'movimientos' ? (
            <>
              {movimientosAMostrar.slice(0, cuantos).map((movimiento) => (
                <TarjetaMovimiento key={movimiento.id} movimiento={movimiento} />
              ))}
              {!movimientosAMostrar.length && <p className="muted">{dia ? 'No hay movimientos ese día.' : 'Aún no hay movimientos registrados.'}</p>}
            </>
          ) : (
            <>
              {/* Cada factura es un botón: al tocarla se abre para verla o reimprimirla. */}
              {facturas.slice(0, cuantos).map((venta) => (
                <button className="venta-hoy" key={venta.id} onClick={() => abrirFactura(venta.id)} title="Ver o reimprimir la factura">
                  <div>
                    <b><Icono nombre="factura" tamano={15} className="antes" />Factura {formato.factura(venta.id)}</b>
                    <span>{venta.cliente} · {Number(venta.productos)} producto{Number(venta.productos) === 1 ? '' : 's'} · {venta.vendedor}</span>
                  </div>
                  <div className="plus"><b>{formato.dinero(venta.total)}</b><span>{formato.fecha(venta.fecha)}</span></div>
                </button>
              ))}
              {!facturas.length && <p className="muted">{dia ? 'No hay facturas ese día.' : 'Aún no hay facturas.'}</p>}
              <button className="ver-todas-facturas" onClick={() => irA('facturas')}>Ver todas las facturas<Icono nombre="flechaDiagonal" tamano={14} className="despues" /></button>
            </>
          )}
        </section>
      </div>

      {factura && (
        <Ventana alCerrar={() => setFactura(null)}>
          <VerFactura venta={factura} alCerrar={() => setFactura(null)} />
        </Ventana>
      )}

      {/* 4. Resumen por categoría. Al hacer clic se abre el Catálogo filtrado. */}
      <section className="cats">
        <h3><Icono nombre="agrupar" tamano={16} className="antes" />RESUMEN DE PRODUCTOS POR CATEGORÍA</h3>
        <div>
          {categorias.map((categoria) => (
            <button key={categoria.nombre} onClick={() => verCategoria(categoria.nombre)} style={{ '--color-area': areaDeLaCategoria(categoria.nombre).color }}>
              <IconoDeArea categoria={categoria.nombre} pequeno />
              <b>{categoria.nombre}</b>
              <strong>{categoria.cantidadDeProductos}</strong>
              <small>{formato.cantidad(categoria.unidades, 'unid.')}</small>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
