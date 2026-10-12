// ─────────────────────────────────────────────────────────────
// MOTIVOS DE LOS MOVIMIENTOS
// ─────────────────────────────────────────────────────────────
// Son las opciones que aparecen en "Motivo" al registrar una entrada o una salida.
// Para agregar uno nuevo, escríbelo entre comillas dentro de la lista que
// corresponda, separado por una coma, y reinicia el programa.
//
// Nota: en Reportes, "Más vendidos" cuenta toda salida cuyo motivo empiece con "Venta".

export const MOTIVOS = {
  entrada: [
    'Compra a Proveedor',
    'Reabastecimiento',
    'Devolución de Cliente',
    'Ajuste de Inventario',
  ],
  salida: [
    'Venta al Contado',
    'Venta al Crédito',
    'Merma o Producto Dañado',
    'Ajuste de Inventario',
  ],
}
