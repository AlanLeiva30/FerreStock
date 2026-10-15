// ─────────────────────────────────────────────────────────────
// LISTA DE CONVERSACIONES (con buscador)
// ─────────────────────────────────────────────────────────────
// La sala «Chat del equipo» y una fila por cada persona, con su foto, un punto verde si está en línea, su último mensaje,
// la hora y cuántos mensajes no has leído (con una «@» si en la sala global te mencionaron). Lo más reciente va arriba.
// La usan la ventanita flotante y la pantalla «Chat del equipo».
//
//   datos       → lo que devuelve useConversaciones (null mientras carga)
//   seleccion   → la conversación abierta: null = ninguna · { global: true } · { persona }
//   alElegir    → se llama con { global: true } o { persona } al tocar una fila

import { useState } from 'react'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'
import { formato } from '../utilidades/formato.js'

const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
// «03:15 p. m.» si es de hoy, «Ayer» o «12/10» si es más viejo.
function horaCorta(fecha) {
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (mismoDia(fecha, new Date())) return formato.hora(fecha)
  if (mismoDia(fecha, ayer)) return 'Ayer'
  const f = new Date(fecha)
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`
}

export default function ListaDeConversaciones({ datos, seleccion = null, alElegir }) {
  const [busqueda, setBusqueda] = useState('')
  const personas = datos?.personas ?? []
  const visibles = personas.filter((persona) => persona.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))

  return (
    <>
      <input className="mensajeria-buscar" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar a alguien…" aria-label="Buscar a una persona" />
      <div className="mensajeria-lista">
        {!datos && <p className="grafica-mensaje">Cargando…</p>}
        {datos && !busqueda.trim() && (
          <button className={seleccion?.global ? 'mensajeria-fila activa' : datos.global.noLeidos ? 'mensajeria-fila sin-leer' : 'mensajeria-fila'} onClick={() => alElegir({ global: true })}>
            <span className="mensajeria-icono-global grande"><Icono nombre="chat" tamano={20} /></span>
            <span className="mensajeria-texto">
              <b>Chat del equipo</b>
              <small>{datos.global.ultimo ? `${datos.global.ultimo.autor.split(' ')[0]}: ${datos.global.ultimo.texto ?? 'Mensaje eliminado'}` : 'Todos pueden escribir aquí'}</small>
            </span>
            {datos.global.menciones > 0 && <em className="menciona" title="Te mencionaron">@</em>}
            {datos.global.noLeidos > 0 && <em>{datos.global.noLeidos}</em>}
          </button>
        )}
        {visibles.map((persona) => {
          const enLinea = formato.ultimaConexion(persona.ultima_conexion).enLinea
          const activa = seleccion?.persona?.id === persona.id
          return (
            <button key={persona.id} className={activa ? 'mensajeria-fila activa' : persona.noLeidos ? 'mensajeria-fila sin-leer' : 'mensajeria-fila'} onClick={() => alElegir({ persona })}>
              <span className="mensajeria-avatar"><Avatar usuario={persona} tamano={40} />{enLinea && <i aria-hidden="true" title="En línea" />}</span>
              <span className="mensajeria-texto">
                <b>{persona.nombre}</b>
                <small>{persona.ultimo ? `${persona.ultimo.mio ? 'Tú: ' : ''}${persona.ultimo.texto ?? 'Mensaje eliminado'}` : persona.rol_nombre}</small>
              </span>
              {persona.ultimo && <time>{horaCorta(persona.ultimo.fecha)}</time>}
              {persona.noLeidos > 0 && <em>{persona.noLeidos}</em>}
            </button>
          )
        })}
        {datos && !visibles.length && <p className="chat-vacio">No hay personas con ese nombre.</p>}
      </div>
    </>
  )
}
