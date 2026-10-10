// ─────────────────────────────────────────────────────────────
// VENTANA: REGISTRAR MOVIMIENTO (entrada o salida)
// ─────────────────────────────────────────────────────────────
// "valoresIniciales" permite abrirla ya rellenada. Por ejemplo, el botón
// "Reabastecer" la abre con el producto, "Entrada" y la cantidad que falta.
// Antes de guardar muestra cómo quedará el stock y no deja vender más de lo que hay.

import { useState } from 'react'
import { formato } from '../utilidades/formato.js'
import { useGuardar } from './useGuardar.js'

export default function FormularioMovimiento({ productos, motivos, valoresIniciales = {}, alGuardar }) {
  const productosActivos = productos.filter((producto) => producto.activo)
  const tipoInicial = valoresIniciales.tipo ?? 'entrada'

  // Lo que el usuario va escribiendo o eligiendo en el formulario.
  const [productoId, setProductoId] = useState(String(valoresIniciales.productoId ?? productosActivos[0]?.id ?? ''))
  const [tipo, setTipo] = useState(tipoInicial)
  const [motivo, setMotivo] = useState(valoresIniciales.motivo ?? motivos[tipoInicial][0])
  const [cantidad, setCantidad] = useState(String(valoresIniciales.cantidad ?? 1))
  const [nota, setNota] = useState('')
  const { error, guardando, enviar } = useGuardar(alGuardar)

  const producto = productos.find((opcion) => String(opcion.id) === productoId)

  // Al cambiar entre entrada y salida, se elige el primer motivo de ese tipo.
  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setMotivo(motivos[nuevoTipo][0])
  }

  // Cómo quedaría el stock después de este movimiento (null si todavía no se puede calcular).
  const numero = Number(cantidad)
  const stockResultante = producto && numero > 0 ? producto.stock + (tipo === 'salida' ? -numero : numero) : null
  const faltaStock = stockResultante !== null && stockResultante < 0

  const guardar = (evento) => enviar(evento, { productoId: Number(productoId), tipo, motivo, cantidad: numero, nota })

  return (
    <>
      <h2>Registrar movimiento</h2>
      <p>Cada movimiento actualiza el stock y queda guardado en el historial.</p>

      <form onSubmit={guardar}>
        <label>Producto
          <select value={productoId} onChange={(evento) => setProductoId(evento.target.value)} autoFocus>
            {productosActivos.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>{opcion.codigo} · {opcion.nombre} ({formato.cantidad(opcion.stock, opcion.unidad)})</option>
            ))}
          </select>
        </label>

        {/* Dos botones: Entrada / Salida */}
        <div className="segmented" role="radiogroup" aria-label="Tipo de movimiento">
          <button type="button" role="radio" aria-checked={tipo === 'entrada'} className={tipo === 'entrada' ? 'on in' : ''} onClick={() => cambiarTipo('entrada')}>＋ Entrada</button>
          <button type="button" role="radio" aria-checked={tipo === 'salida'} className={tipo === 'salida' ? 'on out' : ''} onClick={() => cambiarTipo('salida')}>− Salida</button>
        </div>

        <label>Motivo
          <select value={motivo} onChange={(evento) => setMotivo(evento.target.value)}>
            {motivos[tipo].map((opcion) => <option key={opcion}>{opcion}</option>)}
          </select>
        </label>

        <label>Cantidad{producto && ` (${producto.unidad})`}
          <input type="number" min="0.01" step="any" value={cantidad} onChange={(evento) => setCantidad(evento.target.value)} required />
        </label>

        <label>Nota (opcional)
          <input value={nota} onChange={(evento) => setNota(evento.target.value)} placeholder="Factura, proveedor, cliente…" maxLength="200" />
        </label>

        {stockResultante !== null && (
          <p className={faltaStock ? 'form-error' : 'form-hint'}>
            Stock resultante: {formato.cantidad(Math.max(stockResultante, 0), producto.unidad)}
            {faltaStock && ' — no hay suficiente stock'}
            {!faltaStock && stockResultante < producto.minimo && ' (bajo el mínimo)'}
          </p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" disabled={guardando || !producto || faltaStock}>{guardando ? 'Guardando…' : 'Guardar movimiento'}</button>
      </form>
    </>
  )
}
