// Fila que ocupa todo el ancho de una tabla para mostrar un mensaje,
// por ejemplo "No se encontraron productos".
// "columnas" es cuántas columnas tiene la tabla.

export default function FilaVacia({ columnas, children }) {
  return (
    <tr>
      <td className="empty" colSpan={columnas}>{children}</td>
    </tr>
  )
}
