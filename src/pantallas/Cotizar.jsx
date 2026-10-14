// ─────────────────────────────────────────────────────────────
// PANTALLA: COTIZAR
// ─────────────────────────────────────────────────────────────
// Sirve para armar una cotización (presupuesto) para un cliente y sacarla en PDF o en papel.
// NO afecta el inventario, NO crea ventas y NO se guarda en la base de datos: es solo un documento.
//
//   ┌─────────────────────────────┬──────────────────────┐
//   │ PRODUCTOS                   │ COTIZACIÓN ACTUAL    │
//   │ [buscar…]                   │ Cliente, contacto    │
//   │ [Todas] [🔨 Herramientas] … │ 🔨 Martillo 2 × 9.75 │
//   │  FER-1001 Martillo  [＋]    │ Descuento, validez   │
//   │  …                          │ [VISTA PREVIA]       │
//   └─────────────────────────────┴──────────────────────┘
//
// "Vista previa" abre la cotización tal como saldrá; desde ahí se imprime o se guarda como PDF.
// Lo que se va escribiendo se recuerda mientras la pestaña siga abierta (así no se pierde al cambiar de pantalla).

import { useEffect, useState } from 'react'
import EtiquetaEstado from '../componentes/EtiquetaEstado.jsx'
import FilaVacia from '../componentes/FilaVacia.jsx'
import FilasPorCategoria from '../componentes/FilasPorCategoria.jsx'
import Icono from '../componentes/Icono.jsx'
import IconoDeArea from '../componentes/IconoDeArea.jsx'
import Ventana from '../componentes/Ventana.jsx'
import { areaDeLaCategoria } from '../utilidades/areas.js'
import { agruparPorCategoria, coincideConBusqueda, estadoDelProducto } from '../utilidades/calculos.js'
import { formato } from '../utilidades/formato.js'
import VerCotizacion from '../ventanas/VerCotizacion.jsx'

const GUARDADO = 'ferrestock-cotizacion'
const VACIA = { lineas: [], cliente: '', documento: '', contacto: '', descuento: '', validez: '15', notas: '' }

// Lo escrito antes en esta pestaña (si el navegador no deja leerlo, se empieza en blanco).
function leerBorrador() {
  try {
    const guardado = { ...VACIA, ...JSON.parse(sessionStorage.getItem(GUARDADO) ?? '{}') }
    return { ...guardado, lineas: guardado.lineas.filter((linea) => linea.productoId) } // (una versión anterior permitía conceptos libres)
  } catch { return VACIA }
}

export default function Cotizar({ productos, usuario, avisar }) {
  const [buscado, setBuscado] = useState('')
  const [area, setArea] = useState('')
  const [borrador, setBorrador] = useState(leerBorrador) // lo que lleva la cotización
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const { lineas, cliente, documento, contacto, descuento, validez, notas } = borrador
  const poner = (campo, valor) => setBorrador((actual) => ({ ...actual, [campo]: valor }))

  useEffect(() => {
    try { sessionStorage.setItem(GUARDADO, JSON.stringify(borrador)) } catch { /* sin guardado, sigue funcionando */ }
  }, [borrador])

  // ── Productos para elegir ──
  const activos = productos.filter((producto) => producto.activo)
  const areas = agruparPorCategoria(activos)
  const visibles = activos.filter((producto) => (!area || producto.categoria === area) &&
    coincideConBusqueda(buscado, producto.codigo, producto.nombre, producto.categoria))

  // ── La cotización ──
  // Cada línea: { clave, productoId, cantidad (texto) }. El precio se lee siempre del catálogo, para que no quede desactualizado.
  const detalle = lineas.map((linea) => {
    const producto = productos.find((opcion) => opcion.id === linea.productoId)
    const cantidad = Number(linea.cantidad) || 0
    const precio = producto?.precio ?? 0
    return {
      ...linea, cantidad, precio,
      codigo: producto?.codigo ?? '',
      descripcion: producto?.nombre ?? 'Producto no disponible',
      unidad: producto?.unidad ?? '',
      stock: producto?.stock,
      subtotal: redondear(cantidad * precio),
    }
  })
  const subtotal = redondear(detalle.reduce((suma, linea) => suma + linea.subtotal, 0))
  const porcentaje = Math.min(Math.max(Number(descuento) || 0, 0), 100)
  const montoDescuento = redondear(subtotal * porcentaje / 100)
  const total = redondear(subtotal - montoDescuento)
  const lista = detalle.length > 0 && detalle.every((linea) => linea.cantidad > 0)

  // ── Acciones ──
  const agregar = (producto) => setBorrador((actual) => ({
    ...actual,
    lineas: actual.lineas.some((linea) => linea.productoId === producto.id)
      ? actual.lineas.map((linea) => linea.productoId === producto.id ? { ...linea, cantidad: String((Number(linea.cantidad) || 0) + 1) } : linea)
      : [...actual.lineas, { clave: `p${producto.id}`, productoId: producto.id, cantidad: '1' }],
  }))

  const cambiarCantidad = (clave, cantidad) => setBorrador((actual) => ({ ...actual, lineas: actual.lineas.map((linea) => linea.clave === clave ? { ...linea, cantidad } : linea) }))
  const sumar = (linea, paso) => cambiarCantidad(linea.clave, String(Math.max((linea.cantidad || 0) + paso, 1)))
  const quitar = (clave) => setBorrador((actual) => ({ ...actual, lineas: actual.lineas.filter((linea) => linea.clave !== clave) }))
  const vaciar = () => {
    if (lineas.length && !window.confirm('¿Vaciar la cotización y empezar otra?')) return
    setBorrador(VACIA)
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

  const cotizacion = { cliente: cliente.trim(), documento: documento.trim(), contacto: contacto.trim(), validez: Math.max(Math.trunc(Number(validez)) || 15, 1), notas: notas.trim(), detalle, subtotal, porcentaje, montoDescuento, total, atendio: usuario.nombre }

  return (
    <div className="pos">
      {/* ── Izquierda: productos para agregar ── */}
      <section className="panel view">
        <div className="panelhead">
          <h2><Icono nombre="cotizar" className="antes" />Productos para cotizar</h2>
          <input className="pos-buscar" value={buscado} onChange={(evento) => setBuscado(evento.target.value)} onKeyDown={alPresionarEnter}
            placeholder="Buscar por nombre o código… (Enter agrega)" aria-label="Buscar producto para cotizar" autoFocus />
        </div>

        <div className="areas" role="group" aria-label="Ver productos de un área">
          <button type="button" className={!area ? 'on' : ''} aria-pressed={!area} onClick={() => setArea('')}>Todas <small>{activos.length}</small></button>
          {areas.map((grupo) => (
            <button key={grupo.categoria} type="button" className={area === grupo.categoria ? 'on' : ''} aria-pressed={area === grupo.categoria}
              style={{ '--color-area': areaDeLaCategoria(grupo.categoria).color }} onClick={() => setArea(area === grupo.categoria ? '' : grupo.categoria)}>
              <IconoDeArea categoria={grupo.categoria} pequeno /> {grupo.categoria} <small>{grupo.productos.length}</small>
            </button>
          ))}
        </div>

        <div className="tablewrap">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Precio</th><th></th></tr></thead>
            <tbody>
              <FilasPorCategoria productos={visibles} columnas="4" dibujarFila={(producto, areaDelProducto) => (
                <tr key={producto.id} className="fila-area" style={{ '--color-area': areaDelProducto.color }} onClick={() => agregar(producto)}>
                  <td className="yellow">{producto.codigo}</td>
                  <td>{producto.nombre}{estadoDelProducto(producto).texto !== 'OK' && <> <EtiquetaEstado producto={producto} /></>}</td>
                  <td>{formato.dinero(producto.precio)}</td>
                  <td className="row-actions"><button onClick={(evento) => { evento.stopPropagation(); agregar(producto) }}>＋ Agregar</button></td>
                </tr>
              )} />
              {!visibles.length && (
                <FilaVacia columnas="4">{buscado ? `No hay productos con “${buscado}”${area ? ` en ${area}` : ''}.` : 'No hay productos activos.'}</FilaVacia>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Derecha: la cotización ── */}
      <aside className="pos-lado">
        <section className="panel">
          <div className="panelhead">
            <h2><Icono nombre="cotizar" className="antes" />Cotización actual</h2>
            <div className="toolbar">
              {(lineas.length > 0 || cliente) && <button onClick={vaciar}>Vaciar</button>}
              <button className="primary" onClick={() => setVistaPrevia(true)} disabled={!lista}>Vista previa</button>
            </div>
          </div>
          <p className="cotizar-aviso">Solo un documento: no descuenta existencias ni registra ventas.</p>

          <div className="cotizar-lista">
            {!detalle.length && <p className="carrito-vacio">Haz clic en un producto para agregarlo, </p>}
            {detalle.map((linea) => (
              <div className="carrito-item" key={linea.clave}>
                <div>
                  <b className="con-area"><IconoDeArea categoria={productos.find((p) => p.id === linea.productoId)?.categoria ?? ''} pequeno /> {linea.descripcion}</b>
                  <small>{formato.dinero(linea.precio)} c/u{linea.stock != null && linea.cantidad > linea.stock ? ` · hay ${formato.cantidad(linea.stock, linea.unidad)}` : ''}</small>
                </div>
                <button className="carrito-quitar" onClick={() => quitar(linea.clave)} aria-label={`Quitar ${linea.descripcion}`}>✕</button>
                <div className="carrito-cantidad">
                  <button onClick={() => sumar(linea, -1)} aria-label="Uno menos">−</button>
                  <input type="number" min="0.01" step="any" value={lineas.find((l) => l.clave === linea.clave).cantidad} aria-label={`Cantidad de ${linea.descripcion}`}
                    className={linea.cantidad > 0 ? '' : 'invalida'} onChange={(evento) => cambiarCantidad(linea.clave, evento.target.value)} />
                  <button onClick={() => sumar(linea, 1)} aria-label="Uno más">+</button>
                </div>
                <span className="carrito-subtotal">{formato.dinero(linea.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="carrito-total"><span>TOTAL</span><strong>{formato.dinero(total)}</strong></div>
          {montoDescuento > 0 && <p className="cotizar-detalle-total">Subtotal {formato.dinero(subtotal)} · descuento {porcentaje}% (−{formato.dinero(montoDescuento)})</p>}

          <div className="carrito-pago">
            <div className="form-row">
              <label>Cliente
                <input value={cliente} onChange={(evento) => poner('cliente', evento.target.value)} placeholder="Nombre o empresa" maxLength="80" />
              </label>
              <label>DUI / NIT
                <input value={documento} onChange={(evento) => poner('documento', evento.target.value)} placeholder="Opcional" maxLength="30" />
              </label>
            </div>
            <label>Teléfono o correo del cliente
              <input value={contacto} onChange={(evento) => poner('contacto', evento.target.value)} placeholder="Opcional" maxLength="80" />
            </label>
            <div className="form-row">
              <label>Descuento (%)
                <input type="number" min="0" max="100" step="any" value={descuento} onChange={(evento) => poner('descuento', evento.target.value)} placeholder="0" />
              </label>
              <label>Válida por (días)
                <input type="number" min="1" max="365" step="1" value={validez} onChange={(evento) => poner('validez', evento.target.value)} />
              </label>
            </div>
            <label>Observaciones (salen en el documento)
              <textarea value={notas} onChange={(evento) => poner('notas', evento.target.value)} rows="2" maxLength="300" placeholder="Ej. Entrega en 3 días hábiles" />
            </label>
            <button className="boton-cobrar" onClick={() => setVistaPrevia(true)} disabled={!lista}>Vista previa e imprimir</button>
          </div>
        </section>
      </aside>

      {vistaPrevia && (
        <Ventana alCerrar={() => setVistaPrevia(false)} ancha="grande">
          <VerCotizacion cotizacion={cotizacion} alCerrar={() => setVistaPrevia(false)} avisar={avisar} />
        </Ventana>
      )}
    </div>
  )
}

// Redondear a centavos (evita resultados como 10.000000001).
const redondear = (numero) => Math.round(numero * 100) / 100
