// ─────────────────────────────────────────────────────────────
// VENTANA: NUEVO USUARIO / EDITAR USUARIO (solo administrador)
// ─────────────────────────────────────────────────────────────
// Si recibe un "usuarioAEditar", sirve para editarlo; si no, para crear uno nuevo.
// "roles" es la lista de roles que se pueden asignar (viene de la base de datos).
// Al editar, la contraseña es opcional: si se deja vacía, no cambia.
// El botón de ojo de cada contraseña muestra lo que se escribió.

import { useState } from 'react'
import CampoClave from '../componentes/CampoClave.jsx'
import { useGuardar } from './useGuardar.js'
import Icono from '../componentes/Icono.jsx'

export default function FormularioUsuario({ usuarioAEditar, roles, alGuardar }) {
  const esNuevo = !usuarioAEditar
  const [nombre, setNombre] = useState(usuarioAEditar?.nombre ?? '')
  const [usuario, setUsuario] = useState(usuarioAEditar?.usuario ?? '')
  const [rol, setRol] = useState(usuarioAEditar?.rol ?? 'vendedor')
  const [clave, setClave] = useState('')
  const [repetirClave, setRepetirClave] = useState('')
  const [diferentes, setDiferentes] = useState(false)
  const { error, guardando, enviar } = useGuardar(alGuardar)

  const rolElegido = roles.find((opcion) => opcion.clave === rol)

  const guardar = (evento) => {
    if (clave !== repetirClave) {
      evento.preventDefault()
      setDiferentes(true)
      return
    }
    setDiferentes(false)
    const datos = { nombre, usuario, rol }
    if (clave) datos.clave = clave // solo se envía si se escribió una
    enviar(evento, datos, usuarioAEditar?.id)
  }

  return (
    <>
      <h2>{esNuevo ? 'Nuevo usuario' : `Editar a ${usuarioAEditar.nombre}`}</h2>
      <p>El <b>rol</b> decide qué pantallas verá y qué podrá hacer en FerreStock.</p>

      <form onSubmit={guardar}>
        <label>Nombre completo
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. María López" required maxLength="60" autoFocus />
        </label>
        <div className="form-row">
          <label>Usuario (para entrar)
            <input value={usuario} onChange={(evento) => setUsuario(evento.target.value)} placeholder="Ej. maria" required
              autoCapitalize="none" spellCheck="false" autoComplete="off" />
          </label>
          <label>Rol
            <select value={rol} onChange={(evento) => setRol(evento.target.value)}>
              {roles.map((opcion) => <option key={opcion.clave} value={opcion.clave}>{opcion.nombre}</option>)}
            </select>
          </label>
        </div>
        {rolElegido && <p className="form-hint"><Icono nombre="check" tamano={14} className="antes" />{rolElegido.descripcion}</p>}

        <div className="form-row">
          <label>{esNuevo ? 'Contraseña' : 'Nueva contraseña'}
            <CampoClave valor={clave} alCambiar={setClave} required={esNuevo}
              placeholder={esNuevo ? 'Mínimo 4 caracteres' : 'Vacía = no cambiar'} autoComplete="new-password" />
          </label>
          <label>Repetir contraseña
            <CampoClave valor={repetirClave} alCambiar={setRepetirClave} required={esNuevo || !!clave} autoComplete="new-password" />
          </label>
        </div>

        {diferentes && <p className="form-error" role="alert">Las dos contraseñas no son iguales</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}</button>
      </form>
    </>
  )
}
