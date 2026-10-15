// ─────────────────────────────────────────────────────────────
// PANTALLA: EQUIPO (vendedores y trabajadores de almacén)
// ─────────────────────────────────────────────────────────────
// Muestra a las personas del equipo con su rol y cuándo se conectaron por última vez:
// «En línea» (usó el programa en los últimos 5 minutos), «hace 12 min», «ayer, 03:15 p. m.»…
// Solo se ve el nombre, el rol, la foto y la hora de conexión; no hay usuarios, contraseñas ni ventas.
// El administrador ve lo mismo (y más) en la pantalla Usuarios y Roles.
// La lista se vuelve a pedir sola cada minuto y también al pulsar «Actualizar».

import { useCallback, useEffect, useState } from 'react'
import Avatar from '../componentes/Avatar.jsx'
import Icono from '../componentes/Icono.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'

const CADA_CUANTO_SE_ACTUALIZA = 60_000 // 1 minuto

export default function Equipo({ usuario }) {
  const [equipo, setEquipo] = useState(null) // null = cargando
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false) // true mientras se pide la lista (el botón gira)
  const [actualizadoA, setActualizadoA] = useState(null) //  cuándo se actualizó por última vez

  const cargar = useCallback(async () => {
    setActualizando(true)
    try {
      // Se espera un instante (0,4 s) para que se alcance a ver que el botón trabajó, aunque el servidor conteste rápido.
      const [lista] = await Promise.all([servidor.listarEquipo(), new Promise((listo) => setTimeout(listo, 400))])
      setEquipo(lista)
      setActualizadoA(new Date())
      setError('')
    } catch (problema) {
      setError(problema.message)
    } finally {
      setActualizando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const reloj = setInterval(cargar, CADA_CUANTO_SE_ACTUALIZA)
    return () => clearInterval(reloj)
  }, [cargar])

  const personas = (equipo ?? []).map((persona) => ({ ...persona, conexion: formato.ultimaConexion(persona.ultima_conexion) }))
  const enLinea = personas.filter((persona) => persona.conexion.enLinea).length

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="usuarios" className="antes" />Equipo ({personas.length})</h2>
        <div className="toolbar">
          <span className="equipo-resumen">{enLinea} en línea ahora</span>
          {actualizadoA && <small className="equipo-hora">Actualizado a las {formato.hora(actualizadoA)}</small>}
          <button onClick={cargar} disabled={actualizando} aria-label="Actualizar la lista del equipo">
            <Icono nombre="refrescar" tamano={15} className={actualizando ? 'antes girando' : 'antes'} />{actualizando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && <div className="load-error db-error">{error}</div>}
      {!equipo && !error && <p className="grafica-mensaje">Cargando el equipo…</p>}

      <div className="equipo-lista">
        {personas.map((persona) => (
          <article key={persona.id} className={persona.conexion.enLinea ? 'equipo-persona en-linea' : 'equipo-persona'}>
            <Avatar usuario={persona} tamano={52} />
            <div>
              <b>{persona.nombre}{persona.id === usuario.id && <span className="muted"> (tú)</span>}</b>
              <small>{persona.rol_nombre}</small>
              <span className={persona.conexion.enLinea ? 'conexion en-linea' : 'conexion'}
                title={persona.ultima_conexion ? formato.fechaCompleta(persona.ultima_conexion) : 'Todavía no ha entrado desde que se lleva este registro'}>
                <i aria-hidden="true" />{persona.conexion.texto}
              </span>
            </div>
          </article>
        ))}
      </div>
      <p className="equipo-nota">«En línea» significa que usó el programa en los últimos 5 minutos. Se actualiza solo cada minuto, o cuando pulsas «Actualizar».</p>
    </section>
  )
}
