// El INFORME que se imprime o se guarda como PDF desde Reportes. Es una hoja blanca, pensada para papel:
//
//   Encabezado (negocio, fecha y quién lo generó)
//   1. Resumen: valor del inventario, entradas y salidas
//   2. Ventas por día (gráfica de barras) + los días con más ventas
//   3. Reparto del inventario (gráfica de círculo) + tabla por categoría
//   4. Productos más vendidos
//   5. Productos con poco stock o agotados
//
// Las gráficas se dibujan aquí como imágenes vectoriales (SVG) con colores fijos, para que se vean
// igual en pantalla, en papel y en PDF sin importar si el programa está en modo claro u oscuro.
// Lo muestra la ventana src/ventanas/VerInforme.jsx.

import { formato } from '../utilidades/formato.js'
import { conMayuscula } from '../utilidades/graficas.js'

const TINTA = '#1b2333'
const GRIS = '#6b7689'
const LINEA = '#d9dee8'
const NARANJA = '#e08a00'

export default function InformeDeReportes({ informe }) {
  const { negocio, generadoPor, generado, dias, ventas, totales, categorias, porciones, actividad, alertas } = informe
  const vendido = ventas.reduce((suma, dia) => suma + dia.total, 0)
  const facturas = ventas.reduce((suma, dia) => suma + dia.facturas, 0)
  const mejoresDias = ventas.filter((dia) => dia.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
  const totalDelCirculo = porciones.reduce((suma, porcion) => suma + porcion.valor, 0)

  return (
    <article className="informe">
      <header className="informe-cabecera">
        <div>
          <h1>{negocio.nombre}</h1>
          <p>Informe de reportes y estadísticas</p>
        </div>
        <div className="informe-fecha">
          <b>{conMayuscula(formato.dia(diaLocal(generado)))}</b>
          <span>{formato.hora(generado)} · {generadoPor}</span>
        </div>
      </header>

      <section>
        <h2>1. Resumen del inventario</h2>
        <div className="informe-tarjetas">
          <div><small>Valor a costo</small><b>{formato.dinero(totales.valorCosto)}</b><span>{totales.activos.length} productos activos</span></div>
          <div><small>Valor a precio de venta</small><b>{formato.dinero(totales.valorVenta)}</b><span>Margen estimado +{totales.margen.toFixed(1)}%</span></div>
          <div><small>Entradas (30 días)</small><b>{actividad.entradas}</b><span>movimientos</span></div>
          <div><small>Salidas (30 días)</small><b>{actividad.salidas}</b><span>movimientos</span></div>
        </div>
      </section>

      <section>
        <h2>2. Ventas por día · últimos {dias} días</h2>
        <div className="informe-tarjetas tres">
          <div><small>Vendido</small><b>{formato.dinero(vendido)}</b></div>
          <div><small>Facturas</small><b>{facturas}</b></div>
          <div><small>Promedio por día</small><b>{formato.dinero(vendido / dias)}</b></div>
        </div>
        <GraficaDeBarrasImpresa ventas={ventas} />
        {mejoresDias.length > 0 && (
          <table>
            <thead><tr><th>Días con más ventas</th><th className="der">Facturas</th><th className="der">Total</th></tr></thead>
            <tbody>
              {mejoresDias.map((dia) => (
                <tr key={dia.fecha}><td>{conMayuscula(formato.dia(dia.fecha))}</td><td className="der">{dia.facturas}</td><td className="der">{formato.dinero(dia.total)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>3. Reparto del inventario por categoría</h2>
        {porciones.length ? (
          <div className="informe-circulo">
            <GraficaDeCirculoImpresa porciones={porciones} total={totalDelCirculo} />
            <table>
              <thead><tr><th>Categoría</th><th className="der">Productos</th><th className="der">Valor costo</th><th className="der">Valor venta</th><th className="der">%</th></tr></thead>
              <tbody>
                {categorias.map((categoria) => {
                  const porcion = porciones.find((opcion) => opcion.clave === categoria.nombre)
                  return (
                    <tr key={categoria.nombre}>
                      <td><i className="informe-punto" style={{ background: porcion?.color ?? '#8c9ab0' }} />{categoria.nombre}</td>
                      <td className="der">{categoria.cantidadDeProductos}</td>
                      <td className="der">{formato.dinero(categoria.valorCosto)}</td>
                      <td className="der">{formato.dinero(categoria.valorVenta)}</td>
                      <td className="der">{totalDelCirculo ? `${((categoria.valorCosto / totalDelCirculo) * 100).toFixed(1)}%` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="informe-vacio">Todavía no hay productos con stock.</p>}
      </section>

      <section>
        <h2>4. Productos más vendidos · últimos 30 días</h2>
        {actividad.masVendidos.length ? (
          <table>
            <thead><tr><th>#</th><th>Producto</th><th className="der">Cantidad vendida</th></tr></thead>
            <tbody>
              {actividad.masVendidos.map((producto, posicion) => (
                <tr key={producto.nombre}><td>{posicion + 1}</td><td>{producto.nombre}</td><td className="der">{formato.cantidad(producto.cantidad, producto.unidad)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="informe-vacio">Sin ventas registradas en los últimos 30 días.</p>}
      </section>

      <section>
        <h2>5. Productos con poco stock o agotados ({alertas.length})</h2>
        {alertas.length ? (
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th className="der">Disponible</th><th className="der">Mínimo</th><th>Estado</th></tr></thead>
            <tbody>
              {alertas.slice(0, 15).map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.codigo}</td><td>{producto.nombre}</td><td>{producto.categoria}</td>
                  <td className="der">{formato.cantidad(producto.stock, producto.unidad)}</td>
                  <td className="der">{formato.cantidad(producto.minimo, producto.unidad)}</td>
                  <td><b className={producto.stock <= 0 ? 'informe-agotado' : 'informe-bajo'}>{producto.stock <= 0 ? 'AGOTADO' : 'STOCK BAJO'}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="informe-vacio">Todo el inventario está sobre el mínimo.</p>}
        {alertas.length > 15 && <p className="informe-vacio">…y {alertas.length - 15} productos más (ver la pantalla Alertas).</p>}
      </section>

      <footer className="informe-pie">FerreStock · Informe generado automáticamente a partir de los datos del sistema.</footer>
    </article>
  )
}

// La fecha de la computadora como 'AAAA-MM-DD' (para escribirla con formato.dia).
function diaLocal(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

// Redondea hacia arriba a un número "redondo" (437 → 500) para que el eje de la gráfica se lea fácil.
function maximoRedondo(valor) {
  if (valor <= 0) return 1
  const potencia = 10 ** Math.floor(Math.log10(valor))
  const fraccion = valor / potencia
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((paso) => fraccion <= paso) ?? 10) * potencia
}

// ── Gráfica de barras (SVG): una barra por día ──
function GraficaDeBarrasImpresa({ ventas }) {
  const ANCHO = 720, ALTO = 230, IZQUIERDA = 56, ARRIBA = 18, ABAJO = 38
  const alturaUtil = ALTO - ARRIBA - ABAJO
  const anchoUtil = ANCHO - IZQUIERDA - 8
  const maximo = maximoRedondo(Math.max(...ventas.map((dia) => dia.total), 0))
  const hueco = anchoUtil / ventas.length
  const anchoDeBarra = Math.min(hueco * 0.62, 46)
  const cadaCuanto = ventas.length <= 7 ? 1 : ventas.length <= 31 ? 5 : 10 // cada cuántos días se escribe su número
  const conValores = ventas.length <= 14

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="informe-grafica" role="img" aria-label="Ventas por día">
      {[0, 0.5, 1].map((parte) => {
        const y = ARRIBA + alturaUtil * (1 - parte)
        return (
          <g key={parte}>
            <line x1={IZQUIERDA} x2={ANCHO - 8} y1={y} y2={y} stroke={LINEA} strokeWidth="1" />
            <text x={IZQUIERDA - 8} y={y + 4} textAnchor="end" fontSize="11" fill={GRIS}>{formato.dinero(maximo * parte).replace(/\.00$/, '')}</text>
          </g>
        )
      })}
      {ventas.map((dia, posicion) => {
        const esHoy = posicion === ventas.length - 1
        const alto = (dia.total / maximo) * alturaUtil
        const x = IZQUIERDA + hueco * posicion + (hueco - anchoDeBarra) / 2
        const centro = x + anchoDeBarra / 2
        const numero = Number(dia.fecha.slice(8))
        const escribirDia = esHoy || (ventas.length - 1 - posicion) % cadaCuanto === 0
        return (
          <g key={dia.fecha}>
            {dia.total > 0
              ? <rect x={x} y={ARRIBA + alturaUtil - alto} width={anchoDeBarra} height={alto} rx="3" fill={NARANJA} />
              : <rect x={x} y={ARRIBA + alturaUtil - 2} width={anchoDeBarra} height="2" fill={LINEA} />}
            {conValores && dia.total > 0 && <text x={centro} y={ARRIBA + alturaUtil - alto - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill={TINTA}>{formato.dinero(dia.total)}</text>}
            {escribirDia && (
              <text x={centro} y={ALTO - 20} textAnchor="middle" fontSize="11" fontWeight={esHoy ? 700 : 400} fill={esHoy ? NARANJA : GRIS}>
                {ventas.length <= 7 ? (esHoy ? 'Hoy' : formato.diaDeLaSemana(dia.fecha)) : esHoy ? 'Hoy' : numero}
              </text>
            )}
            {escribirDia && ventas.length <= 7 && <text x={centro} y={ALTO - 6} textAnchor="middle" fontSize="11" fill={GRIS}>{numero}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ── Gráfica de círculo (SVG): una porción por categoría ──
function GraficaDeCirculoImpresa({ porciones, total }) {
  const RADIO = 15.9155 // con este radio la vuelta completa mide 100: cada porción mide su porcentaje
  let acumulado = 0
  return (
    <svg viewBox="0 0 42 42" className="informe-dona" role="img" aria-label="Reparto del inventario por categoría">
      <circle cx="21" cy="21" r={RADIO} fill="none" stroke={LINEA} strokeWidth="6" />
      {porciones.map((porcion) => {
        const porcentaje = total ? (porcion.valor / total) * 100 : 0
        const largo = Math.max(porcentaje - (porciones.length > 1 ? 0.5 : 0), 0.3)
        const circulo = <circle key={porcion.clave} cx="21" cy="21" r={RADIO} fill="none" stroke={porcion.color} strokeWidth="6"
          strokeDasharray={`${largo} ${100 - largo}`} strokeDashoffset={25 - acumulado} />
        acumulado += porcentaje
        return circulo
      })}
      <text x="21" y="20.3" textAnchor="middle" fontSize="2.6" fill={GRIS}>Valor a costo</text>
      <text x="21" y="24.4" textAnchor="middle" fontSize="3.6" fontWeight="700" fill={TINTA}>{formato.dinero(total)}</text>
    </svg>
  )
}
