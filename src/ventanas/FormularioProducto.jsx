// ─────────────────────────────────────────────────────────────
// VENTANA: NUEVO PRODUCTO / EDITAR PRODUCTO
// ─────────────────────────────────────────────────────────────
// Si recibe un "producto", sirve para editarlo; si no, para crear uno nuevo.
// Al editar no aparece el stock: el stock solo cambia con entradas y salidas.

import { useGuardar } from './useGuardar.js'

export default function FormularioProducto({ producto, categorias, categoriaSugerida, alGuardar }) {
  const esNuevo = !producto
  const { error, guardando, enviar } = useGuardar(alGuardar)

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
          {casilla('codigo', 'Código', { required: true, placeholder: 'FER-1017', autoFocus: true })}
          {casilla('unidad', 'Unidad', { required: true, placeholder: 'Pieza, Litro, Caja…', defaultValue: 'Pieza' })}
        </div>

        {casilla('nombre', 'Nombre', { required: true })}

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
