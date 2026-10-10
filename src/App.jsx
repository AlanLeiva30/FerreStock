// ─────────────────────────────────────────────────────────────
// APP: ¿MOSTRAR EL INGRESO O EL PROGRAMA?
// ─────────────────────────────────────────────────────────────
// Al abrir FerreStock se le pregunta al servidor si hay una sesión abierta:
//   - Si no hay ningún usuario todavía → pantalla para crear el administrador.
//   - Si no ha iniciado sesión         → pantalla de ingreso (usuario y contraseña).
//   - Si ya inició sesión              → el programa (Sistema.jsx), con el menú de su rol.
//
// Justo después de escribir usuario y contraseña, el programa saluda ("¡Hola, Alan!").
// Si solo se recarga la página con la sesión ya abierta, no vuelve a saludar.
//
// También maneja el tema (claro u oscuro), para que se vea igual en el ingreso.

import { useCallback, useEffect, useState } from 'react'
import Sistema from './Sistema.jsx'
import Ingreso from './pantallas/Ingreso.jsx'
import { SESION_VENCIDA, servidor } from './utilidades/servidor.js'

export default function App() {
  const [tema, setTema] = useState(leerTemaGuardado) // 'dark' (oscuro) o 'light' (claro)
  const [sesion, setSesion] = useState({ revisando: true, usuario: null, necesitaConfiguracion: false, error: '' })
  const [darBienvenida, setDarBienvenida] = useState(false) // true = acaba de iniciar sesión

  // Aplicar el tema y recordarlo para la próxima vez.
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    guardarTema(tema)
  }, [tema])

  // Preguntar al servidor quién está conectado.
  const revisarSesion = useCallback(async () => {
    try {
      const estado = await servidor.estadoDeSesion()
      setSesion({ revisando: false, usuario: estado.usuario, necesitaConfiguracion: estado.necesitaConfiguracion, error: '' })
    } catch (error) {
      setSesion({ revisando: false, usuario: null, necesitaConfiguracion: false, error: error.message })
    }
  }, [])

  useEffect(() => { revisarSesion() }, [revisarSesion])

  // Si el servidor avisa que la sesión venció (o que el usuario fue desactivado), volver al ingreso.
  useEffect(() => {
    const alVencer = () => setSesion((actual) => ({ ...actual, usuario: null }))
    window.addEventListener(SESION_VENCIDA, alVencer)
    return () => window.removeEventListener(SESION_VENCIDA, alVencer)
  }, [])

  const entrar = (usuario) => {
    setSesion({ revisando: false, usuario, necesitaConfiguracion: false, error: '' })
    setDarBienvenida(true)
  }

  // Se llama después de que la persona confirma "¿Seguro que quieres cerrar sesión?" (en Sistema.jsx).
  const salir = async () => {
    await servidor.cerrarSesion().catch(() => {}) // aunque falle, se sale igual
    setDarBienvenida(false)
    setSesion({ revisando: false, usuario: null, necesitaConfiguracion: false, error: '' })
  }

  const cambiarTema = () => setTema(tema === 'dark' ? 'light' : 'dark')

  // Mientras se pregunta al servidor: el logo "latiendo".
  if (sesion.revisando) {
    return (
      <div className="pantalla-cargando" role="status">
        <div className="ingreso-logo" aria-hidden="true">⬡</div>
        <p>Cargando FerreStock…</p>
      </div>
    )
  }

  if (!sesion.usuario) {
    return (
      <Ingreso necesitaConfiguracion={sesion.necesitaConfiguracion} errorDeConexion={sesion.error} alEntrar={entrar} alReintentar={revisarSesion}
        tema={tema} cambiarTema={cambiarTema} />
    )
  }

  // "key" hace que el programa empiece de cero si entra otra persona o le cambian el rol.
  return (
    <Sistema key={`${sesion.usuario.id}-${sesion.usuario.rol}`} usuario={sesion.usuario}
      tema={tema} cambiarTema={cambiarTema}
      alSalir={salir} actualizarSesion={revisarSesion}
      darBienvenida={darBienvenida} alCerrarBienvenida={() => setDarBienvenida(false)} />
  )
}

// El tema elegido se recuerda en el navegador. Si no se puede leer, se usa el oscuro.
function leerTemaGuardado() {
  try {
    return localStorage.getItem('ferrestock-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

function guardarTema(tema) {
  try {
    localStorage.setItem('ferrestock-theme', tema)
  } catch {
    // El navegador no permite guardar: no pasa nada, solo no se recordará.
  }
}
