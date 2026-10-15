// ─────────────────────────────────────────────────────────────
// VENTANA: INFORMACIÓN DE UN MENSAJE (como «Info del mensaje» de WhatsApp)
// ─────────────────────────────────────────────────────────────
// Solo la ve quien escribió el mensaje. Dice cuándo se envió y, de cada persona: cuándo le llegó (entregado) y
// cuándo lo leyó. En la sala global las personas que todavía no lo reciben salen como «Pendiente».
//   mensaje → el mensaje (de los de ConversacionDeChat)   ·   personas → el equipo, para mostrar sus fotos

import { useEffect, useState } from 'react'
import Avatar from '../componentes/Avatar.jsx'
import Cheques from '../componentes/Cheques.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'

export default function InfoDelMensaje({ mensaje, personas, preferencias, alCerrar }) {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    servidor.infoDelMensaje(mensaje.id).then((datos) => vigente && setInfo(datos)).catch((problema) => vigente && setError(problema.message))
    return () => { vigente = false }
  }, [mensaje.id])

  const leyeron = info?.destinatarios.filter((persona) => persona.leido_en) ?? []
  const recibieron = info?.destinatarios.filter((persona) => persona.entregado_en && !persona.leido_en) ?? []
  const pendientes = info?.destinatarios.filter((persona) => !persona.entregado_en) ?? []
  const fila = (persona, estado, hora) => (
    <li key={persona.id}>
      <Avatar usuario={personas.find((otra) => otra.id === persona.id) ?? persona} tamano={30} />
      <span><b>{persona.nombre}</b><small>{persona.rol_nombre}</small></span>
      <span className="info-hora"><Cheques estado={estado} preferencias={preferencias} />{hora ? formato.fechaCompleta(hora) : 'Pendiente'}</span>
    </li>
  )

  return (
    <>
      <h2>Información del mensaje</h2>
      <p>Solo tú ves esto: cuándo se envió, a quién le llegó y quién ya lo leyó.</p>
      <div className="info-mensaje-burbuja">{mensaje.texto}<small>Enviado: {formato.fechaCompleta(mensaje.fecha)}</small></div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!info && !error && <p className="grafica-mensaje">Cargando…</p>}
      {info && !info.conRecibos && <p className="info-aviso">Este mensaje es anterior a los recibos de entrega y lectura: no se guardó cuándo llegó o se leyó.</p>}
      {info && info.conRecibos && (
        <div className="info-mensaje">
          {leyeron.length > 0 && <><h3>Leído por ({leyeron.length})</h3><ul>{leyeron.map((persona) => fila(persona, 'leido', persona.leido_en))}</ul></>}
          {recibieron.length > 0 && <><h3>Entregado a ({recibieron.length})</h3><ul>{recibieron.map((persona) => fila(persona, 'entregado', persona.entregado_en))}</ul></>}
          {pendientes.length > 0 && <><h3>Sin recibir todavía ({pendientes.length})</h3><ul>{pendientes.map((persona) => fila(persona, 'enviado', null))}</ul></>}
          {!info.destinatarios.length && <p className="chat-vacio">No hay otras personas en el sistema.</p>}
        </div>
      )}
      <button className="info-cerrar" onClick={alCerrar}>Listo</button>
    </>
  )
}
