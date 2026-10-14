// ─────────────────────────────────────────────────────────────
// VENTANA: VISTA PREVIA DE LA COTIZACIÓN (imprimir o guardar en PDF)
// ─────────────────────────────────────────────────────────────
// Muestra la cotización tal como saldrá en el papel. "Imprimir / Guardar PDF" abre la ventana de
// impresión del navegador: ahí se elige la impresora o "Guardar como PDF".
//
// Igual que la factura y el informe, se pone una copia aparte al final de la página (createPortal)
// para que al imprimir salga SOLO la cotización (ver la sección "IMPRESIÓN" de estilos.css).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CotizacionDocumento from '../componentes/CotizacionDocumento.jsx'
import Icono from '../componentes/Icono.jsx'
import { servidor } from '../utilidades/servidor.js'

export default function VerCotizacion({ cotizacion, alCerrar }) {
  const [negocio, setNegocio] = useState(null)
  const [fecha] = useState(() => new Date())
  // El número se arma con la fecha y la hora: COT-261014-0613 (día 14 del mes 10 de 2026, 06:13).
  const numero = `COT-${String(fecha.getFullYear()).slice(2)}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}`

  useEffect(() => {
    servidor.datosDelNegocio().then(setNegocio).catch(() => setNegocio({ nombre: 'FerreStock' }))
  }, [])

  return (
    <>
      <h2>Vista previa de la cotización</h2>
      <p>Así saldrá en el papel. Pulsa <b>Imprimir / Guardar PDF</b> y, en la ventana de impresión, elige la impresora o «Guardar como PDF».</p>

      <div className="informe-controles">
        <span />
        <div className="factura-botones informe-botones">
          <button onClick={() => window.print()} disabled={!negocio} autoFocus><Icono nombre="impresora" tamano={16} className="antes" />Imprimir / Guardar PDF</button>
          <button className="secundario" onClick={alCerrar}>Volver a editar</button>
        </div>
      </div>

      {!negocio && <p className="grafica-mensaje">Preparando la cotización…</p>}
      {negocio && (
        <>
          <CotizacionDocumento cotizacion={cotizacion} negocio={negocio} numero={numero} fecha={fecha} />
          {createPortal(<div className="zona-de-impresion"><CotizacionDocumento cotizacion={cotizacion} negocio={negocio} numero={numero} fecha={fecha} /></div>, document.body)}
        </>
      )}
    </>
  )
}
