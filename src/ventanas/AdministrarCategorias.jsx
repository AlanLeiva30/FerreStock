// ─────────────────────────────────────────────────────────────
// VENTANA: ADMINISTRAR CATEGORÍAS
// ─────────────────────────────────────────────────────────────
// Lista de categorías en orden. Para cada una: subir ↑, bajar ↓, renombrar
// o borrar (solo si no tiene productos). Abajo, una casilla para crear otra.
// El orden elegido aquí es el que se usa en todo el programa y en la base de datos.

import { useState } from 'react'

export default function AdministrarCategorias({ categorias, acciones }) {
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false) //          true mientras se espera al servidor
  const [editandoId, setEditandoId] = useState(null) //     id de la categoría que se está renombrando
  const [nombreEditado, setNombreEditado] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')

  // Ejecuta una acción y, si falla, muestra el error. Devuelve true si salió bien.
  const ejecutar = async (accion) => {
    setOcupado(true)
    setError('')
    try {
      await accion()
      return true
    } catch (problema) {
      setError(problema.message)
      return false
    } finally {
      setOcupado(false)
    }
  }

  const empezarARenombrar = (categoria) => {
    setEditandoId(categoria.id)
    setNombreEditado(categoria.nombre)
    setError('')
  }

  const guardarNombre = async (evento) => {
    evento.preventDefault()
    if (await ejecutar(() => acciones.renombrar(editandoId, nombreEditado))) setEditandoId(null)
  }

  const crear = async (evento) => {
    evento.preventDefault()
    if (await ejecutar(() => acciones.crear(nombreNuevo))) setNombreNuevo('')
  }

  const borrar = (categoria) => {
    if (window.confirm(`¿Borrar la categoría "${categoria.nombre}"?`)) ejecutar(() => acciones.borrar(categoria.id))
  }

  return (
    <>
      <h2>Categorías</h2>
      <p>El orden de esta lista es el orden en que aparecen los productos en el programa y en la base de datos.</p>

      <ol className="category-list">
        {categorias.map((categoria, posicion) => (
          <li key={categoria.id}>
            {editandoId === categoria.id ? (
              // Modo "renombrar": una casilla con el nombre y los botones Guardar / Cancelar.
              <form onSubmit={guardarNombre}>
                <input value={nombreEditado} onChange={(evento) => setNombreEditado(evento.target.value)} maxLength="40" autoFocus aria-label="Nuevo nombre" />
                <button type="submit" disabled={ocupado}>Guardar</button>
                <button type="button" onClick={() => setEditandoId(null)}>Cancelar</button>
              </form>
            ) : (
              // Modo normal: nombre, cantidad de productos y botones.
              <>
                <span className="category-name">
                  <b>{categoria.nombre}</b>
                  <small>{categoria.productos} producto{categoria.productos === 1 ? '' : 's'}</small>
                </span>
                <span className="category-actions">
                  <button onClick={() => ejecutar(() => acciones.mover(categoria.id, -1))} disabled={ocupado || posicion === 0} aria-label={`Subir ${categoria.nombre}`}>↑</button>
                  <button onClick={() => ejecutar(() => acciones.mover(categoria.id, 1))} disabled={ocupado || posicion === categorias.length - 1} aria-label={`Bajar ${categoria.nombre}`}>↓</button>
                  <button onClick={() => empezarARenombrar(categoria)} disabled={ocupado}>Renombrar</button>
                  <button onClick={() => borrar(categoria)} disabled={ocupado || categoria.productos > 0}
                    title={categoria.productos > 0 ? 'Solo se pueden borrar categorías sin productos' : undefined}>Borrar</button>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="form-error" role="alert">{error}</p>}

      <form className="category-new" onSubmit={crear}>
        <input value={nombreNuevo} onChange={(evento) => setNombreNuevo(evento.target.value)} placeholder="Nueva categoría, p. ej. Jardinería" maxLength="40" aria-label="Nombre de la nueva categoría" />
        <button type="submit" disabled={ocupado || !nombreNuevo.trim()}>＋ Agregar</button>
      </form>
    </>
  )
}
