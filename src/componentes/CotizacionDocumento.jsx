// La hoja de la COTIZACIÓN, tal como se imprime o se guarda en PDF:
//
//   FERRETERÍA MEDRANO                         COTIZACIÓN
//   Dirección · Tel. · NIT                     N.º COT-00012
//   ───────────────────────────────────────────────────────────
//   Cliente · DUI/NIT · Contacto       Fecha · Válida hasta · Atendió
//   ───────────────────────────────────────────────────────────
//   #  Código  Descripción  Cant.  P. unit.  Total
//   …
//                                Subtotal / Descuento / TOTAL
//   Observaciones · Condiciones
//
// "cotizacion" tiene la forma de una cotización guardada (ver servidor/ventas/cotizaciones.js).
// Usa los mismos estilos de hoja blanca que el informe de Reportes (clase "informe").

import { formato } from '../utilidades/formato.js'

export default function CotizacionDocumento({ cotizacion, negocio, numero, fecha }) {
  const { cliente, cliente_documento: documento, contacto, validez, notas, detalle, subtotal, descuento, total, atendio } = cotizacion
  const montoDescuento = Math.round((subtotal - total) * 100) / 100
  const vence = new Date(fecha)
  vence.setDate(vence.getDate() + validez)
  const contactoDelNegocio = [negocio.telefono && `Tel. ${negocio.telefono}`, negocio.documento].filter(Boolean).join(' · ')

  return (
    <article className="informe cotizacion">
      <header className="informe-cabecera">
        <div>
          <h1>{negocio.nombre}</h1>
          {negocio.direccion && <p>{negocio.direccion}</p>}
          {contactoDelNegocio && <p>{contactoDelNegocio}</p>}
        </div>
        <div className="informe-fecha">
          <b className="cotizacion-titulo">COTIZACIÓN</b>
          <span>N.º {numero}</span>
        </div>
      </header>

      <div className="cotizacion-datos">
        <div>
          <small>Cliente</small>
          <b>{cliente || 'Cliente general'}</b>
          {documento && <span>DUI/NIT: {documento}</span>}
          {contacto && <span>{contacto}</span>}
        </div>
        <div>
          <small>Detalles</small>
          <span>Fecha: <b>{formato.fechaCompleta(fecha).split(',')[0]}</b></span>
          <span>Válida hasta: <b>{formato.fechaCompleta(vence).split(',')[0]}</b> ({validez} día{validez === 1 ? '' : 's'})</span>
          <span>Atendió: <b>{atendio}</b></span>
        </div>
      </div>

      <table>
        <thead><tr><th>#</th><th>Código</th><th>Descripción</th><th className="der">Cant.</th><th className="der">P. unit.</th><th className="der">Total</th></tr></thead>
        <tbody>
          {detalle.map((linea, posicion) => (
            <tr key={posicion}>
              <td>{posicion + 1}</td>
              <td>{linea.codigo || '—'}</td>
              <td>{linea.descripcion}</td>
              <td className="der">{formato.cantidad(linea.cantidad, linea.unidad).trim()}</td>
              <td className="der">{formato.dinero(linea.precio)}</td>
              <td className="der">{formato.dinero(linea.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cotizacion-totales">
        {montoDescuento > 0 && (
          <>
            <p><span>Subtotal</span><b>{formato.dinero(subtotal)}</b></p>
            <p><span>Descuento ({formato.numero(descuento)}%)</span><b>−{formato.dinero(montoDescuento)}</b></p>
          </>
        )}
        <p className="cotizacion-total"><span>TOTAL</span><b>{formato.dinero(total)}</b></p>
      </div>

      {notas && (
        <section>
          <h2>Observaciones</h2>
          <p className="cotizacion-notas">{notas}</p>
        </section>
      )}

      <section>
        <h2>Condiciones</h2>
        <ul className="cotizacion-condiciones">
          <li>Esta cotización no es una factura ni reserva existencias.</li>
          <li>Los precios y la disponibilidad pueden cambiar sin previo aviso después de la fecha de vigencia.</li>
        </ul>
      </section>

      <footer className="informe-pie">{negocio.mensaje || 'Gracias por su preferencia.'}</footer>
    </article>
  )
}
