// ─────────────────────────────────────────────────────────────
// VENTANA: DATOS DE LA FACTURA (solo administrador)
// ─────────────────────────────────────────────────────────────
// Nombre de la ferretería, dirección, teléfono, NIT/NRC y el mensaje de abajo.
// Salen en todas las facturas, también al reimprimir las anteriores.

import { useEffect, useState } from 'react'
import { servidor } from '../utilidades/servidor.js'
import { useGuardar } from './useGuardar.js'

export default function FormularioNegocio({ alGuardar }) {
  const [datos, setDatos] = useState(null) // null = todavía cargando
  const [errorDeCarga, setErrorDeCarga] = useState('')
  const { error, guardando, enviar } = useGuardar(alGuardar)

  // Traer los datos que ya están guardados.
  useEffect(() => {
    servidor.datosDelNegocio().then(setDatos).catch((problema) => setErrorDeCarga(problema.message))
  }, [])

  // Cambia un solo dato y deja los demás como estaban.
  const cambiar = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value })

  return (
    <>
      <h2>Datos de la factura</h2>
      <p>Lo que escribas aquí sale arriba y abajo de cada factura.</p>

      {errorDeCarga && <p className="form-error" role="alert">{errorDeCarga}</p>}
      {!datos && !errorDeCarga && <p className="muted">Cargando…</p>}

      {datos && (
        <form onSubmit={(evento) => enviar(evento, datos)}>
          <label>Nombre del negocio
            <input value={datos.nombre} onChange={cambiar('nombre')} required maxLength="80" autoFocus />
          </label>
          <label>Dirección
            <input value={datos.direccion} onChange={cambiar('direccion')} maxLength="150" placeholder="Ej. Av. Principal #12, San Salvador" />
          </label>
          <div className="form-row">
            <label>Teléfono
              <input value={datos.telefono} onChange={cambiar('telefono')} maxLength="40" placeholder="Ej. 2222-3333" />
            </label>
            <label>NIT / NRC
              <input value={datos.documento} onChange={cambiar('documento')} maxLength="60" placeholder="Ej. NIT 0614-…" />
            </label>
          </div>
          <label>Mensaje al pie
            <input value={datos.mensaje} onChange={cambiar('mensaje')} maxLength="150" placeholder="Ej. ¡Gracias por su compra!" />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar datos'}</button>
        </form>
      )}
    </>
  )
}
