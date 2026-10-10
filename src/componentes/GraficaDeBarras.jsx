// GRÁFICA DE BARRAS: una columna por cada dato. La más alta llega hasta arriba
// y las demás, en proporción. Al pasar el mouse (o tocar) una barra, debajo de la
// gráfica se lee su detalle; si no se señala ninguna, se lee el de la última.
//
//   <GraficaDeBarras datos={[{ clave: '2026-09-24', etiqueta: 'Hoy', valor: 45, detalle: '…' }]}
//     formatoDelValor={formato.dinero} mostrarValores />
//
//   etiqueta       → lo que se lee debajo de la barra ("\n" la parte en dos renglones; puede ir vacía)
//   detalle        → lo que se lee debajo de la gráfica al señalar esa barra
//   destacada      → true = su etiqueta sale resaltada (por ejemplo, la de hoy)
//   mostrarValores → escribir el valor encima de cada barra (con muchas barras no cabe)

import { useState } from 'react'

const ALTURA_MAXIMA = 84 // % del alto; arriba queda espacio para escribir el valor

export default function GraficaDeBarras({ datos, formatoDelValor = String, mostrarValores = true }) {
  const [senalada, setSenalada] = useState(null) // clave de la barra señalada (null = ninguna)
  const mayor = Math.max(...datos.map((dato) => dato.valor), 0)
  const datoDelDetalle = datos.find((dato) => dato.clave === senalada) ?? datos[datos.length - 1]

  return (
    <div className="grafica-barras-caja">
      <div className="grafica-barras" onMouseLeave={() => setSenalada(null)}>
        {datos.map((dato) => {
          const altura = mayor ? (dato.valor / mayor) * ALTURA_MAXIMA : 0
          const clases = ['grafica-columna', dato.destacada && 'destacada', dato.clave === senalada && 'senalada'].filter(Boolean).join(' ')
          return (
            <button key={dato.clave} type="button" className={clases} aria-label={dato.detalle}
              onMouseEnter={() => setSenalada(dato.clave)} onFocus={() => setSenalada(dato.clave)} onClick={() => setSenalada(dato.clave)}>
              <span className="grafica-carril">
                <span className={dato.valor > 0 ? 'grafica-barra' : 'grafica-barra vacia'} style={{ height: `${altura}%` }} />
                {mostrarValores && dato.valor > 0 && (
                  // 5px = lo mínimo que mide una barra (estilos.css), para que el valor no quede encima de ella
                  <span className="grafica-valor" style={{ bottom: `max(${altura}%, 5px)` }}>{formatoDelValor(dato.valor)}</span>
                )}
              </span>
              <small>{dato.etiqueta}</small>
            </button>
          )
        })}
      </div>
      {datoDelDetalle && <p className="grafica-detalle" aria-live="polite">{datoDelDetalle.detalle}</p>}
    </div>
  )
}
