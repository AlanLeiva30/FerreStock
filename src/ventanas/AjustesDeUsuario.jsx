// VENTANA: AJUSTES DE MI CUENTA (todos los roles)
// Cada persona personaliza SU cuenta: foto, tema, menú, pantalla de inicio, bienvenida
// y contraseña. Los ajustes se guardan en la base de datos, así que la acompañan
// en cualquier computadora donde inicie sesión. No cambian lo que ven las demás personas.
//
// Cada ajuste se guarda al instante, sin botón "Guardar" (menos la contraseña).
//   menu             → las pantallas que su rol puede ver: [{ id, titulo }]
//   fijarTema        → cambia el tema y lo guarda (viene de App.jsx)
//   actualizarSesion → vuelve a pedir los datos de la persona para ver los cambios

import { useRef, useState } from 'react'
import Avatar from '../componentes/Avatar.jsx'
import CampoClave from '../componentes/CampoClave.jsx'
import Icono from '../componentes/Icono.jsx'
import { reducirFoto } from '../utilidades/foto.js'
import { servidor } from '../utilidades/servidor.js'

export default function AjustesDeUsuario({ usuario, tema, fijarTema, menu, actualizarSesion, avisar, recibeAvisosDeStock = false }) {
  const preferencias = usuario.preferencias ?? {}
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const selector = useRef(null)

  // Guarda un cambio y refresca los datos de la persona; si falla, muestra el mensaje.
  const guardar = async (cambios, mensaje) => {
    setOcupado(true)
    setError('')
    try {
      await servidor.guardarPerfil(cambios)
      await actualizarSesion()
      if (mensaje) avisar(mensaje)
    } catch (problema) {
      setError(problema.message)
    } finally {
      setOcupado(false)
    }
  }

  const elegirFoto = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    try {
      setError('')
      await guardar({ foto: await reducirFoto(archivo) }, 'Foto de perfil actualizada')
    } catch (problema) {
      setError(problema.message)
    }
  }

  const cambiarPreferencia = (cambio) => guardar({ preferencias: cambio })

  return (
    <>
      <h2>Ajustes de mi cuenta</h2>
      <p>Estos ajustes son solo tuyos: no cambian lo que ven las demás personas.</p>

      <section className="ajustes-perfil">
        <Avatar usuario={usuario} tamano={72} />
        <div>
          <b>{usuario.nombre}</b>
          <small>@{usuario.usuario} · {usuario.rol_nombre}</small>
          <div className="ajustes-botones">
            <button type="button" onClick={() => selector.current?.click()} disabled={ocupado}>
              <Icono nombre="camara" tamano={16} className="antes" />{usuario.foto ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {usuario.foto && <button type="button" className="secundario" onClick={() => guardar({ foto: null }, 'Foto de perfil quitada')} disabled={ocupado}>Quitar foto</button>}
          </div>
        </div>
        <input ref={selector} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={elegirFoto} />
      </section>

      <section className="ajustes-bloque">
        <h3>Apariencia</h3>
        <div className="ajuste-fila">
          <span><b>Tema</b><small>Colores oscuros o claros</small></span>
          <div className="segmentos" role="group" aria-label="Tema">
            <button type="button" aria-pressed={tema === 'dark'} onClick={() => fijarTema('dark')}><Icono nombre="luna" tamano={15} className="antes" />Oscuro</button>
            <button type="button" aria-pressed={tema === 'light'} onClick={() => fijarTema('light')}><Icono nombre="sol" tamano={15} className="antes" />Claro</button>
          </div>
        </div>
        <div className="ajuste-fila">
          <span><b>Menú compacto</b><small>Oculta la descripción de cada opción del menú</small></span>
          <Interruptor activo={!!preferencias.menuCompacto} alCambiar={(valor) => cambiarPreferencia({ menuCompacto: valor })} etiqueta="Menú compacto" />
        </div>
      </section>

      <section className="ajustes-bloque">
        <h3>Al iniciar sesión</h3>
        <div className="ajuste-fila">
          <span><b>Pantalla de inicio</b><small>La que se abre primero al entrar</small></span>
          <select value={preferencias.inicio ?? ''} onChange={(evento) => cambiarPreferencia({ inicio: evento.target.value || null })} aria-label="Pantalla de inicio">
            <option value="">La primera de mi menú</option>
            {menu.map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.titulo}</option>)}
          </select>
        </div>
        <div className="ajuste-fila">
          <span><b>Mostrar la bienvenida</b><small>El aviso con tu nombre al entrar</small></span>
          <Interruptor activo={preferencias.saludo !== false} alCambiar={(valor) => cambiarPreferencia({ saludo: valor })} etiqueta="Mostrar la bienvenida" />
        </div>
        {recibeAvisosDeStock && (
          <div className="ajuste-fila">
            <span><b>Avisarme del stock al entrar</b><small>Una notificación con los productos que se están acabando</small></span>
            <Interruptor activo={preferencias.avisoStock !== false} alCambiar={(valor) => cambiarPreferencia({ avisoStock: valor })} etiqueta="Avisarme del stock al entrar" />
          </div>
        )}
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}

      <CambiarMiClave avisar={avisar} />
    </>
  )
}

// Botón de encendido/apagado.
function Interruptor({ activo, alCambiar, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} className="interruptor" onClick={() => alCambiar(!activo)}>
      <span />
    </button>
  )
}

// Cambiar la contraseña propia: pide la actual para confirmar que es la misma persona.
function CambiarMiClave({ avisar }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    if (nueva !== repetir) return setError('Las dos contraseñas nuevas no son iguales')
    setGuardando(true)
    setError('')
    try {
      await servidor.cambiarMiClave(actual, nueva)
      setActual('')
      setNueva('')
      setRepetir('')
      avisar('Contraseña cambiada. Se cerraron tus otras sesiones.')
    } catch (problema) {
      setError(problema.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="ajustes-bloque">
      <h3>Seguridad</h3>
      <form onSubmit={enviar}>
        <label>Contraseña actual
          <CampoClave valor={actual} alCambiar={setActual} required autoComplete="current-password" />
        </label>
        <div className="form-row">
          <label>Contraseña nueva
            <CampoClave valor={nueva} alCambiar={setNueva} required placeholder="Mínimo 4 caracteres" autoComplete="new-password" />
          </label>
          <label>Repetir la nueva
            <CampoClave valor={repetir} alCambiar={setRepetir} required autoComplete="new-password" />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar mi contraseña'}</button>
      </form>
    </section>
  )
}
