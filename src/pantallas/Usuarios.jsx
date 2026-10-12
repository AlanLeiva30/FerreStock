// ─────────────────────────────────────────────────────────────
// PANTALLA: USUARIOS (solo administrador)
// ─────────────────────────────────────────────────────────────
// Lista de las personas que pueden entrar a FerreStock. Desde aquí el
// administrador crea usuarios, les asigna un rol (administrador, vendedor o
// trabajador de almacén), les cambia la contraseña, y los desactiva o elimina.
// "Desactivar" (o "Eliminar", si ya está desactivado) abre una ventana para
// elegir entre las dos cosas (ver ventanas/QuitarUsuario.jsx).
//
// Abajo se muestran los roles y qué puede hacer cada uno (vienen de la tabla
// "roles" de la base de datos; se definen en servidor/acceso/roles.js).

import { useCallback, useEffect, useState } from 'react'
import FilaVacia from '../componentes/FilaVacia.jsx'
import Ventana from '../componentes/Ventana.jsx'
import { formato } from '../utilidades/formato.js'
import { servidor } from '../utilidades/servidor.js'
import FormularioUsuario from '../ventanas/FormularioUsuario.jsx'
import QuitarUsuario from '../ventanas/QuitarUsuario.jsx'
import Icono from '../componentes/Icono.jsx'

// Color de la etiqueta de cada rol (los estilos están en estilos.css, sección 7).
const COLOR_DEL_ROL = { administrador: 'status', vendedor: 'status ok', trabajador: 'status info' }

export default function Usuarios({ usuario: yo, avisar, actualizarSesion }) {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  // Ventana: undefined = cerrada · null = "nuevo usuario" · un usuario = "editar"
  const [editando, setEditando] = useState(undefined)
  const [quitando, setQuitando] = useState(null) // a quién se va a desactivar o eliminar (null = nadie)

  const cargar = useCallback(async () => {
    try {
      const [nuevosUsuarios, nuevosRoles] = await Promise.all([servidor.listarUsuarios(), servidor.listarRoles()])
      setUsuarios(nuevosUsuarios)
      setRoles(nuevosRoles)
      setError('')
    } catch (problema) {
      setError(problema.message)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async (datos, id) => {
    if (id) await servidor.editarUsuario(id, datos)
    else await servidor.crearUsuario(datos)
    setEditando(undefined)
    await cargar()
    avisar(id ? 'Usuario actualizado' : `Usuario "${datos.usuario.trim().toLowerCase()}" creado`)
    if (id === yo.id) await actualizarSesion() // si me edité a mí mismo (nombre o rol)
  }

  const activar = async (persona) => {
    try {
      await servidor.editarUsuario(persona.id, { activo: true })
      await cargar()
      avisar(`${persona.nombre} activado`)
    } catch (problema) {
      setError(problema.message)
    }
  }

  // Lo que puede hacer la ventana "Quitar del equipo". Si el servidor rechaza algo,
  // la ventana muestra el motivo y no se cierra.
  const desactivar = async (persona) => {
    await servidor.editarUsuario(persona.id, { activo: false })
    setQuitando(null)
    await cargar()
    avisar(`${persona.nombre} desactivado`)
  }

  const eliminar = async (persona) => {
    await servidor.eliminarUsuario(persona.id)
    setQuitando(null)
    await cargar()
    avisar(`${persona.nombre} eliminado`)
  }

  return (
    <section className="panel view">
      <div className="panelhead">
        <h2><Icono nombre="usuarios" className="antes" />Usuarios ({usuarios.length})</h2>
        <div className="toolbar">
          <button className="primary" onClick={() => setEditando(null)} disabled={!roles.length}>＋ Nuevo usuario</button>
        </div>
      </div>

      {error && <div className="load-error db-error">{error}</div>}

      <div className="tablewrap">
        <table>
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
          <tbody>
            {usuarios.map((persona) => (
              <tr key={persona.id} className={persona.activo ? '' : 'inactive'}>
                <td>{persona.nombre}{persona.id === yo.id && <span className="muted"> (tú)</span>}</td>
                <td className="yellow">{persona.usuario}</td>
                <td><b className={COLOR_DEL_ROL[persona.rol] ?? 'status off'}>{persona.rol_nombre.toUpperCase()}</b></td>
                <td>{persona.activo ? 'Activo' : <b className="status off">INACTIVO</b>}</td>
                <td className="muted">{formato.fecha(persona.creado)}</td>
                <td className="row-actions">
                  <button onClick={() => setEditando(persona)}>Editar</button>
                  {/* A uno mismo no se le puede desactivar ni eliminar */}
                  {persona.id !== yo.id && (persona.activo ? (
                    <button onClick={() => setQuitando(persona)}>Desactivar</button>
                  ) : (
                    <>
                      <button onClick={() => activar(persona)}>Activar</button>
                      <button className="eliminar" onClick={() => setQuitando(persona)}>Eliminar</button>
                    </>
                  ))}
                </td>
              </tr>
            ))}
            {!usuarios.length && <FilaVacia columnas="6">Cargando usuarios…</FilaVacia>}
          </tbody>
        </table>
      </div>

      {/* Los roles y qué puede hacer cada uno */}
      <div className="roles-lista">
        {roles.map((rol) => (
          <div key={rol.clave}>
            <b className={COLOR_DEL_ROL[rol.clave] ?? 'status off'}>{rol.nombre.toUpperCase()}</b>
            <p>{rol.descripcion}</p>
            <small>{rol.usuarios_activos} usuario{rol.usuarios_activos === 1 ? '' : 's'} activo{rol.usuarios_activos === 1 ? '' : 's'}</small>
          </div>
        ))}
      </div>
      <p className="muted usuarios-nota">
        <Icono nombre="candado" tamano={14} className="antes" />Las contraseñas guardadas no se pueden ver (están cifradas). Si alguien olvida la suya, pulsa <b>Editar</b> y
        ponle una nueva; con el botón del ojo puedes ver lo que escribes antes de guardar.
      </p>

      {editando !== undefined && (
        <Ventana alCerrar={() => setEditando(undefined)}>
          <FormularioUsuario usuarioAEditar={editando} roles={roles} alGuardar={guardar} />
        </Ventana>
      )}
      {quitando && (
        <Ventana alCerrar={() => setQuitando(null)}>
          <QuitarUsuario persona={quitando} alDesactivar={desactivar} alEliminar={eliminar} />
        </Ventana>
      )}
    </section>
  )
}
