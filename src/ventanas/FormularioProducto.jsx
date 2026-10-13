// ─────────────────────────────────────────────────────────────
// VENTANA: NUEVO PRODUCTO / EDITAR PRODUCTO
// ─────────────────────────────────────────────────────────────
// Si recibe un "producto", sirve para editarlo; si no, para crear uno nuevo.
// Al editar no aparece el stock: el stock solo cambia con entradas y salidas.
//
// Al crear un producto el CÓDIGO es automático (FER-1017, FER-1018…): el servidor lo asigna al guardar
// y aquí se muestra cuál le tocará, en una casilla que no se puede escribir. Al editar, el código sí se puede cambiar.

import { useEffect, useState } from 'react'
import { servidor } from '../utilidades/servidor.js'
import { useGuardar } from './useGuardar.js'

export default function FormularioProducto({ producto, categorias, categoriaSugerida, alGuardar }) {
  const esNuevo = !producto
  const { error, guardando, enviar } = useGuardar(alGuardar)
  const [codigoNuevo, setCodigoNuevo] = useState('') // el código que recibirá el producto nuevo ('' = todavía no se sabe)

  useEffect(() => {
    if (!esNuevo) return
    let vigente = true
    servidor.siguienteCodigoDeProducto().then((respuesta) => vigente && setCodigoNuevo(respuesta.codigo)).catch(() => {})
    return () => { vigente = false }
  }, [esNuevo])

  // Toma todo lo escrito en el formulario y lo envía a guardar.
  const guardar = (evento) => {
    const datos = Object.fromEntries(new FormData(evento.currentTarget))
    enviar(evento, datos, producto?.id)
  }

  // Categoría elegida al abrir: la del producto, o la que se está filtrando, o la primera.
  const categoriaInicial = producto?.categoria_id
    ?? categorias.find((categoria) => categoria.nombre === categoriaSugerida)?.id
    ?? categorias[0]?.id

  // Crea una casilla con su título. "nombre" es el dato del producto que guarda.
  const casilla = (nombre, titulo, opciones = {}) => (
    <label>{titulo}
      <input name={nombre} defaultValue={producto?.[nombre] ?? opciones.defaultValue ?? ''} {...opciones} />
    </label>
  )

  return (
    <>
      <h2>{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h2>
      <p>{esNuevo ? 'Agrega un artículo al catálogo.' : 'El stock solo se modifica registrando entradas o salidas.'}</p>

      <form onSubmit={guardar}>
        <div className="form-row">
          {esNuevo ? (
            <label>Código (automático)
              <input className="campo-automatico" value={codigoNuevo || 'Se asigna al guardar'} readOnly tabIndex={-1} aria-describedby="ayuda-codigo" />
            </label>
          ) : casilla('codigo', 'Código', { required: true, autoFocus: true })}
          {casilla('unidad', 'Unidad', { required: true, placeholder: 'Pieza, Litro, Caja…', defaultValue: 'Pieza' })}
        </div>

        {esNuevo && <p id="ayuda-codigo" className="form-hint">El código se asigna solo y sigue la numeración: cada producto nuevo recibe el siguiente.</p>}

        {casilla('nombre', 'Nombre', { required: true, autoFocus: esNuevo })}

        <label>Categoría
          <select name="categoria_id" defaultValue={categoriaInicial}>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
          </select>
        </label>

        <div className="form-row">
          {esNuevo && casilla('stock', 'Stock inicial', { type: 'number', min: 0, step: 'any', defaultValue: 0 })}
          {casilla('minimo', 'Stock mínimo', { type: 'number', min: 0, step: 'any', defaultValue: 0 })}
        </div>

        <div className="form-row">
          {casilla('costo', 'Costo ($)', { type: 'number', min: 0, step: '0.01', defaultValue: 0 })}
          {casilla('precio', 'Precio venta ($)', { type: 'number', min: 0, step: '0.01', defaultValue: 0 })}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : esNuevo ? 'Agregar producto' : 'Guardar cambios'}</button>
      </form>
    </>
  )
}
