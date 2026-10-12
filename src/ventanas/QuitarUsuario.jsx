// ─────────────────────────────────────────────────────────────
// VENTANA: QUITAR A ALGUIEN DEL EQUIPO (solo administrador)
// ─────────────────────────────────────────────────────────────
// Se abre al pulsar "Desactivar" o "Eliminar" en la pantalla Usuarios.
// Da a elegir entre:
//   ⏸ Desactivar → no puede entrar, pero se puede volver a activar después.
//   🗑 Eliminar   → desaparece de la lista para siempre. Pide confirmar otra vez.
// (Si la persona ya está desactivada, solo se ofrece "Eliminar").

import { useState } from 'react'
import Icono from '../componentes/Icono.jsx'

export default function QuitarUsuario({ persona, alDesactivar, alEliminar }) {
  const [confirmando, setConfirmando] = useState(false) // true = preguntando "¿seguro?"
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  // Hace la acción elegida; si el servidor la rechaza, muestra el motivo en rojo.
  const hacer = async (accion) => {
    setOcupado(true)
    setError('')
    try {
      await accion(persona)
    } catch (problema) {
      setError(problema.message)
      setOcupado(false)
    }
  }

  const ventas = persona.ventas === 1 ? '1 venta' : `${persona.ventas} ventas`

  return (
    <>
      <h2>{persona.activo ? `¿Qué hacemos con ${persona.nombre}?` : `Eliminar a ${persona.nombre}`}</h2>
      <p>Usuario <b>{persona.usuario}</b> · {persona.rol_nombre} · {ventas} registrada{persona.ventas === 1 ? '' : 's'}</p>

      {!confirmando ? (
        <div className="opciones-quitar">
          {persona.activo ? (
            <button className="opcion" onClick={() => hacer(alDesactivar)} disabled={ocupado}>
              <b><Icono nombre="pausa" tamano={15} className="antes" />Desactivar</b>
              <small>No podrá entrar a FerreStock. Puedes volver a activarlo cuando quieras.</small>
            </button>
          ) : null}
          <button className="opcion peligro" onClick={() => setConfirmando(true)} disabled={ocupado}>
            <b><Icono nombre="basura" tamano={15} className="antes" />Eliminar</b>
            <small>
              Se borra de la lista para siempre y no podrá entrar.
              {persona.ventas === 1 && ' Su venta y su factura se conservan con su nombre.'}
              {persona.ventas > 1 && ` Sus ${ventas} y facturas se conservan con su nombre.`}
            </small>
          </button>
        </div>
      ) : (
        <div className="confirmar-eliminar">
          <p><Icono nombre="alerta" tamano={16} className="antes" />Esto <b>no se puede deshacer</b>. ¿Seguro que quieres eliminar a {persona.nombre}?</p>
          <div className="botones-confirmar">
            <button className="peligro" onClick={() => hacer(alEliminar)} disabled={ocupado}>
              {ocupado ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
            {/* El cursor empieza aquí: si alguien pulsa Enter sin querer, no se borra nada */}
            <button className="secundario" onClick={() => setConfirmando(false)} disabled={ocupado} autoFocus>No, volver</button>
          </div>
        </div>
      )}

      {error && <p className="form-error quitar-error" role="alert">{error}</p>}
    </>
  )
}
