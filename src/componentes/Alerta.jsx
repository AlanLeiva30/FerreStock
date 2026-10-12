// Aviso grande en el centro de la pantalla, al estilo "SweetAlert":
// un ícono animado, un título, un texto y uno o dos botones.
//
//   <Alerta icono="pregunta" titulo="¿Seguro?" textoAceptar="Sí" textoCancelar="No"
//     alAceptar={…} alCancelar={…}>
//     <p>Texto que va debajo del título</p>
//   </Alerta>
//
//   icono            → 'pregunta' (signo ? naranja), 'saludo' (martillo que se balancea) o 'stock' (triángulo de alerta)
//   textoCancelar    → si no se pone, solo hay un botón
//   cerrarEnSegundos → si se pone, se cierra sola (con una barrita que se va acortando)
//
// La tecla Escape o un clic fuera del aviso cuentan como "Cancelar".

import { useEffect, useId, useRef, useState } from 'react'
import Icono from './Icono.jsx'

const ICONOS = {
  pregunta: '?',
  saludo: <Icono nombre="martillo" tamano={44} />,
  stock: <Icono nombre="alerta" tamano={42} />,
}

export default function Alerta({ icono, titulo, textoAceptar = 'Aceptar', textoCancelar, cerrarEnSegundos, alAceptar, alCancelar, children }) {
  const idDelTitulo = useId()
  const [ocupado, setOcupado] = useState(false) // evita que se pulse dos veces

  const aceptar = () => {
    if (ocupado) return
    setOcupado(true)
    alAceptar()
  }
  const cancelar = alCancelar ?? aceptar // con un solo botón, cerrar es lo mismo que aceptar

  // Se guarda la versión más reciente de "aceptar" y "cancelar" para usarlas desde
  // el reloj y el teclado (sin tener que volver a ponerlos cada vez que la pantalla cambia).
  const acciones = useRef({ aceptar, cancelar })
  useEffect(() => { acciones.current = { aceptar, cancelar } })

  // Tecla Escape = Cancelar.
  useEffect(() => {
    const alPresionarTecla = (evento) => evento.key === 'Escape' && acciones.current.cancelar()
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [])

  // Cerrarse sola después de unos segundos (si se pidió).
  useEffect(() => {
    if (!cerrarEnSegundos) return
    const reloj = setTimeout(() => acciones.current.aceptar(), cerrarEnSegundos * 1000)
    return () => clearTimeout(reloj)
  }, [cerrarEnSegundos])

  return (
    <div className="alerta-fondo" onMouseDown={(evento) => evento.target === evento.currentTarget && cancelar()}>
      <section className="alerta" role="alertdialog" aria-modal="true" aria-labelledby={idDelTitulo}>
        <div className={`alerta-icono ${icono}`} aria-hidden="true"><span>{ICONOS[icono]}</span></div>
        <h2 id={idDelTitulo}>{titulo}</h2>
        {children}

        <div className="alerta-botones">
          <button className="aceptar" onClick={aceptar} disabled={ocupado} autoFocus>{textoAceptar}</button>
          {textoCancelar && <button className="cancelar" onClick={cancelar} disabled={ocupado}>{textoCancelar}</button>}
        </div>

        {cerrarEnSegundos && <div className="alerta-tiempo" style={{ animationDuration: `${cerrarEnSegundos}s` }} />}
      </section>
    </div>
  )
}
