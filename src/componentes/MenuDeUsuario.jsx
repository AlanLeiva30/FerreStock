// MENÚ DE USUARIO (arriba a la derecha)
// Al pulsar el nombre se abre un menú con: cambiar foto de perfil, ajustes de la cuenta
// y cerrar sesión. Lo ven todos los roles; cada persona solo cambia lo suyo.
//
//   alAjustes → abre la ventana "Ajustes de mi cuenta" (la abre Sistema.jsx)
//   alSalir   → pregunta "¿Seguro que quieres cerrar sesión?" (también en Sistema.jsx)
//   avisar    → muestra el aviso verde de abajo a la derecha
//   actualizarSesion → vuelve a pedir los datos de la persona (para ver la foto nueva)

import { useEffect, useRef, useState } from 'react'
import { reducirFoto } from '../utilidades/foto.js'
import { servidor } from '../utilidades/servidor.js'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'

export default function MenuDeUsuario({ usuario, alAjustes, alSalir, avisar, actualizarSesion }) {
  const [abierto, setAbierto] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const raiz = useRef(null)
  const selector = useRef(null)

  // Se cierra al hacer clic fuera o al pulsar Escape.
  useEffect(() => {
    if (!abierto) return
    const alHacerClic = (evento) => !raiz.current?.contains(evento.target) && setAbierto(false)
    const alPresionar = (evento) => evento.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', alHacerClic)
    window.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      window.removeEventListener('keydown', alPresionar)
    }
  }, [abierto])

  const elegirArchivo = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite elegir la misma imagen otra vez
    if (!archivo) return
    setSubiendo(true)
    try {
      await servidor.guardarPerfil({ foto: await reducirFoto(archivo) })
      await actualizarSesion()
      avisar('Foto de perfil actualizada')
    } catch (error) {
      avisar(`Error: ${error.message}`)
    } finally {
      setSubiendo(false)
    }
  }

  const elegir = (accion) => () => { setAbierto(false); accion() }

  return (
    <div className="menu-usuario" ref={raiz}>
      <button className="user" onClick={() => setAbierto(!abierto)} aria-haspopup="menu" aria-expanded={abierto}
        title={`Usuario: ${usuario.usuario}`} aria-label={`Menú de ${usuario.nombre}`}>
        <Avatar usuario={usuario} tamano={28} />
        <span className="user-datos"><b>{usuario.nombre}</b><small>{usuario.rol_nombre}</small></span>
        <Icono nombre="chevron" tamano={15} className={abierto ? 'user-flecha abierta' : 'user-flecha'} />
      </button>

      {abierto && (
        <div className="menu-usuario-panel" role="menu">
          <div className="menu-usuario-cabecera">
            <Avatar usuario={usuario} tamano={52} />
            <div>
              <b>{usuario.nombre}</b>
              <small>@{usuario.usuario}</small>
              <em>{usuario.rol_nombre}</em>
            </div>
          </div>
          <button role="menuitem" onClick={elegir(() => selector.current?.click())} disabled={subiendo}>
            <Icono nombre="camara" tamano={17} className="antes" />{subiendo ? 'Subiendo foto…' : 'Cambiar foto de perfil'}
          </button>
          <button role="menuitem" onClick={elegir(alAjustes)}>
            <Icono nombre="ajustes" tamano={17} className="antes" />Ajustes de mi cuenta
          </button>
          <hr />
          <button role="menuitem" className="peligro" onClick={elegir(alSalir)}>
            <Icono nombre="salir" tamano={17} className="antes" />Cerrar sesión
          </button>
        </div>
      )}

      <input ref={selector} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={elegirArchivo} />
    </div>
  )
}
