// ─────────────────────────────────────────────────────────────
// INFORMACIÓN DESPLEGABLE DE UN MENSAJE (sala del equipo)
// ─────────────────────────────────────────────────────────────
// Se despliega justo debajo del mensaje al tocar el botón ⓘ que está a su lado, y muestra quién lo vio:
// «Leído por», «Entregado a» y «Sin recibir todavía», cada persona con su hora. Se actualiza sola cada 9 segundos
// mientras está abierto, así se ve cómo van llegando las lecturas. Solo la ve quien escribió el mensaje.
//   mensaje → el mensaje   ·   personas → el equipo (para las fotos)   ·   alCerrar → cierra el desplegable

import { useEffect, useRef, useState } from 'react'
import { ListaDeRecibos } from '../ventanas/InfoDelMensaje.jsx'
import { servidor } from '../utilidades/servidor.js'

export default function InfoDesplegable({ mensaje, personas, preferencias, alCerrar }) {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')
  const caja = useRef(null)

  useEffect(() => {
    let vigente = true
    const pedir = () => servidor.infoDelMensaje(mensaje.id).then((datos) => { if (vigente) { setInfo(datos); setError('') } }).catch((problema) => vigente && setError(problema.message))
    pedir()
    const reloj = setInterval(() => document.visibilityState === 'visible' && pedir(), 9_000)
    return () => { vigente = false; clearInterval(reloj) }
  }, [mensaje.id])

  // Al abrirse, se baja lo justo para que se vea completo.
  useEffect(() => { caja.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [info])

  return (
    <div className="chat-desplegable" ref={caja} role="region" aria-label="Quién vio este mensaje">
      <header><b>Quién lo vio</b><button onClick={alCerrar} aria-label="Cerrar" title="Cerrar">✕</button></header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!info && !error && <p className="grafica-mensaje">Cargando…</p>}
      {info && <ListaDeRecibos info={info} personas={personas} preferencias={preferencias} />}
    </div>
  )
}
