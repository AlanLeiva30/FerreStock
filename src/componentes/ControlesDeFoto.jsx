// CONTROLES DE FOTO DE UN USUARIO (solo administrador)
// La foto de la persona, con los botones para subir/cambiar y quitar. Lo usan la ventana
// "Editar usuario" (al costado del formulario) y la ventana "Foto de…" de la lista de usuarios.
// La imagen se recorta y se reduce aquí mismo (256 × 256 px) antes de enviarse.
// Quitar la foto pide una confirmación (un segundo clic) para no hacerlo sin querer.
//
//   persona   → el usuario del que se ve la foto
//   alCambiar → guarda la foto nueva ('data:image/jpeg;base64,…') o la quita (null); la pone Usuarios.jsx
//   tamano    → tamaño de la foto en px

import { useRef, useState } from 'react'
import { reducirFoto } from '../utilidades/foto.js'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'

export default function ControlesDeFoto({ persona, alCambiar, tamano = 132 }) {
  const [ocupado, setOcupado] = useState(false)
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false)
  const [error, setError] = useState('')
  const selector = useRef(null)

  const guardar = async (obtenerFoto) => {
    setOcupado(true)
    setError('')
    try {
      await alCambiar(await obtenerFoto())
      setConfirmandoQuitar(false)
    } catch (problema) {
      setError(problema.message)
    } finally {
      setOcupado(false)
    }
  }

  const elegirArchivo = (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite elegir la misma imagen otra vez
    if (archivo) guardar(() => reducirFoto(archivo))
  }

  return (
    <div className="controles-de-foto">
      <div className="foto-de-usuario">
        <Avatar usuario={persona} tamano={tamano} />
        <small>@{persona.usuario} · {persona.rol_nombre}</small>
      </div>

      <div className="ajustes-botones foto-de-usuario-botones">
        <button type="button" onClick={() => selector.current?.click()} disabled={ocupado}>
          <Icono nombre="camara" tamano={16} className="antes" />{persona.foto ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {persona.foto && !confirmandoQuitar && (
          <button type="button" className="secundario" onClick={() => setConfirmandoQuitar(true)} disabled={ocupado}>
            <Icono nombre="basura" tamano={15} className="antes" />Quitar foto
          </button>
        )}
        {persona.foto && confirmandoQuitar && (
          <>
            <button type="button" className="peligro" onClick={() => guardar(async () => null)} disabled={ocupado}>
              {ocupado ? 'Quitando…' : `Sí, quitar la foto de ${persona.nombre.split(' ')[0]}`}
            </button>
            <button type="button" className="secundario" onClick={() => setConfirmandoQuitar(false)} disabled={ocupado}>Cancelar</button>
          </>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <input ref={selector} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={elegirArchivo} />
    </div>
  )
}
