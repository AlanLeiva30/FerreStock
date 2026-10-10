// ─────────────────────────────────────────────────────────────
// VENTANA: FACTURA (ver e imprimir)
// ─────────────────────────────────────────────────────────────
// Se abre sola después de cobrar, y también al tocar una venta en "Ventas de hoy".
// "Imprimir" abre la ventana de impresión del navegador: ahí se elige la
// impresora, o "Guardar como PDF" para mandarla por correo o WhatsApp.
//
// Para que al imprimir salga SOLO la factura (sin el menú ni los botones), se
// pone una copia aparte al final de la página ("createPortal"). La sección
// "IMPRESIÓN" de estilos.css esconde todo lo demás al imprimir.

import { createPortal } from 'react-dom'
import Factura from '../componentes/Factura.jsx'
import { formato } from '../utilidades/formato.js'

export default function VerFactura({ venta, alCerrar }) {
  return (
    <>
      <h2>Factura N.º {formato.factura(venta.id)}</h2>
      <p>Pulsa <b>Imprimir</b> y elige la impresora, o “Guardar como PDF”.</p>

      <Factura venta={venta} />

      <div className="factura-botones">
        <button onClick={() => window.print()} autoFocus>🖨 Imprimir</button>
        <button className="secundario" onClick={alCerrar}>Listo</button>
      </div>

      {createPortal(<div className="zona-de-impresion"><Factura venta={venta} /></div>, document.body)}
    </>
  )
}
