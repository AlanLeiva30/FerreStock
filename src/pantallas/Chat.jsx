// ─────────────────────────────────────────────────────────────
// PANTALLA: CHAT DEL EQUIPO (todos los chats, en pantalla completa)
// ─────────────────────────────────────────────────────────────
//   ┌──────────────────────┬──────────────────────────────────────┐
//   │ Mensajes             │ ← ● Mario López · En línea           │
//   │ [Buscar a alguien…]  │                                      │
//   │ 💬 Chat del equipo (2)│   conversación seleccionada          │
//   │ ● Mario López    (1) │                                      │
//   │ ● Kelly Vásquez      │ [ Escribe un mensaje…        ] [➤]   │
//   └──────────────────────┴──────────────────────────────────────┘
//
// A la izquierda están todas las conversaciones: la sala del equipo (la ven todas las personas; ahí se puede
// escribir «@» para dirigirle un mensaje a alguien) y un chat privado con cada persona (solo lo ven ustedes dos).
// Al elegir una se abre a la derecha. En el celular se ve una cosa a la vez: la lista o la conversación.
// La ventanita flotante del ícono de mensajes (componentes/MensajeriaFlotante.jsx) muestra las mismas conversaciones.

import { useCallback, useState } from 'react'
import Avatar from '../componentes/Avatar.jsx'
import ConversacionDeChat from '../componentes/ConversacionDeChat.jsx'
import Icono from '../componentes/Icono.jsx'
import ListaDeConversaciones from '../componentes/ListaDeConversaciones.jsx'
import { formato } from '../utilidades/formato.js'
import { useConversaciones } from '../utilidades/useConversaciones.js'

export default function Chat({ usuario, esAdmin, avisar, actualizarResumenChat }) {
  const [seleccion, setSeleccion] = useState({ global: true })
  const [verLista, setVerLista] = useState(false) // solo se usa en el celular: true = se ve la lista en vez de la conversación
  const { datos, cargar } = useConversaciones(true, 5_000)
  const personas = datos?.personas ?? []

  const alLeer = useCallback(() => { actualizarResumenChat?.(); cargar() }, [actualizarResumenChat, cargar])
  const elegir = (nueva) => { setSeleccion(nueva); setVerLista(false) }

  const estado = seleccion.persona ? formato.ultimaConexion(seleccion.persona.ultima_conexion) : null
  const enLinea = personas.filter((persona) => formato.ultimaConexion(persona.ultima_conexion).enLinea).length

  return (
    <section className={verLista ? 'panel view chat chat-doble viendo-lista' : 'panel view chat chat-doble'}>
      <aside className="chat-barra">
        <div className="chat-barra-titulo"><Icono nombre="chat" className="antes" /><b>Mensajes</b><small>{enLinea} en línea</small></div>
        <ListaDeConversaciones datos={datos} seleccion={seleccion} alElegir={elegir} />
      </aside>

      <div className="chat-principal">
        <header className="chat-cabecera">
          <button className="chat-volver" onClick={() => setVerLista(true)} aria-label="Volver a la lista de conversaciones" title="Volver"><Icono nombre="atras" tamano={18} /></button>
          {seleccion.persona ? (
            <div className="mensajeria-quien">
              <Avatar usuario={seleccion.persona} tamano={36} />
              <div><b>{seleccion.persona.nombre}</b><small className={estado.enLinea ? 'en-linea' : ''}>{seleccion.persona.rol_nombre} · {estado.enLinea ? 'En línea' : `Últ. conexión: ${estado.texto}`}</small></div>
            </div>
          ) : (
            <div className="mensajeria-quien">
              <span className="mensajeria-icono-global grande"><Icono nombre="chat" tamano={20} /></span>
              <div><b>Chat del equipo</b><small>Todas las personas del sistema · escribe @ para mencionar a alguien</small></div>
            </div>
          )}
        </header>
        <ConversacionDeChat key={seleccion.persona?.id ?? 'global'} con={seleccion.persona?.id ?? null} usuario={usuario} esAdmin={esAdmin}
          personas={personas} avisar={avisar} alLeer={alLeer} />
      </div>
    </section>
  )
}
