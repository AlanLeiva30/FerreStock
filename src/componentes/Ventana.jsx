// Ventana emergente: aparece encima de la pantalla con un fondo oscuro detrás.
// Se cierra con la ×, con la tecla Escape o haciendo clic fuera de ella.
// Lo que va adentro (el formulario) se pone entre <Ventana> y </Ventana>.
// Con la opción "ancha" la ventana es más grande (la usan los ajustes de cuenta); con ancha="grande", todavía más
// (la usa "Editar usuario", que lleva la foto al costado).

import { useEffect } from 'react'

export default function Ventana({ alCerrar, ancha = false, children }) {
  useEffect(() => {
    const alPresionarTecla = (evento) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [alCerrar])

  return (
    <div className="overlay" onMouseDown={(evento) => evento.target === evento.currentTarget && alCerrar()}>
      <section className={ancha === 'grande' ? 'modal ancha grande' : ancha ? 'modal ancha' : 'modal'} role="dialog" aria-modal="true">
        <button className="close" onClick={alCerrar} aria-label="Cerrar">×</button>
        {children}
      </section>
    </div>
  )
}
