// CAMPANITA DE NOTIFICACIONES (arriba, junto al nombre del usuario)
// Muestra cuántos productos están agotados o con poco stock. Al pulsarla se despliega
// un panel con la lista, los más urgentes primero, y un botón para abrir la pantalla completa
// de Alertas. Lo ven el administrador y el vendedor (este último solo para consultar).
//
//   alertas   → productos con menos stock que su mínimo, ya ordenados por urgencia
//   alVerTodas → abre la pantalla "Alertas de Stock Mínimo"
//   sonando   → true un momento cuando un producto acaba de bajar de nivel (la campana se agita)

import { useEffect, useRef, useState } from 'react'
import { formato } from '../utilidades/formato.js'
import Icono from './Icono.jsx'

const MAXIMO_EN_EL_PANEL = 8

export default function CampanaDeAlertas({ alertas, alVerTodas, sonando = false }) {
  const [abierta, setAbierta] = useState(false)
  const raiz = useRef(null)

  // Se cierra al hacer clic fuera o al pulsar Escape.
  useEffect(() => {
    if (!abierta) return
    const alHacerClic = (evento) => !raiz.current?.contains(evento.target) && setAbierta(false)
    const alPresionar = (evento) => evento.key === 'Escape' && setAbierta(false)
    document.addEventListener('mousedown', alHacerClic)
    window.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      window.removeEventListener('keydown', alPresionar)
    }
  }, [abierta])

  const agotados = alertas.filter((producto) => producto.stock <= 0).length
  const pocos = alertas.length - agotados

  return (
    <div className="campana" ref={raiz}>
      <button className={sonando ? 'bell sonando' : 'bell'} onClick={() => setAbierta(!abierta)} aria-haspopup="dialog" aria-expanded={abierta}
        aria-label={alertas.length ? `Notificaciones: ${alertas.length} productos con alerta de stock` : 'Notificaciones: sin alertas'}>
        <Icono nombre="campana" tamano={19} />{alertas.length > 0 && <em>{alertas.length}</em>}
      </button>

      {abierta && (
        <div className="campana-panel" role="dialog" aria-label="Notificaciones de stock">
          <div className="campana-cabecera">
            <b>Notificaciones</b>
            {alertas.length > 0 && (
              <small>
                {agotados > 0 && <>{agotados} agotado{agotados === 1 ? '' : 's'}</>}
                {agotados > 0 && pocos > 0 && ' · '}
                {pocos > 0 && <>{pocos} con poco stock</>}
              </small>
            )}
          </div>

          {alertas.length === 0 ? (
            <p className="campana-vacia"><Icono nombre="check" tamano={18} className="antes" />Todo en orden: no hay productos con poco stock.</p>
          ) : (
            <ul className="campana-lista">
              {alertas.slice(0, MAXIMO_EN_EL_PANEL).map((producto) => {
                const agotado = producto.stock <= 0
                return (
                  <li key={producto.id} className={agotado ? 'agotado' : 'bajo'}>
                    <span className="campana-icono"><Icono nombre="alerta" tamano={17} /></span>
                    <div>
                      <b>{producto.nombre}</b>
                      <small>{producto.categoria} · {producto.codigo}</small>
                    </div>
                    <span className="campana-estado">
                      {agotado ? 'Agotado' : <>Quedan {formato.cantidad(producto.stock, producto.unidad)}<small>mínimo {formato.cantidad(producto.minimo, producto.unidad)}</small></>}
                    </span>
                  </li>
                )
              })}
              {alertas.length > MAXIMO_EN_EL_PANEL && <li className="campana-mas">y {alertas.length - MAXIMO_EN_EL_PANEL} más…</li>}
            </ul>
          )}

          <button className="campana-ver" onClick={() => { setAbierta(false); alVerTodas() }}>Ver todas las alertas</button>
        </div>
      )}
    </div>
  )
}
