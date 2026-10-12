// ─────────────────────────────────────────────────────────────
// PANTALLA: INGRESO (usuario y contraseña)
// ─────────────────────────────────────────────────────────────
// Es lo primero que se ve al abrir FerreStock:
//
//   ┌───────────────────────────┬────────────────────────────────┐
//   │ ⬡ FerreStock              │ ☀️ Buenos días · miércoles…  ☾ │
//   │   Ferretería Medrano      │                                │
//   │                           │ ¡Hola de nuevo! 👋              │
//   │ Tu ferretería, en orden.  │ 👤 [ usuario             ]      │
//   │                           │ 🔒 [ contraseña        👁 ]      │
//   │ 📦 Inventario al día       │ [          Entrar →          ] │
//   │ 🧾 Vende y factura         │ ¿Olvidaste tu contraseña? …    │
//   │ 👥 Todo tu equipo          │                                │
//   └───────────────────────────┴────────────────────────────────┘
//
// Tiene dos modos:
//   - Configuración inicial: la primera vez que se abre FerreStock no hay
//     ningún usuario, así que se pide crear el ADMINISTRADOR.
//   - Iniciar sesión: el resto de las veces.
//
// En celulares, el panel de la izquierda se hace pequeño y pasa arriba.
// Los textos de la izquierda se cambian en la lista VENTAJAS.

import { useState } from 'react'
import CampoClave from '../componentes/CampoClave.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import Icono from '../componentes/Icono.jsx'

// Lo que se muestra en el panel de la izquierda.
const VENTAJAS = [
  { icono: 'caja', titulo: 'Inventario al día', texto: 'Sabe cuánto hay de cada producto y qué hace falta.' },
  { icono: 'factura', titulo: 'Vende y factura', texto: 'Cobra, da el cambio e imprime la factura al momento.' },
  { icono: 'usuarios', titulo: 'Todo tu equipo', texto: 'Cada quien entra con su usuario y ve lo que le toca.' },
]

const ICONO_DEL_SALUDO = { 'Buenos días': 'sol', 'Buenas tardes': 'solYNube', 'Buenas noches': 'luna' }

export default function Ingreso({ necesitaConfiguracion, errorDeConexion, alEntrar, alReintentar, tema, cambiarTema }) {
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [repetirClave, setRepetirClave] = useState('')
  const [error, setError] = useState('')
  const [intentos, setIntentos] = useState(0) //         cuenta los errores, para que el aviso rojo "tiemble" cada vez
  const [enviando, setEnviando] = useState(false)
  const [mayusculas, setMayusculas] = useState(false) // ¿está activado Bloq Mayús?

  const mostrarError = (mensaje) => {
    setError(mensaje)
    setIntentos((anterior) => anterior + 1)
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    if (necesitaConfiguracion && clave !== repetirClave) return mostrarError('Las dos contraseñas no son iguales')
    setEnviando(true)
    setError('')
    try {
      const usuarioQueEntra = necesitaConfiguracion
        ? await servidor.crearPrimerAdministrador({ nombre, usuario, clave })
        : await servidor.iniciarSesion(usuario, clave)
      alEntrar(usuarioQueEntra)
    } catch (problema) {
      mostrarError(problema.message)
      setEnviando(false)
    }
  }

  // Al escribir la contraseña se revisa si Bloq Mayús está activado (un error muy común).
  const revisarMayusculas = (evento) => setMayusculas(evento.getModifierState?.('CapsLock') ?? false)

  const saludo = formato.saludo()

  return (
    <div className="ingreso">
      <div className="ingreso-contenedor">
        {/* ── Izquierda: la marca y lo que hace FerreStock ── */}
        <div className="ingreso-panel">
          <div className="ingreso-marca">
            <div className="ingreso-logo" aria-hidden="true"><Icono nombre="llaveInglesa" tamano={30} /></div>
            <div><b>FerreStock</b><small>Ferretería Medrano</small></div>
          </div>

          <div className="ingreso-lema">
            <h2>Tu ferretería, <span>en orden.</span></h2>
            <p>Inventario, ventas y equipo en un solo lugar.</p>
          </div>

          <ul className="ingreso-ventajas">
            {VENTAJAS.map((ventaja) => (
              <li key={ventaja.titulo}>
                <span aria-hidden="true"><Icono nombre={ventaja.icono} tamano={22} /></span>
                <div><b>{ventaja.titulo}</b><small>{ventaja.texto}</small></div>
              </li>
            ))}
          </ul>

          <small className="ingreso-pie"><Icono nombre="candado" tamano={13} className="antes" />Tus datos se guardan de forma segura en la nube</small>
        </div>

        {/* ── Derecha: el formulario ── */}
        <form className="ingreso-tarjeta" onSubmit={enviar}>
          <div className="ingreso-arriba">
            <span className="ingreso-saludo"><Icono nombre={ICONO_DEL_SALUDO[saludo]} tamano={16} className="antes" />{saludo} · {formato.hoy()}</span>
            <button type="button" className="ingreso-tema" onClick={cambiarTema}
              aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <Icono nombre={tema === 'dark' ? 'sol' : 'luna'} tamano={18} />
            </button>
          </div>

          {errorDeConexion ? (
            <div className="ingreso-sin-conexion">
              <div className="ingreso-icono-grande" aria-hidden="true"><Icono nombre="enchufe" tamano={46} /></div>
              <h1>No hay conexión</h1>
              <p className="ingreso-texto">
                No se pudo conectar con FerreStock. Revisa que el programa esté abierto
                (<b>npm run dev</b>) y vuelve a intentarlo.
              </p>
              <small className="ingreso-detalle">Detalle: {errorDeConexion}</small>
              <button type="button" className="ingreso-entrar" onClick={alReintentar}>↻ Reintentar</button>
            </div>
          ) : (
            <>
              <div>
                <h1>{necesitaConfiguracion ? '¡Empecemos!' : '¡Hola de nuevo!'}</h1>
                <p className="ingreso-texto">
                  {necesitaConfiguracion
                    ? 'Es la primera vez que se abre FerreStock. Crea tu usuario de administrador: podrás hacer todo y crear las cuentas de tu equipo.'
                    : 'Ingresa con tu usuario y contraseña para continuar.'}
                </p>
              </div>

              {/* Cada casilla lleva un ícono a la izquierda (solo decorativo) */}
              {necesitaConfiguracion && (
                <label>Nombre completo
                  <span className="campo-con-icono">
                    <span className="icono-campo" aria-hidden="true"><Icono nombre="tarjetaDeNombre" tamano={17} /></span>
                    <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. Carlos Medrano" required autoFocus maxLength="60" />
                  </span>
                </label>
              )}
              <label>Usuario
                <span className="campo-con-icono">
                  <span className="icono-campo" aria-hidden="true"><Icono nombre="usuario" tamano={17} /></span>
                  <input value={usuario} onChange={(evento) => setUsuario(evento.target.value)} placeholder={necesitaConfiguracion ? 'Ej. admin (sin espacios)' : 'Tu usuario'}
                    required autoFocus={!necesitaConfiguracion} autoComplete="username" autoCapitalize="none" spellCheck="false" />
                </span>
              </label>
              {/* El botón 👁 dentro de la casilla muestra u oculta la contraseña. */}
              <label>Contraseña
                <span className="campo-con-icono">
                  <span className="icono-campo" aria-hidden="true"><Icono nombre="candado" tamano={17} /></span>
                  <CampoClave valor={clave} alCambiar={setClave} required onKeyDown={revisarMayusculas} onKeyUp={revisarMayusculas}
                    autoComplete={necesitaConfiguracion ? 'new-password' : 'current-password'} placeholder={necesitaConfiguracion ? 'Mínimo 4 caracteres' : 'Tu contraseña'} />
                </span>
              </label>
              {necesitaConfiguracion && (
                <label>Repetir contraseña
                  <span className="campo-con-icono">
                    <span className="icono-campo" aria-hidden="true"><Icono nombre="candado" tamano={17} /></span>
                    <CampoClave valor={repetirClave} alCambiar={setRepetirClave} required onKeyDown={revisarMayusculas} onKeyUp={revisarMayusculas}
                      autoComplete="new-password" placeholder="Escríbela otra vez" />
                  </span>
                </label>
              )}

              {mayusculas && <p className="ingreso-aviso">⇪ Bloq Mayús está activado</p>}
              {error && <p key={intentos} className="ingreso-error" role="alert"><Icono nombre="alerta" tamano={16} className="antes" />{error}</p>}

              <button type="submit" className="ingreso-entrar" disabled={enviando}>
                {enviando
                  ? <><span className="girando" aria-hidden="true" /> Un momento…</>
                  : necesitaConfiguracion ? 'Crear administrador y entrar →' : 'Entrar →'}
              </button>

              {!necesitaConfiguracion && (
                <p className="ingreso-ayuda">¿Olvidaste tu contraseña? Pídele a un administrador que te ponga una nueva.</p>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  )
}
