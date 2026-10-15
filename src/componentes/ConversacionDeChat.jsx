// ─────────────────────────────────────────────────────────────
// UNA CONVERSACIÓN DE CHAT (mensajes + caja para escribir)
// ─────────────────────────────────────────────────────────────
// Sirve para las dos clases de chat, y la usan la pantalla «Chat del equipo» y la ventanita flotante:
//   <ConversacionDeChat con={null} … />        → la sala global (la ven todas las personas)
//   <ConversacionDeChat con={persona.id} … />  → el chat privado con esa persona (solo lo ven ustedes dos)
//
// · Cada 3 segundos pide los mensajes nuevos (solo mientras la pestaña está a la vista). Son consultas normales
//   al servidor, que no cuentan como «usó el programa» en la última conexión.
// · Enter envía; Shift + Enter hace un salto de línea. Máximo 500 caracteres.
// · Borrar: en la sala global, cada persona los suyos y el administrador cualquiera; en lo privado, solo los propios.
//   Los borrados quedan como «Mensaje eliminado».
// · Recibos como en WhatsApp: en tus mensajes se ven los chequecitos (enviado, entregado, leído) con el estilo y el color que
//   cada persona elige en sus ajustes; debajo puede verse la hora de entrega y de lectura, y al tocarlos se abre la «Información
//   del mensaje» con el detalle de cada persona.
// · En la sala global, al escribir «@» se abre una lista de personas: eliges a quién va dirigido el mensaje. La persona
//   mencionada lo ve resaltado y con una «@» en los mensajes sin leer.
// · Al ver mensajes nuevos se marcan como leídos y se avisa con "alLeer" (para actualizar los globos).
//
//   usuario  → la persona que está usando el programa
//   esAdmin  → ¿es administrador? (puede borrar mensajes de la sala global)
//   personas → lista del equipo [{ id, nombre, foto, rol_nombre }] para mostrar la foto y el rol de quien escribe
//   compacto → versión más pequeña, para la ventanita flotante

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Alerta from './Alerta.jsx'
import Avatar from './Avatar.jsx'
import Cheques from './Cheques.jsx'
import InfoDesplegable from './InfoDesplegable.jsx'
import Icono from './Icono.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import InfoDelMensaje from '../ventanas/InfoDelMensaje.jsx'
import Ventana from './Ventana.jsx'

const LARGO_MAXIMO = 500
const CADA_CUANTO_SE_REVISA = 3_000 //     mensajes nuevos
const CADA_CUANTAS_REVISIONES_SE_SINCRONIZA = 3 // cada 9 s se vuelve a pedir lo último para ver los mensajes borrados y los recibos (entregado, leído)
const MINUTOS_PARA_AGRUPAR = 5

// ── Menciones (@Nombre) ──
const sinTildes = (cadena) => cadena.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const escaparParaRegex = (cadena) => cadena.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Lo que se escribe después de la «@»: el primer nombre; si otra persona del equipo empieza igual, los dos primeros.
function palabraDeMencion(persona, personas) {
  const palabras = persona.nombre.trim().split(/\s+/)
  const repetido = personas.some((otra) => otra.id !== persona.id && otra.nombre.trim().split(/\s+/)[0].toLowerCase() === palabras[0].toLowerCase())
  return repetido ? palabras.slice(0, 2).join(' ') : palabras[0]
}
// Las personas del equipo a las que el texto menciona (por ejemplo «@Kelly»), aunque se hayan escrito a mano.
function mencionadosEn(texto, personas, yoId) {
  return personas.filter((persona) => persona.id !== yoId && new RegExp(`(^|\\s)@${escaparParaRegex(palabraDeMencion(persona, personas))}(?=[\\s.,;:!?¡¿)]|$)`, 'i').test(texto))
}
// Parte el texto de un mensaje para resaltar las «@Nombre» de las personas mencionadas.
function conMenciones(texto, ids, personas) {
  const palabras = ids.map((id) => personas.find((persona) => persona.id === id)).filter(Boolean).map((persona) => palabraDeMencion(persona, personas))
  if (!palabras.length) return texto
  const regex = new RegExp(`(@(?:${palabras.sort((a, b) => b.length - a.length).map(escaparParaRegex).join('|')}))(?=[\\s.,;:!?¡¿)]|$)`, 'gi')
  return texto.split(regex).map((trozo, posicion) => (posicion % 2 ? <span key={posicion} className="chat-mencion">{trozo}</span> : trozo))
}

// Junta mensajes nuevos con los que ya había (sin repetir; si un mensaje cambió, por ejemplo se borró, gana el nuevo).
function mezclar(actuales, nuevos) {
  const porId = new Map(actuales.map((mensaje) => [mensaje.id, mensaje]))
  for (const mensaje of nuevos) porId.set(mensaje.id, mensaje)
  return [...porId.values()].sort((a, b) => a.id - b.id)
}

const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
function etiquetaDelDia(fecha) {
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (mismoDia(fecha, hoy)) return 'Hoy'
  if (mismoDia(fecha, ayer)) return 'Ayer'
  return formato.fechaLarga(fecha)
}

export default function ConversacionDeChat({ con = null, usuario, esAdmin, personas = [], avisar, alLeer, compacto = false }) {
  const privado = con !== null
  const [mensajes, setMensajes] = useState([])
  const [hayAnteriores, setHayAnteriores] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorAlEnviar, setErrorAlEnviar] = useState('')
  const [borrando, setBorrando] = useState(null) // mensaje que se va a borrar (pregunta de confirmación)
  const [hayNuevosAbajo, setHayNuevosAbajo] = useState(false)
  const [desplegado, setDesplegado] = useState(null) // mensaje de la sala con su información abierta (botón ⓘ)
  const [infoDe, setInfoDe] = useState(null) //   mensaje del que se ve la «Información del mensaje» (null = cerrada)
  const [menu, setMenu] = useState(null) //  selector de «@»: null = cerrado · { desde, consulta, indice }

  const lista = useRef(null)
  const caja = useRef(null)
  const pegadoAbajo = useRef(true) //   ¿la persona está viendo lo último? (para bajar solas cuando llegan mensajes)
  const bajarAlFinal = useRef(true) //  pedir que se baje al final en el próximo dibujo
  const alturaAntes = useRef(null) //   para no perder el lugar al cargar mensajes anteriores
  const ultimoId = useRef(0)
  const revisiones = useRef(0)

  const alLeerActual = useRef(alLeer) // (así «marcarLeido» no cambia aunque la pantalla de arriba se dibuje de nuevo)
  alLeerActual.current = alLeer
  const marcarLeido = useCallback(async () => {
    try { await servidor.marcarChatLeido(con); alLeerActual.current?.() } catch { /* no es grave: se intenta de nuevo con el próximo mensaje */ }
  }, [con])

  // Primera carga: los últimos 50 mensajes de esta conversación.
  useEffect(() => {
    let vigente = true
    servidor.chatMensajes(privado ? { con } : {})
      .then(({ mensajes: ultimos, hayMas }) => { if (!vigente) return; setMensajes(ultimos); setHayAnteriores(hayMas); marcarLeido() })
      .catch((problema) => vigente && setError(problema.message))
      .finally(() => vigente && setCargando(false))
    return () => { vigente = false }
  }, [con, privado, marcarLeido])

  // Mensajes nuevos cada 3 segundos.
  useEffect(() => {
    const reloj = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      revisiones.current += 1
      try {
        const sincronizar = revisiones.current % CADA_CUANTAS_REVISIONES_SE_SINCRONIZA === 0
        const filtros = { ...(privado ? { con } : {}), ...(sincronizar ? {} : { desde: ultimoId.current }) }
        const { mensajes: recibidos } = await servidor.chatMensajes(filtros, true)
        if (!recibidos.length) return
        const hayNuevos = recibidos.some((mensaje) => mensaje.id > ultimoId.current)
        setMensajes((actuales) => mezclar(actuales, recibidos))
        if (hayNuevos) {
          if (recibidos.some((mensaje) => mensaje.id > ultimoId.current && mensaje.usuario_id !== usuario.id) && !pegadoAbajo.current) setHayNuevosAbajo(true)
          marcarLeido()
        }
        setError('')
      } catch (problema) {
        setError(problema.message)
      }
    }, CADA_CUANTO_SE_REVISA)
    return () => clearInterval(reloj)
  }, [con, privado, marcarLeido, usuario.id])

  useEffect(() => { ultimoId.current = mensajes.length ? mensajes[mensajes.length - 1].id : 0 }, [mensajes])

  // Después de dibujar: bajar al final si hace falta, o conservar el lugar si se cargaron mensajes anteriores.
  useLayoutEffect(() => {
    const contenedor = lista.current
    if (!contenedor) return
    if (alturaAntes.current !== null) {
      contenedor.scrollTop += contenedor.scrollHeight - alturaAntes.current
      alturaAntes.current = null
    } else if (bajarAlFinal.current || pegadoAbajo.current) {
      contenedor.scrollTop = contenedor.scrollHeight
      bajarAlFinal.current = false
      setHayNuevosAbajo(false)
    }
  }, [mensajes])

  const alDesplazar = () => {
    const contenedor = lista.current
    pegadoAbajo.current = contenedor.scrollHeight - contenedor.scrollTop - contenedor.clientHeight < 80
    if (pegadoAbajo.current) setHayNuevosAbajo(false)
  }

  const cargarAnteriores = async () => {
    try {
      alturaAntes.current = lista.current.scrollHeight
      const { mensajes: anteriores, hayMas } = await servidor.chatMensajes({ ...(privado ? { con } : {}), antes: mensajes[0].id })
      setMensajes((actuales) => mezclar(actuales, anteriores))
      setHayAnteriores(hayMas)
    } catch (problema) {
      alturaAntes.current = null
      setError(problema.message)
    }
  }

  const enviar = async () => {
    const mensaje = texto.trim()
    if (!mensaje || enviando) return
    setEnviando(true)
    setErrorAlEnviar('')
    try {
      const menciones = privado ? undefined : mencionadosEn(mensaje, equipoCompleto, usuario.id).map((persona) => persona.id)
      const nuevo = await servidor.enviarAlChat(mensaje, privado ? con : undefined, menciones)
      bajarAlFinal.current = true
      setMensajes((actuales) => mezclar(actuales, [nuevo]))
      setTexto('')
      setMenu(null)
    } catch (problema) {
      setErrorAlEnviar(problema.message)
    } finally {
      setEnviando(false)
      caja.current?.focus()
    }
  }

  // ── Selector de «@» (solo en la sala global) ──
  const opciones = menu
    ? personas.filter((persona) => persona.id !== usuario.id && sinTildes(persona.nombre).includes(sinTildes(menu.consulta))).slice(0, 6)
    : []
  const cambioElTexto = (evento) => {
    const nuevo = evento.target.value
    setTexto(nuevo)
    if (privado) return
    const antesDelCursor = nuevo.slice(0, evento.target.selectionStart)
    const coincide = antesDelCursor.match(/(^|\s)@([^\s@]{0,30})$/)
    setMenu(coincide ? { desde: antesDelCursor.length - coincide[2].length - 1, consulta: coincide[2], indice: 0 } : null)
  }
  const elegirMencion = (persona) => {
    const cursor = caja.current.selectionStart
    const insertado = `@${palabraDeMencion(persona, equipoCompleto)} `
    const nuevo = texto.slice(0, menu.desde) + insertado + texto.slice(cursor)
    setTexto(nuevo)
    setMenu(null)
    const posicion = menu.desde + insertado.length
    requestAnimationFrame(() => { caja.current?.focus(); caja.current?.setSelectionRange(posicion, posicion) })
  }

  const alPresionarTecla = (evento) => {
    if (menu && opciones.length) {
      if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        evento.preventDefault()
        const paso = evento.key === 'ArrowDown' ? 1 : -1
        setMenu({ ...menu, indice: (menu.indice + paso + opciones.length) % opciones.length })
        return
      }
      if (evento.key === 'Enter' || evento.key === 'Tab') {
        evento.preventDefault()
        elegirMencion(opciones[Math.min(menu.indice, opciones.length - 1)])
        return
      }
    }
    if (menu && evento.key === 'Escape') { setMenu(null); return }
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      enviar()
    }
  }

  const borrar = async () => {
    const mensaje = borrando
    setBorrando(null)
    try {
      await servidor.borrarDelChat(mensaje.id)
      setMensajes((actuales) => actuales.map((actual) => actual.id === mensaje.id ? { ...actual, texto: null, eliminado: true } : actual))
    } catch (problema) {
      avisar?.(`Error: ${problema.message}`)
    }
  }

  // El equipo completo incluye a quien usa el programa (la lista del servidor no lo trae): hace falta para resaltar las menciones a uno mismo.
  const equipoCompleto = personas.some((persona) => persona.id === usuario.id) ? personas : [...personas, usuario]
  const personaDe = (mensaje) => personas.find((persona) => persona.id === mensaje.usuario_id) ?? { id: mensaje.usuario_id, nombre: mensaje.autor, foto: null, rol_nombre: '' }
  const preferencias = usuario.preferencias ?? {}
  // Estado de un mensaje tuyo (null = sin recibos, como los anteriores a esta función).
  //   Privado: leído si ya lo abrió, entregado si le llegó. Sala global: leído si lo leyeron todas las personas,
  //   entregado si les llegó a todas; si no, sigue en «enviado».
  const estadoDe = (mensaje) => {
    if (mensaje.para_id) return mensaje.leido_en ? 'leido' : mensaje.entregado_en ? 'entregado' : 'enviado'
    const recibos = mensaje.recibos
    if (!recibos) return null
    if (recibos.total > 0 && recibos.leidos >= recibos.total) return 'leido'
    if (recibos.total > 0 && recibos.entregados >= recibos.total) return 'entregado'
    return 'enviado'
  }
  // La línea de abajo con las horas: «Entregado 07:01 · Leído 07:05» (o cuántas personas, en la sala global).
  const detalleDe = (mensaje) => {
    if (mensaje.para_id) {
      const partes = [mensaje.entregado_en ? `Entregado ${formato.hora(mensaje.entregado_en)}` : 'Enviado']
      if (mensaje.leido_en) partes.push(`Leído ${formato.hora(mensaje.leido_en)}`)
      return partes.join(' · ')
    }
    const { total, entregados, leidos } = mensaje.recibos
    return total ? `Entregado a ${entregados} de ${total} · Leído por ${leidos}` : 'Enviado'
  }

  return (
    <div className={compacto ? 'chat-conv compacto' : 'chat-conv'}>
      {error && <div className="load-error db-error">{error}</div>}

      <div className="chat-lista" ref={lista} onScroll={alDesplazar}>
        {hayAnteriores && <button className="chat-anteriores" onClick={cargarAnteriores}>Ver mensajes anteriores</button>}
        {cargando && <p className="grafica-mensaje">Cargando el chat…</p>}
        {!cargando && !mensajes.length && <p className="chat-vacio">{privado ? 'Aquí empieza su conversación. ¡Saluda!' : 'Todavía no hay mensajes. ¡Escribe el primero!'}</p>}

        {mensajes.map((mensaje, posicion) => {
          const anterior = mensajes[posicion - 1]
          const nuevoDia = !anterior || !mismoDia(anterior.fecha, mensaje.fecha)
          const propio = mensaje.usuario_id === usuario.id
          const continuacion = anterior && !nuevoDia && anterior.usuario_id === mensaje.usuario_id &&
            new Date(mensaje.fecha) - new Date(anterior.fecha) < MINUTOS_PARA_AGRUPAR * 60_000
          const persona = personaDe(mensaje)
          const meMencionan = !privado && mensaje.menciones?.includes(usuario.id)
          const mostrarAvatar = !propio && !privado && !compacto
          const conAcciones = propio && !privado && !mensaje.eliminado
          return (
            <div key={mensaje.id}>
              {nuevoDia && <div className="chat-dia"><span>{etiquetaDelDia(mensaje.fecha)}</span></div>}
              <div className={['chat-fila', propio && 'propio', continuacion && 'seguido', meMencionan && 'me-mencionan', conAcciones && 'con-acciones'].filter(Boolean).join(' ')}>
                {mostrarAvatar && (continuacion ? <span className="chat-sin-avatar" /> : <Avatar usuario={persona} tamano={34} />)}
                <div className="chat-cuerpo">
                  {!propio && !privado && !continuacion && <b className="chat-autor">{persona.nombre}{persona.rol_nombre && !compacto && <small> · {persona.rol_nombre}</small>}</b>}
                  <div className={mensaje.eliminado ? 'chat-burbuja eliminado' : 'chat-burbuja'}>
                    {mensaje.eliminado ? 'Mensaje eliminado' : conMenciones(mensaje.texto, mensaje.menciones ?? [], equipoCompleto)}
                    <small className="chat-hora" title={formato.fechaCompleta(mensaje.fecha)}>
                      {formato.hora(mensaje.fecha)}
                      {propio && !mensaje.eliminado && estadoDe(mensaje) && (
                        <button className="chat-cheques" onClick={() => (privado ? setInfoDe(mensaje) : setDesplegado(desplegado === mensaje.id ? null : mensaje.id))} aria-label="Ver la información del mensaje" title="Ver quién lo recibió y lo leyó">
                          <Cheques estado={estadoDe(mensaje)} preferencias={preferencias} />
                        </button>
                      )}
                    </small>
                    {!mensaje.eliminado && !conAcciones && (propio || (esAdmin && !privado)) && (
                      <button className="chat-borrar" onClick={() => setBorrando(mensaje)} aria-label="Borrar mensaje" title="Borrar mensaje"><Icono nombre="basura" tamano={14} /></button>
                    )}
                  </div>
                  {/* Chats privados: la línea «Entregado 07:01 · Leído 07:05» (se puede tocar para ver el detalle). */}
                  {propio && !mensaje.eliminado && privado && estadoDe(mensaje) && preferencias.chequesDetalle !== false && (
                    <button className="chat-detalle" onClick={() => setInfoDe(mensaje)} title="Ver la información del mensaje">{detalleDe(mensaje)}</button>
                  )}
                </div>
                {conAcciones && (
                  // Sala del equipo, detrás (a la derecha) de tus mensajes: ⓘ (siempre visible) despliega quién lo vio; el bote de basura aparece al pasar el mouse.
                  <div className="chat-acciones">
                    <button className={desplegado === mensaje.id ? 'chat-info abierto' : 'chat-info'} onClick={() => setDesplegado(desplegado === mensaje.id ? null : mensaje.id)}
                      aria-label="Ver quién lo vio" aria-expanded={desplegado === mensaje.id} title="Ver quién lo vio"><Icono nombre="info" tamano={15} /></button>
                    <button className="chat-borrar-lado" onClick={() => setBorrando(mensaje)} aria-label="Borrar mensaje" title="Borrar mensaje"><Icono nombre="basura" tamano={14} /></button>
                  </div>
                )}
              </div>
              {/* El desplegable va debajo de la fila (no dentro), para que el botón ⓘ se quede junto al mensaje. */}
              {desplegado === mensaje.id && conAcciones && (
                <div className="chat-desplegable-fila">
                  <InfoDesplegable mensaje={mensaje} personas={equipoCompleto} preferencias={preferencias} alCerrar={() => setDesplegado(null)} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hayNuevosAbajo && (
        <button className="chat-nuevos" onClick={() => { bajarAlFinal.current = true; setMensajes((actuales) => [...actuales]) }}>↓ Mensajes nuevos</button>
      )}

      {menu && opciones.length > 0 && (
        <ul className="chat-menciones" role="listbox" aria-label="Elige a quién mencionar">
          <li className="chat-menciones-titulo">Mencionar a…</li>
          {opciones.map((persona, posicion) => (
            <li key={persona.id} role="option" aria-selected={posicion === menu.indice}>
              <button type="button" className={posicion === menu.indice ? 'activa' : ''} onMouseDown={(evento) => { evento.preventDefault(); elegirMencion(persona) }}
                onMouseEnter={() => setMenu({ ...menu, indice: posicion })}>
                <Avatar usuario={persona} tamano={26} />
                <span><b>{persona.nombre}</b><small>{persona.rol_nombre}</small></span>
                {formato.ultimaConexion(persona.ultima_conexion).enLinea && <i title="En línea" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="chat-escribir" onSubmit={(evento) => { evento.preventDefault(); enviar() }}>
        <textarea ref={caja} value={texto} onChange={cambioElTexto} onKeyDown={alPresionarTecla} onBlur={() => setMenu(null)}
          rows={compacto ? 1 : 2} maxLength={LARGO_MAXIMO} placeholder={compacto ? (privado ? 'Escribe un mensaje…' : 'Escribe… (@ para mencionar)') : (privado ? 'Escribe un mensaje… (Enter envía · Shift + Enter, otra línea)' : 'Escribe un mensaje… (@ para mencionar a alguien · Enter envía)')} aria-label="Mensaje" autoFocus />
        <div>
          {!compacto && <small className={texto.length > LARGO_MAXIMO - 50 ? 'chat-contador casi' : 'chat-contador'}>{texto.length}/{LARGO_MAXIMO}</small>}
          <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar"><Icono nombre="enviar" tamano={15} className={compacto ? '' : 'antes'} />{compacto ? '' : enviando ? 'Enviando…' : 'Enviar'}</button>
        </div>
      </form>
      {errorAlEnviar && <p className="form-error chat-error" role="alert">{errorAlEnviar}</p>}

      {infoDe && (
        <Ventana alCerrar={() => setInfoDe(null)}>
          <InfoDelMensaje mensaje={infoDe} personas={equipoCompleto} preferencias={preferencias} alCerrar={() => setInfoDe(null)} />
        </Ventana>
      )}

      {borrando && (
        <Alerta icono="pregunta" titulo="¿Borrar este mensaje?" textoAceptar="Sí, borrar" textoCancelar="Cancelar" alAceptar={borrar} alCancelar={() => setBorrando(null)}>
          <p>{privado ? 'Desaparecerá para las dos personas y quedará como «Mensaje eliminado».' : 'Desaparecerá para todo el equipo y quedará como «Mensaje eliminado».'}</p>
        </Alerta>
      )}
    </div>
  )
}
