// ─────────────────────────────────────────────────────────────
// MENSAJERÍA FLOTANTE (el ícono de mensajes de arriba y su ventanita, tipo Messenger / Instagram web)
// ─────────────────────────────────────────────────────────────
// El botón con el globo de mensajes sin leer está en la barra de arriba, junto a la campana.
// Al pulsarlo se abre una ventana pequeña abajo a la derecha, sobre cualquier pantalla:
//
//   ┌─ Mensajes ───────────── ✕ ┐        ┌─ ← ● Mario López ─ ▁ ✕ ┐
//   │ [ Buscar a alguien… ]      │        │  conversación         │
//   │ 💬 Chat del equipo      (2)│  →     │                       │
//   │ ● Mario López     «Hola»   │        │ [ Escribe… ]  [➤]     │
//   │ ● Kelly Vásquez   «Gracias»│        └───────────────────────┘
//   └────────────────────────────┘
//
// · La lista muestra la sala global y a cada persona del equipo, con su último mensaje, cuántos no has leído
//   y un punto verde si está en línea. Lo más reciente va arriba.
// · Cada conversación privada es solo de las dos personas: ni el administrador la puede leer.
// · Se actualiza sola: la lista cada 5 segundos mientras está abierta y cada conversación cada 3.
// · Los mensajes son los mismos de la pantalla «Chat del equipo» (la sala global) y se escriben con ConversacionDeChat.jsx.
//
//   resumen              → cuántos mensajes sin leer hay (lo trae Sistema.jsx cada 10 segundos)
//   alActualizarResumen  → pide ese resumen otra vez (después de leer mensajes)

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Avatar from './Avatar.jsx'
import ConversacionDeChat from './ConversacionDeChat.jsx'
import Icono from './Icono.jsx'
import ListaDeConversaciones from './ListaDeConversaciones.jsx'
import { formato } from '../utilidades/formato.js'
import { useConversaciones } from '../utilidades/useConversaciones.js'

export default function MensajeriaFlotante({ usuario, esAdmin, avisar, resumen, alActualizarResumen, irA }) {
  const [abierto, setAbierto] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const [vista, setVista] = useState(null) //  null = la lista · { global: true } = la sala global · { persona } = un chat privado
  const total = resumen?.total ?? 0

  // Con la ventana abierta, la lista se actualiza sola (cada 5 s en la lista, cada 30 s dentro de una conversación).
  const enLista = vista === null
  const { datos, cargar } = useConversaciones(abierto, enLista ? 5_000 : 30_000)

  // Para que los avisos (abajo a la derecha) no queden tapados por la ventana.
  useEffect(() => {
    document.body.classList.toggle('con-mensajeria', abierto && !minimizado)
    return () => document.body.classList.remove('con-mensajeria')
  }, [abierto, minimizado])

  const alLeer = useCallback(() => { alActualizarResumen?.(); cargar() }, [alActualizarResumen, cargar])

  const alternar = () => { setAbierto((actual) => !actual); setMinimizado(false) }
  const abrirConversacion = (nuevaVista) => { setVista(nuevaVista); setMinimizado(false) }

  const personas = datos?.personas ?? []
  const estado = (persona) => formato.ultimaConexion(persona.ultima_conexion)

  const ventana = abierto && (
    <section className={minimizado ? 'mensajeria minimizada' : 'mensajeria'} role="dialog" aria-label="Mensajes">
      <header>
        {vista && <button onClick={() => setVista(null)} aria-label="Volver a la lista de conversaciones" title="Volver"><Icono nombre="atras" tamano={17} /></button>}
        {vista?.persona && (
          <div className="mensajeria-quien">
            <Avatar usuario={vista.persona} tamano={30} />
            <div><b>{vista.persona.nombre}</b><small className={estado(vista.persona).enLinea ? 'en-linea' : ''}>{estado(vista.persona).enLinea ? 'En línea' : `Últ. conexión: ${estado(vista.persona).texto}`}</small></div>
          </div>
        )}
        {vista?.global && <div className="mensajeria-quien"><span className="mensajeria-icono-global"><Icono nombre="chat" tamano={17} /></span><div><b>Chat del equipo</b><small>Todas las personas del sistema</small></div></div>}
        {!vista && <b className="mensajeria-titulo">Mensajes</b>}
        <span className="mensajeria-acciones">
          {vista?.global && <button onClick={() => { setAbierto(false); irA('chat') }} aria-label="Abrir el chat del equipo en pantalla completa" title="Abrir en pantalla completa"><Icono nombre="flechaDiagonal" tamano={15} /></button>}
          <button onClick={() => setMinimizado(!minimizado)} aria-label={minimizado ? 'Mostrar la ventana' : 'Minimizar'} title={minimizado ? 'Mostrar' : 'Minimizar'}><Icono nombre={minimizado ? 'arriba' : 'abajo'} tamano={16} /></button>
          <button onClick={alternar} aria-label="Cerrar mensajes" title="Cerrar">✕</button>
        </span>
      </header>

      {!minimizado && (
        <div className="mensajeria-cuerpo">
          {vista ? (
            <ConversacionDeChat key={vista.persona?.id ?? 'global'} con={vista.persona?.id ?? null} usuario={usuario} esAdmin={esAdmin}
              personas={personas} avisar={avisar} alLeer={alLeer} compacto />
          ) : (
            <>
              <ListaDeConversaciones datos={datos} alElegir={abrirConversacion} />
            </>
          )}
        </div>
      )}
    </section>
  )

  return (
    <>
      <button className="mensajeria-boton" onClick={alternar} aria-label={total ? `Mensajes: ${total} sin leer` : 'Mensajes'} aria-expanded={abierto} title="Mensajes">
        <Icono nombre="chat" tamano={19} />{total > 0 && <em>{total > 99 ? '99+' : total}</em>}
      </button>
      {ventana && createPortal(ventana, document.body)}
    </>
  )
}
