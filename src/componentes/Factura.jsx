// La hoja de la FACTURA, tal como se imprime:
//
//        FERRETERÍA MEDRANO
//     Dirección · Tel. · NIT
//   ───────────────────────────
//   FACTURA N.º 000012
//   Fecha · Atendió · Cliente · DUI/NIT
//   ───────────────────────────
//   Cant.  Descripción   P. unit.  Total
//   2      Martillo        $9.75  $19.50
//   ───────────────────────────
//   TOTAL                        $25.00
//   Efectivo / Cambio
//        ¡Gracias por su compra!
//
// Los datos de arriba y el mensaje de abajo se cambian en Vender →
// "Datos de la factura" (solo el administrador).

import { formato } from '../utilidades/formato.js'

export default function Factura({ venta }) {
  const { negocio } = venta
  const contacto = [negocio.telefono && `Tel. ${negocio.telefono}`, negocio.documento].filter(Boolean).join(' · ')

  return (
    <article className="factura">
      <header>
        <h3>{negocio.nombre}</h3>
        {negocio.direccion && <p>{negocio.direccion}</p>}
        {contacto && <p>{contacto}</p>}
      </header>

      <div className="factura-datos">
        <p className="factura-numero">FACTURA N.º {formato.factura(venta.id)}</p>
        <p><span>Fecha:</span> {formato.fechaCompleta(venta.fecha)}</p>
        <p><span>Atendió:</span> {venta.vendedor}</p>
        <p><span>Cliente:</span> {venta.cliente}</p>
        {venta.cliente_documento && <p><span>DUI/NIT:</span> {venta.cliente_documento}</p>}
      </div>

      <table>
        <thead><tr><th>Cant.</th><th>Descripción</th><th>P. unit.</th><th>Total</th></tr></thead>
        <tbody>
          {venta.detalle.map((linea, posicion) => (
            <tr key={posicion}>
              <td>{formato.numero(linea.cantidad)}</td>
              <td>{linea.nombre}<small>{linea.codigo} · {linea.unidad}</small></td>
              <td>{formato.dinero(linea.precio_unitario)}</td>
              <td>{formato.dinero(linea.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="factura-totales">
        {Number(venta.descuento) > 0 && (
          <>
            <div><dt>Subtotal</dt><dd>{formato.dinero(venta.subtotal)}</dd></div>
            <div><dt>Descuento ({formato.numero(Number(venta.descuento))}%)</dt><dd>−{formato.dinero(venta.descuento_monto)}</dd></div>
          </>
        )}
        <div className="factura-total"><dt>TOTAL</dt><dd>{formato.dinero(venta.total)}</dd></div>
        {venta.recibido != null && (
          <>
            <div><dt>Efectivo</dt><dd>{formato.dinero(venta.recibido)}</dd></div>
            <div><dt>Cambio</dt><dd>{formato.dinero(venta.cambio)}</dd></div>
          </>
        )}
      </dl>

      {negocio.mensaje && <p className="factura-pie">{negocio.mensaje}</p>}
    </article>
  )
}
