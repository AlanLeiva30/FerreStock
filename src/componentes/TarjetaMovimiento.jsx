// Tarjeta pequeña con un movimiento (usada en "Últimos Movimientos" del Panel Principal).
// Las entradas se ven en verde con "+" y las salidas en rojo con "−".

import { formato } from '../utilidades/formato.js'

export default function TarjetaMovimiento({ movimiento }) {
  const esEntrada = movimiento.tipo === 'entrada'
  return (
    <article>
      <div>
        <b>{movimiento.nombre}</b>
        <span>{movimiento.motivo}</span>
        <small>Reg: {movimiento.usuario}</small>
      </div>
      <div className={esEntrada ? 'plus' : 'minus'}>
        <b>{esEntrada ? '+' : '−'}{formato.cantidad(movimiento.cantidad, movimiento.unidad)}</b>
        <span>{formato.fecha(movimiento.fecha)}</span>
        <small>{formato.referencia(movimiento.id)}</small>
      </div>
    </article>
  )
}
