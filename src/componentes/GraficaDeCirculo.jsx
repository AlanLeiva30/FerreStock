// GRÁFICA DE CÍRCULO (tipo dona): cada porción es una parte del total, y a la
// derecha (o abajo) va la lista con el color y el porcentaje de cada una.
// Al pasar el mouse por una porción o por la lista, en el centro se lee cuánto
// es esa parte; si no se señala ninguna, en el centro se lee el total.
//
//   <GraficaDeCirculo datos={[{ clave: 'Herramientas', etiqueta: 'Herramientas', valor: 1200 }, …]}
//     formatoDelValor={formato.dinero} textoDelTotal="Valor a costo" />
//
//   color → opcional; si no se pone, se usan los de la lista COLORES en orden.

import { useState } from 'react'

// Colores de las porciones, en orden (conviene pasar los datos de mayor a menor).
const COLORES = ['#ff9d00', '#20d1aa', '#3b9cff', '#ff6277', '#a78bfa', '#f7c948', '#2dd4e0', '#f472b6']

// Con este radio, la vuelta completa del círculo mide 100: así cada porción mide
// exactamente su porcentaje (una porción del 25 % mide 25).
const RADIO = 15.9155
const SEPARACION = 0.6 // pequeño espacio entre porciones

export default function GraficaDeCirculo({ datos, formatoDelValor = String, textoDelTotal = 'Total', detalleDelTotal = '' }) {
  const [senalada, setSenalada] = useState(null) // clave de la porción señalada (null = ninguna)
  const total = datos.reduce((suma, dato) => suma + dato.valor, 0)

  // Dónde empieza cada porción: justo donde terminó la anterior.
  let acumulado = 0
  const porciones = datos.map((dato, posicion) => {
    const porcentaje = total ? (dato.valor / total) * 100 : 0
    const porcion = { ...dato, porcentaje, inicio: acumulado, color: dato.color ?? COLORES[posicion % COLORES.length] }
    acumulado += porcentaje
    return porcion
  })
  const porcionSenalada = porciones.find((porcion) => porcion.clave === senalada)
  const separacion = porciones.length > 1 ? SEPARACION : 0

  return (
    <div className="grafica-circulo" onMouseLeave={() => setSenalada(null)}>
      <div className="grafica-dona-caja">
        <svg viewBox="0 0 42 42" className={senalada ? 'grafica-dona con-senalada' : 'grafica-dona'} aria-hidden="true">
          <circle className="grafica-dona-fondo" cx="21" cy="21" r={RADIO} />
          {porciones.map((porcion) => {
            const largo = Math.max(porcion.porcentaje - separacion, 0.3)
            return (
              // strokeDasharray = "largo de la porción, espacio vacío"; strokeDashoffset la corre a su lugar
              // (el 25 hace que la primera porción empiece arriba, a las 12 del reloj).
              <circle key={porcion.clave} cx="21" cy="21" r={RADIO} stroke={porcion.color}
                className={porcion.clave === senalada ? 'senalada' : undefined}
                strokeDasharray={`${largo} ${100 - largo}`} strokeDashoffset={25 - porcion.inicio}
                onMouseEnter={() => setSenalada(porcion.clave)} />
            )
          })}
        </svg>
        <div className="grafica-dona-centro">
          {porcionSenalada ? (
            <>
              <small>{porcionSenalada.etiqueta}</small>
              <strong>{mostrarPorcentaje(porcionSenalada.porcentaje)}</strong>
              <span>{formatoDelValor(porcionSenalada.valor)}</span>
            </>
          ) : (
            <>
              <small>{textoDelTotal}</small>
              <strong>{formatoDelValor(total)}</strong>
              {detalleDelTotal && <span>{detalleDelTotal}</span>}
            </>
          )}
        </div>
      </div>

      <ul className="grafica-leyenda">
        {porciones.map((porcion) => (
          <li key={porcion.clave}>
            <button type="button" className={porcion.clave === senalada ? 'senalada' : undefined}
              onMouseEnter={() => setSenalada(porcion.clave)} onFocus={() => setSenalada(porcion.clave)} onBlur={() => setSenalada(null)}>
              <i style={{ background: porcion.color }} aria-hidden="true" />
              <span><b>{porcion.etiqueta}</b><small>{formatoDelValor(porcion.valor)}</small></span>
              <strong>{mostrarPorcentaje(porcion.porcentaje)}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 42.37 → "42%"   ·   3.456 → "3.5%"   (las porciones pequeñas llevan un decimal)
function mostrarPorcentaje(porcentaje) {
  return `${porcentaje >= 10 ? Math.round(porcentaje) : porcentaje.toFixed(1)}%`
}
