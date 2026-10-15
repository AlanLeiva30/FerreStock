// ─────────────────────────────────────────────────────────────
// VENTANA: LA COTIZACIÓN (vista previa, guardar, imprimir o PDF)
// ─────────────────────────────────────────────────────────────
// La usan dos pantallas:
//   · Cotizar:       recibe "vista" (lo que se está armando) y "envio" (lo que se manda al servidor).
//                    Botones: Guardar e imprimir · Solo guardar · Volver a editar.
//                    Al guardar, el servidor le pone su número y la ventana pasa a mostrar la cotización guardada.
//   · Cotizaciones:  recibe "guardada" (una cotización ya guardada). Botones: Imprimir · Usar como base · Cerrar.
//
// "Imprimir / Guardar PDF" abre la ventana de impresión del navegador: ahí se elige la impresora o "Guardar como PDF".
// Igual que la factura, se pone una copia aparte al final de la página (createPortal) para que al imprimir
// salga SOLO la cotización (ver la sección "IMPRESIÓN" de estilos.css).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CotizacionDocumento from '../componentes/CotizacionDocumento.jsx'
import Icono from '../componentes/Icono.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'

export default function VerCotizacion({ vista, envio, guardada: yaGuardada = null, alGuardada, alUsarComoBase, alPasarAVenta, alCerrar }) {
  const [guardada, setGuardada] = useState(yaGuardada)
  const [negocio, setNegocio] = useState(yaGuardada?.negocio ?? null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [imprimirAlTerminar, setImprimirAlTerminar] = useState(false)
  const [fechaDeLaVista] = useState(() => new Date())

  useEffect(() => {
    if (!negocio) servidor.datosDelNegocio().then(setNegocio).catch(() => setNegocio({ nombre: 'FerreStock' }))
  }, [negocio])

  // Después de guardar, se espera a que la hoja se vuelva a dibujar con su número y entonces se imprime.
  useEffect(() => {
    if (!imprimirAlTerminar || !guardada) return
    setImprimirAlTerminar(false)
    setTimeout(() => window.print(), 150) // (sin cancelar: al cambiar el aviso, este mismo efecto se vuelve a ejecutar)
  }, [imprimirAlTerminar, guardada])

  const guardar = async (imprimir) => {
    setGuardando(true)
    setError('')
    try {
      const nueva = await servidor.guardarCotizacion(envio)
      setGuardada(nueva)
      alGuardada?.(nueva)
      if (imprimir) setImprimirAlTerminar(true)
    } catch (problema) {
      setError(problema.message)
    } finally {
      setGuardando(false)
    }
  }

  const documento = guardada ?? vista
  const numero = guardada ? formato.cotizacion(guardada.id) : 'sin guardar'
  const fecha = guardada ? new Date(guardada.fecha) : fechaDeLaVista
  const hoja = negocio && <CotizacionDocumento cotizacion={documento} negocio={negocio} numero={numero} fecha={fecha} />

  return (
    <>
      <h2>{guardada ? `Cotización ${formato.cotizacion(guardada.id)}` : 'Vista previa de la cotización'}</h2>
      <p>
        {guardada
          ? <>Pulsa <b>Imprimir / Guardar PDF</b> y, en la ventana de impresión, elige la impresora o «Guardar como PDF».</>
          : <>Así saldrá en el papel. <b>Guarda</b> la cotización para que reciba su número y quede en «Cotizaciones».</>}
      </p>

      <div className="informe-controles">
        <span />
        <div className="factura-botones informe-botones">
          {guardada ? (
            <>
              <button onClick={() => window.print()} disabled={!negocio} autoFocus><Icono nombre="impresora" tamano={16} className="antes" />Imprimir / Guardar PDF</button>
              {alPasarAVenta && (guardada.venta_id
                ? <button className="secundario" disabled title="Esta cotización ya se pasó a venta">Vendida · factura {formato.factura(guardada.venta_id)}</button>
                : <button className="secundario" onClick={() => alPasarAVenta(guardada)}>Pasar a venta</button>)}
              {alUsarComoBase && <button className="secundario" onClick={() => alUsarComoBase(guardada)}>Usar como base</button>}
              <button className="secundario" onClick={alCerrar}>Cerrar</button>
            </>
          ) : (
            <>
              <button onClick={() => guardar(true)} disabled={!negocio || guardando} autoFocus><Icono nombre="impresora" tamano={16} className="antes" />{guardando ? 'Guardando…' : 'Guardar e imprimir'}</button>
              <button className="secundario" onClick={() => guardar(false)} disabled={!negocio || guardando}>Solo guardar</button>
              <button className="secundario" onClick={alCerrar} disabled={guardando}>Volver a editar</button>
            </>
          )}
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!negocio && <p className="grafica-mensaje">Preparando la cotización…</p>}
      {hoja}
      {hoja && createPortal(<div className="zona-de-impresion">{hoja}</div>, document.body)}
    </>
  )
}
