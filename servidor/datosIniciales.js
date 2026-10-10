// ─────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO
// ─────────────────────────────────────────────────────────────
// Solo se usan la PRIMERA vez que se abre FerreStock, cuando todavía no existe
// el archivo data/ferrestock.db. Si borras ese archivo, la base se vuelve a
// crear con estos datos.

// Categorías, en el orden en que aparecen en el programa.
export const CATEGORIAS_INICIALES = [
  'Herramientas',
  'Ferretería',
  'Plomería y Tubos',
  'Electricidad',
  'Pinturas y Solventes',
  'Construcción',
  'Cerrajería',
  'Seguridad',
]

// Productos. Cada fila es:
// [código, nombre, categoría, unidad, stock, stock mínimo, costo, precio de venta]
export const PRODUCTOS_INICIALES = [
  ['FER-1001', 'Martillo de Uña Curva 16 oz', 'Herramientas', 'Pieza', 14, 5, 6.5, 9.75],
  ['FER-1002', 'Taladro Percutor 1/2” 650W', 'Herramientas', 'Pieza', 3, 4, 48, 69.9],
  ['FER-1003', 'Tornillo Punta Broca 1” (100 u.)', 'Ferretería', 'Caja', 40, 10, 3.2, 5.5],
  ['FER-1004', 'Tubo PVC Sanitario 2” x 3m', 'Plomería y Tubos', 'Pieza', 2, 10, 5.4, 8.25],
  ['FER-1005', 'Cable THHN #12 (rollo 100m)', 'Electricidad', 'Rollo', 6, 3, 42, 58],
  ['FER-1006', 'Thinner Estándar 1 Litro', 'Pinturas y Solventes', 'Litro', 0, 15, 2.1, 3.5],
  ['FER-1007', 'Candado de Latón 40mm', 'Cerrajería', 'Pieza', 9, 4, 4.3, 7.25],
  ['FER-1008', 'Casco de Seguridad Amarillo', 'Seguridad', 'Pieza', 12, 5, 5.8, 9.5],
  ['FER-1009', 'Cemento Gris Portland 50 Kg', 'Construcción', 'Bolsa', 18, 25, 8.9, 11.5],
  ['FER-1010', 'Cinta Teflón 1/2” x 7m', 'Plomería y Tubos', 'Pieza', 85, 20, 0.35, 0.75],
  ['FER-1011', 'Tomacorriente Doble Polarizado', 'Electricidad', 'Pieza', 30, 10, 1.9, 3.25],
  ['FER-1012', 'Cinta Canela de Empaque 48mm', 'Ferretería', 'Pieza', 4, 12, 1.1, 1.95],
  ['FER-1013', 'Pintura Látex Blanca 1 Galón', 'Pinturas y Solventes', 'Galón', 8, 6, 11.5, 17.9],
  ['FER-1014', 'Lentes de Seguridad Transparentes', 'Seguridad', 'Pieza', 1, 10, 1.8, 3.5],
  ['FER-1015', 'Cerradura de Pomo para Puerta', 'Cerrajería', 'Pieza', 5, 3, 9.6, 15.5],
  ['FER-1016', 'Varilla Corrugada 3/8” x 6m', 'Construcción', 'Pieza', 60, 20, 3.9, 5.6],
]

// Movimientos de ejemplo para que el historial no empiece vacío. Cada fila es:
// [código del producto, tipo, motivo, cantidad, quién lo registró, hace cuánto tiempo]
export const MOVIMIENTOS_INICIALES = [
  ['FER-1016', 'entrada', 'Compra a Proveedor', 20, 'María López', '-6 hours'],
  ['FER-1001', 'salida', 'Venta al Contado', 6, 'Juan Pérez', '-5 hours'],
  ['FER-1004', 'salida', 'Venta al Contado', 8, 'María López', '-4 hours'],
  ['FER-1006', 'salida', 'Merma o Producto Dañado', 3, 'Juan Pérez', '-3 hours'],
  ['FER-1010', 'entrada', 'Reabastecimiento', 50, 'María López', '-2 hours'],
  ['FER-1009', 'salida', 'Venta al Contado', 4, 'Juan Pérez', '-1 hours'],
  ['FER-1002', 'entrada', 'Compra a Proveedor', 10, 'María López', '-30 minutes'],
]
