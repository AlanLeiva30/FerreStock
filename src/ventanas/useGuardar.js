// Ayuda común de los formularios: al pulsar "Guardar", muestra "Guardando…"
// mientras espera y, si el servidor rechaza los datos, muestra el mensaje de error
// en rojo sin cerrar la ventana (así no se pierde lo que se escribió).

import { useState } from 'react'

export function useGuardar(alGuardar) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const enviar = async (evento, ...datos) => {
    evento.preventDefault() // evita que el navegador recargue la página al enviar el formulario
    setGuardando(true)
    setError('')
    try {
      await alGuardar(...datos)
    } catch (problema) {
      setError(problema.message)
      setGuardando(false)
    }
  }

  return { error, guardando, enviar }
}
