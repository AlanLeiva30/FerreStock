// ─────────────────────────────────────────────────────────────
// PANTALLA: VENDER (caja)
// ─────────────────────────────────────────────────────────────
// Es la pantalla del vendedor (el administrador también la puede usar).
//
//   ┌─────────────────────────────┬──────────────────────┐
//   │ PRODUCTOS DISPONIBLES       │ VENTA ACTUAL         │
//   │ [buscar…]                   │ 🔨 Martillo 2 × $9.75 │
//   │ [Todas] [🔨 Herramientas] … │ 🔩 Tornillos 1 × $5.50│
//   │ 🔨 Herramientas             │ TOTAL        $25.00  │
//   │  FER-1001 Martillo  [＋]    │                      │
//   │  …                          │ Cliente / DUI-NIT    │
//   │                             │ Efectivo: [ 30 ]     │
//   │                             │ Cambio:      $5.00   │
//   │                             │ [COBRAR Y FACTURAR]  │
//   │                             ├──────────────────────┤
//   │                             │ MIS VENTAS DE HOY    │
//   └─────────────────────────────┴──────────────────────┘
//
// Al cobrar se abre la FACTURA para imprimirla. Las facturas del día se pueden
// volver a abrir tocándolas en "Mis ventas de hoy".
//
// Cada área (categoría) tiene su ícono y su color (src/utilidades/areas.js). Los
// botones de áreas, arriba de la lista, muestran solo los productos de un área.
//
// Truco rápido: escribe el código en el buscador y pulsa Enter para agregarlo.
// El precio y el stock se vuelven a revisar en el servidor al cobrar.

import { useCallback, useEffect, useRef, useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import IconoDeArea from '../componentes/IconoDeArea.jsx'
import Ventana from '../componentes/Ventana.jsx'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { agruparPorCategoria, coincideConBusqueda, estadoDelProducto } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import { leerVentaPendiente, limpiarVentaPendiente } from '../utilidades/ventaDesdeCotizacion.js'
import FormularioNegocio from '../ventanas/FormularioNegocio.jsx'
import VerFactura from '../ventanas/VerFactura.jsx'
import Icono from '../componentes/Icono.jsx'

export default function Vender({ productos, esAdmin, recargar, avisar, irA }) {
  const [buscado, setBuscado] = useState('')
  const [area, setArea] = useState('') //         categoría elegida en los botones de áreas ('' = todas)
  // Si se llegó desde «Pasar a venta» (en una cotización guardada), la venta empieza con sus productos, cliente y descuento.
  const [desdeCotizacion] = useState(leerVentaPendiente)
  const [cotizacionOrigen, setCotizacionOrigen] = useState(desdeCotizacion && { id: desdeCotizacion.cotizacionId, numero: desdeCotizacion.numero })
  const [carrito, setCarrito] = useState(desdeCotizacion?.lineas ?? []) //   [{ productoId, cantidad }]  (cantidad como texto, como se escribe)
  const [cliente, setCliente] = useState(desdeCotizacion?.cliente ?? '') //   nombre del cliente para la factura (vacío = Consumidor Final)
  const [clienteDocumento, setClienteDocumento] = useState(desdeCotizacion?.documento ?? '') // DUI o NIT del cliente
  const [descuento, setDescuento] = useState(desdeCotizacion?.descuento ?? '') // porcentaje de descuento sobre el total (vacío = sin descuento)
  const [recibido, setRecibido] = useState('') // efectivo que entrega el cliente
  const [cobrando, setCobrando] = useState(false)
  const [error, setError] = useState('')
  const [ventasDeHoy, setVentasDeHoy] = useState({ ventas: [], cantidad: 0, total: 0 })
  const [factura, setFactura] = useState(null) //  factura abierta en la ventana (null = ninguna)
  const [editandoNegocio, setEditandoNegocio] = useState(false)
  const buscador = useRef(null)

  const cargarVentasDeHoy = useCallback(async () => {
    try {
      setVentasDeHoy(await servidor.ventasDeHoy())
    } catch {
      // Si falla, simplemente no se muestra el resumen del día.
    }
  }, [])

  useEffect(() => { cargarVentasDeHoy() }, [cargarVentasDeHoy])

  // Una sola vez al abrir la pantalla: se avisa de lo que pasó con la cotización y se borra lo que quedó guardado.
  useEffect(() => {
    if (!desdeCotizacion) return
    limpiarVentaPendiente()
    const notas = []
    if (desdeCotizacion.omitidos) notas.push(`${desdeCotizacion.omitidos} producto${desdeCotizacion.omitidos === 1 ? '' : 's'} ya no está${desdeCotizacion.omitidos === 1 ? '' : 'n'} en el catálogo y se omitió`)
    if (desdeCotizacion.preciosCambiaron) notas.push('se usan los precios de hoy')
    avisar(`Cotización ${desdeCotizacion.numero} cargada en la venta${notas.length ? ': ' + notas.join(' · ') : ''}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Productos que se pueden vender ──
  const activos = productos.filter((producto) => producto.activo)
  const areas = agruparPorCategoria(activos) // [{ categoria, productos }] en el orden de las categorías
  const visibles = activos.filter((producto) => (!area || producto.categoria === area) &&
    coincideConBusqueda(buscado, producto.codigo, producto.nombre, producto.categoria))
  const cantidadEnCarrito = (productoId) => Number(carrito.find((item) => item.productoId === productoId)?.cantidad) || 0
  const disponible = (producto) => producto.stock - cantidadEnCarrito(producto.id)

  // ── La venta actual ──
  const lineas = carrito
    .map((item) => {
      const producto = productos.find((opcion) => opcion.id === item.productoId)
      const cantidad = Number(item.cantidad)
      return producto && { ...item, producto, cantidadValida: cantidad > 0 && cantidad <= producto.stock, subtotal: redondear((cantidad || 0) * producto.precio) }
    })
    .filter(Boolean)
  const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0))
  const porcentaje = Math.min(Math.max(Number(descuento) || 0, 0), 100)
  const montoDescuento = redondear(subtotal * porcentaje / 100)
  const total = redondear(subtotal - montoDescuento) // lo que paga el cliente (el servidor lo vuelve a calcular)
  const efectivo = recibido === '' ? null : Number(recibido)
  const cambio = efectivo === null ? null : redondear(efectivo - total)
  const puedeCobrar = lineas.length > 0 && lineas.every((linea) => linea.cantidadValida) && (cambio === null || cambio >= 0) && !cobrando

  // ── Acciones ──
  const agregar = (producto) => {
    if (disponible(producto) < 1) return
    setError('')
    setCarrito((actual) => actual.some((item) => item.productoId === producto.id)
      ? actual.map((item) => item.productoId === producto.id ? { ...item, cantidad: String((Number(item.cantidad) || 0) + 1) } : item)
      : [...actual, { productoId: producto.id, cantidad: '1' }])
  }

  const cambiarCantidad = (productoId, cantidad) =>
    setCarrito((actual) => actual.map((item) => item.productoId === productoId ? { ...item, cantidad } : item))

  const sumar = (linea, paso) => {
    const nueva = Math.min(Math.max((Number(linea.cantidad) || 0) + paso, 1), linea.producto.stock)
    cambiarCantidad(linea.productoId, String(nueva))
  }

  const quitar = (productoId) => setCarrito((actual) => actual.filter((item) => item.productoId !== productoId))

  const vaciar = () => {
    setCarrito([])
    setCliente('')
    setClienteDocumento('')
    setCotizacionOrigen(null)
    setDescuento('')
    setRecibido('')
    setError('')
  }

  // Enter en el buscador: si hay un solo producto (o uno con ese código exacto), se agrega.
  const alPresionarEnter = (evento) => {
    if (evento.key !== 'Enter') return
    const exacto = activos.find((producto) => producto.codigo.toLowerCase() === buscado.trim().toLowerCase())
    const elegido = exacto ?? (visibles.length === 1 ? visibles[0] : null)
    if (elegido) {
      agregar(elegido)
      setBuscado('')
    }
  }

  const cobrar = async () => {
    setCobrando(true)
    setError('')
    try {
      const venta = await servidor.cobrarVenta({
        productos: lineas.map((linea) => ({ productoId: linea.productoId, cantidad: Number(linea.cantidad) })),
        descuento: porcentaje,
        cotizacionId: cotizacionOrigen?.id,
        recibido: efectivo,
        cliente,
        clienteDocumento,
      })
      vaciar()
      setFactura(venta) // abrir la factura para imprimirla
      avisar(`Venta #${venta.id} cobrada: ${formato.dinero(venta.total)}${venta.cambio != null ? ` · Cambio: ${formato.dinero(venta.cambio)}` : ''}`)
      await Promise.all([recargar(), cargarVentasDeHoy()])
    } catch (problema) {
      setError(problema.message) // por ejemplo, si otro vendedor se llevó el último producto
      await recargar()
    } finally {
      setCobrando(false)
    }
  }

  // Volver a abrir la factura de una venta de hoy (para reimprimirla).
  const abrirFactura = async (ventaId) => {
    try {
      setFactura(await servidor.verFactura(ventaId))
    } catch (problema) {
      avisar(`Error: ${problema.message}`)
    }
  }

  // Al cerrar la factura, el cursor vuelve al buscador para la siguiente venta.
  const cerrarFactura = () => {
    setFactura(null)
    buscador.current?.focus()
  }

  const guardarNegocio = async (datos) => {
    await servidor.guardarDatosDelNegocio(datos)
    setEditandoNegocio(false)
    avisar('Datos de la factura guardados')
  }

  return (
    <div className="pos">
      {/* ── Izquierda: productos disponibles ── */}
      <section className="panel view">
        <div className="panelhead">
          <h2>$ Productos disponibles</h2>
          <input ref={buscador} className="pos-buscar" value={buscado} onChange={(evento) => setBuscado(evento.target.value)} onKeyDown={alPresionarEnter}
            placeholder="Buscar por nombre o código… (Enter agrega)" aria-label="Buscar producto para vender" autoFocus />
        </div>

        {/* Botones de áreas: cada uno con su ícono y su color. Tocar el elegido otra vez vuelve a "Todas". */}
        <div className="areas" role="group" aria-label="Ver productos de un área">
          <button type="button" className={!area ? 'on' : ''} aria-pressed={!area} onClick={() => setArea('')}>
            Todas <small>{activos.length}</small>
          </button>
          {areas.map((grupo) => (
            <button key={grupo.categoria} type="button" className={area === grupo.categoria ? 'on' : ''} aria-pressed={area === grupo.categoria}
              style={{ '--color-area': areaDeLaCategoria(grupo.categoria).color }} onClick={() => setArea(area === grupo.categoria ? '' : grupo.categoria)}>
              <IconoDeArea categoria={grupo.categoria} pequeno /> {grupo.categoria} <small>{grupo.productos.length}</small>
            </button>
          ))}
        </div>

        <div className="tablewrap">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Disponible</th><th>Precio</th><th></th></tr></thead>
            <tbody>
              {/* Cada fila lleva una rayita a la izquierda con el color de su área ("fila-area") */}
              <FilasPorCategoria productos={visibles} columnas="5" dibujarFila={(producto, areaDelProducto) => {
                const quedan = disponible(producto)
                return (
                  <tr key={producto.id} className={quedan < 1 ? 'fila-area inactive' : 'fila-area'} style={{ '--color-area': areaDelProducto.color }}
                    onClick={() => agregar(producto)}>
                    <td className="yellow">{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td className="big">{formato.cantidad(quedan, producto.unidad)}{estadoDelProducto(producto).texto !== 'OK' && <> <EtiquetaEstado producto={producto} /></>}</td>
                    <td>{formato.dinero(producto.precio)}</td>
                    <td className="row-actions">
                      <button disabled={quedan < 1} onClick={(evento) => { evento.stopPropagation(); agregar(producto) }}>
                        {producto.stock <= 0 ? 'Agotado' : quedan < 1 ? 'Sin más' : '＋ Agregar'}
                      </button>
                    </td>
                  </tr>
                )
              }} />
              {!visibles.length && (
                <FilaVacia columnas="5">
                  {buscado ? `No hay productos con “${buscado}”${area ? ` en ${area}` : ''}.` : 'No hay productos activos para vender.'}
                </FilaVacia>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Derecha: venta actual y ventas del día ── */}
      <aside className="pos-lado">
        <section className="panel">
          <div className="panelhead">
            <h2>🛒 Venta actual</h2>
            {lineas.length > 0 && <button onClick={vaciar}>Vaciar</button>}
          </div>

          {cotizacionOrigen && (
            <p className="venta-origen">
              <span>Venta desde la cotización <b>{cotizacionOrigen.numero}</b>. Al cobrar, quedará marcada como vendida.</span>
              <button onClick={() => setCotizacionOrigen(null)}>Quitar vínculo</button>
            </p>
          )}

          {!lineas.length && <p className="carrito-vacio">Haz clic en un producto para agregarlo a la venta.</p>}

          {/* La lista de productos tiene su propio desplazamiento: así el total y el botón de cobrar siempre quedan a la vista. */}
          <div className="carrito-lista">
          {lineas.map((linea) => (
            <div className="carrito-item" key={linea.productoId}>
              <div>
                <b className="con-area"><IconoDeArea categoria={linea.producto.categoria} pequeno /> {linea.producto.nombre}</b>
                <small>{formato.dinero(linea.producto.precio)} c/u · hay {formato.cantidad(linea.producto.stock, linea.producto.unidad)}</small>
              </div>
              <button className="carrito-quitar" onClick={() => quitar(linea.productoId)} aria-label={`Quitar ${linea.producto.nombre}`}>✕</button>
              <div className="carrito-cantidad">
                <button onClick={() => sumar(linea, -1)} aria-label="Uno menos">−</button>
                <input type="number" min="0.01" step="any" value={linea.cantidad} aria-label={`Cantidad de ${linea.producto.nombre}`}
                  className={linea.cantidadValida ? '' : 'invalida'} onChange={(evento) => cambiarCantidad(linea.productoId, evento.target.value)} />
                <button onClick={() => sumar(linea, 1)} aria-label="Uno más">+</button>
              </div>
              <span className="carrito-subtotal">{formato.dinero(linea.subtotal)}</span>
              {!linea.cantidadValida && <small className="form-error carrito-aviso">Cantidad no válida: hay {formato.cantidad(linea.producto.stock, linea.producto.unidad)}</small>}
            </div>
          ))}
          </div>

          <div className="carrito-total"><span>TOTAL</span><strong>{formato.dinero(total)}</strong></div>
          {montoDescuento > 0 && <p className="detalle-descuento">Subtotal {formato.dinero(subtotal)} · descuento {porcentaje}% (−{formato.dinero(montoDescuento)})</p>}

          <div className="carrito-pago">
            <div className="form-row">
              <label>Cliente (opcional)
                <input value={cliente} onChange={(evento) => setCliente(evento.target.value)} placeholder="Consumidor Final" maxLength="80" />
              </label>
              <label>DUI / NIT
                <input value={clienteDocumento} onChange={(evento) => setClienteDocumento(evento.target.value)} placeholder="Ej. 01234567-8" maxLength="30" />
              </label>
            </div>
            <label>Descuento (%) (opcional)
              <input type="number" min="0" max="100" step="any" value={descuento} onChange={(evento) => setDescuento(evento.target.value)} placeholder="0" disabled={!lineas.length} />
            </label>
            <label>Efectivo recibido (opcional)
              <input type="number" min="0" step="0.01" value={recibido} onChange={(evento) => setRecibido(evento.target.value)} placeholder="$0.00" disabled={!lineas.length} />
            </label>
            {cambio !== null && lineas.length > 0 && (
              <p className={cambio >= 0 ? 'carrito-cambio green' : 'carrito-cambio red'}>
                {cambio >= 0 ? `Cambio: ${formato.dinero(cambio)}` : `Faltan: ${formato.dinero(-cambio)}`}
              </p>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="boton-cobrar" onClick={cobrar} disabled={!puedeCobrar}>
              {cobrando ? 'Cobrando…' : `Cobrar y facturar ${formato.dinero(total)}`}
            </button>
          </div>
        </section>

        <section className="panel moves">
          <div className="panelhead">
            <h2><Icono nombre="tendencia" className="antes" />{esAdmin ? 'Ventas de hoy' : 'Mis ventas de hoy'}</h2>
            {esAdmin && <button onClick={() => setEditandoNegocio(true)}><Icono nombre="lapiz" tamano={15} className="antes" />Datos de la factura</button>}
          </div>
          <div className="ventas-hoy-resumen">
            <span>{ventasDeHoy.cantidad} venta{ventasDeHoy.cantidad === 1 ? '' : 's'}</span>
            <strong>{formato.dinero(ventasDeHoy.total)}</strong>
          </div>
          {/* Cada venta es un botón: al tocarla se abre su factura. */}
          {ventasDeHoy.ventas.slice(0, 8).map((venta) => (
            <button className="venta-hoy" key={venta.id} onClick={() => abrirFactura(venta.id)} title="Ver o reimprimir la factura">
              <div>
                <b><Icono nombre="factura" tamano={15} className="antes" />Factura {formato.factura(venta.id)}</b>
                <span>{venta.cliente} · {venta.productos} producto{venta.productos === 1 ? '' : 's'}{esAdmin ? ` · ${venta.vendedor}` : ''}</span>
              </div>
              <div className="plus"><b>{formato.dinero(venta.total)}</b><span>{formato.hora(venta.fecha)}</span></div>
            </button>
          ))}
          {!ventasDeHoy.ventas.length && <p className="muted">Todavía no hay ventas hoy.</p>}
          <button className="ver-todas-facturas" onClick={() => irA('facturas')}>Ver todas las facturas<Icono nombre="flechaDiagonal" tamano={14} className="despues" /></button>
        </section>
      </aside>

      {/* Ventanas: la factura y los datos de la factura */}
      {factura && (
        <Ventana alCerrar={cerrarFactura}>
          <VerFactura venta={factura} alCerrar={cerrarFactura} />
        </Ventana>
      )}
      {editandoNegocio && (
        <Ventana alCerrar={() => setEditandoNegocio(false)}>
          <FormularioNegocio alGuardar={guardarNegocio} />
        </Ventana>
      )}
    </div>
  )
}

// Redondear a centavos (evita resultados como 10.000000001).
const redondear = (numero) => Math.round(numero * 100) / 100
