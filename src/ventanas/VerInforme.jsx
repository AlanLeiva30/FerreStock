// ─────────────────────────────────────────────────────────────
// VENTANA: INFORME DE REPORTES (ver, imprimir o guardar en PDF)
// ─────────────────────────────────────────────────────────────
// Muestra el informe tal como saldrá en el papel. Se puede elegir cuántos días de ventas incluir.
// "Imprimir / Guardar PDF" abre la ventana de impresión del navegador: ahí se elige la impresora
// o "Guardar como PDF".
//
// Igual que la factura, se pone una copia aparte al final de la página (createPortal) para que al
// imprimir salga SOLO el informe, sin el menú ni los botones (ver la sección "IMPRESIÓN" de estilos.css).

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import InformeDeReportes from '../componentes/InformeDeReportes.jsx'
import Icono from '../componentes/Icono.jsx'
import { actividadReciente, listaDeAlertas, resumenDelInventario, resumenPorCategoria } from '../utilidades/calculos.js'
import { porcionesDelInventario } from '../utilidades/graficas.js'
import { servidor } from '../utilidades/servidor.js'

const PERIODOS = [7, 30, 90]

export default function VerInforme({ productos, movimientos, configuracion, usuario, diasIniciales = 30, alCerrar }) {
  const [dias, setDias] = useState(diasIniciales)
  const [ventas, setVentas] = useState(null) // null = cargando
  const [negocio, setNegocio] = useState(null)
  const [error, setError] = useState('')
  const [generado] = useState(() => new Date())

  useEffect(() => {
    servidor.datosDelNegocio().then(setNegocio).catch(() => setNegocio({ nombre: 'FerreStock' }))
  }, [])

  useEffect(() => {
    let vigente = true
    setVentas(null)
    setError('')
    servidor.ventasPorDia(dias)
      .then((lista) => vigente && setVentas(lista))
      .catch((problema) => vigente && setError(problema.message))
    return () => { vigente = false }
  }, [dias])

  const informe = useMemo(() => {
    if (!ventas || !negocio) return null
    const categorias = resumenPorCategoria(productos, configuracion.categorias)
    return {
      negocio, generado, dias, ventas, categorias,
      generadoPor: usuario.nombre,
      totales: resumenDelInventario(productos),
      porciones: porcionesDelInventario(categorias),
      actividad: actividadReciente(movimientos, 30),
      alertas: listaDeAlertas(productos),
    }
  }, [ventas, negocio, productos, movimientos, configuracion.categorias, usuario.nombre, dias, generado])

  return (
    <>
      <h2>Informe de reportes</h2>
      <p>Revisa el informe y pulsa <b>Imprimir / Guardar PDF</b>. Para obtener el archivo, elige «Guardar como PDF» en la ventana de impresión.</p>

      <div className="informe-controles">
        <div className="grafica-periodo" role="group" aria-label="Días de ventas que incluye el informe">
          {PERIODOS.map((cantidad) => (
            <button key={cantidad} type="button" className={dias === cantidad ? 'on' : ''} aria-pressed={dias === cantidad} onClick={() => setDias(cantidad)}>
              {cantidad} días
            </button>
          ))}
        </div>
        <div className="factura-botones informe-botones">
          <button onClick={() => window.print()} disabled={!informe} autoFocus><Icono nombre="impresora" tamano={16} className="antes" />Imprimir / Guardar PDF</button>
          <button className="secundario" onClick={alCerrar}>Cerrar</button>
        </div>
      </div>

      {error && <p className="form-error" role="alert">No se pudo preparar el informe: {error}</p>}
      {!error && !informe && <p className="grafica-mensaje">Preparando el informe…</p>}
      {informe && (
        <>
          <InformeDeReportes informe={informe} />
          {createPortal(<div className="zona-de-impresion"><InformeDeReportes informe={informe} /></div>, document.body)}
        </>
      )}
    </>
  )
}
