// ─────────────────────────────────────────────────────────────
// PANTALLA: PANEL PRINCIPAL
// ─────────────────────────────────────────────────────────────
// El resumen general, en cuatro partes:
//   1. Portada con botones rápidos
//   2. Cuatro tarjetas con números clave (productos, alertas, valor del inventario)
//   3. Productos con poco stock  +  últimos movimientos
//   4. Cuántos productos hay en cada categoría

import { useMemo, useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import IconoDeArea from '../componentes/IconoDeArea.jsx'
import TarjetaMovimiento from '../componentes/TarjetaMovimiento.jsx'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { coincideConBusqueda, resumenDelInventario, resumenPorCategoria } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import Icono from '../componentes/Icono.jsx'

export default function PanelPrincipal({ productos, movimientos, alertas, configuracion, busqueda, irA, abrirMovimiento, verCategoria }) {
  const [verMasMovimientos, setVerMasMovimientos] = useState(false)
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

        {/* 3b. Últimos movimientos (5, o 15 con "Ver más") */}
        <section className="panel moves">
          <div className="panelhead">
            <h2><Icono nombre="movimientos" className="antes" />Últimos Movimientos</h2>
            <button onClick={() => setVerMasMovimientos(!verMasMovimientos)}>{verMasMovimientos ? 'Ver menos' : 'Ver más'}</button>
          </div>
          {movimientos.slice(0, verMasMovimientos ? 15 : 5).map((movimiento) => (
            <TarjetaMovimiento key={movimiento.id} movimiento={movimiento} />
          ))}
          {!movimientos.length && <p className="muted">Aún no hay movimientos registrados.</p>}
        </section>
      </div>

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
