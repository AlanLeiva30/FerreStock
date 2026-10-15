// ─────────────────────────────────────────────────────────────
// LA LISTA DE CONVERSACIONES DEL CHAT
// ─────────────────────────────────────────────────────────────
// Trae del servidor la sala global y a cada persona del equipo con su último mensaje, cuántos mensajes no has leído
// y si está en línea. Se vuelve a pedir sola cada "cadaCuanto" milisegundos (solo con la pestaña a la vista) y cuando
// se llama a cargar(). Lo usan la ventanita flotante y la pantalla «Chat del equipo».
//
//   const { datos, cargar } = useConversaciones(activo, cadaCuanto)
//   datos = { global: { noLeidos, menciones, ultimo }, personas: [{ …persona, noLeidos, ultimo }] }  (null mientras carga)

import { useCallback, useEffect, useState } from 'react'
import { servidor } from './servidor.js'

export function useConversaciones(activo = true, cadaCuanto = 5_000) {
  const [datos, setDatos] = useState(null)
  const cargar = useCallback(async () => {
    try { setDatos(await servidor.conversacionesDelChat(true)) } catch { /* si falla, se vuelve a intentar */ }
  }, [])

  useEffect(() => {
    if (!activo) return
    cargar()
    const reloj = setInterval(() => document.visibilityState === 'visible' && cargar(), cadaCuanto)
    return () => clearInterval(reloj)
  }, [activo, cadaCuanto, cargar])

  return { datos, cargar }
}
