// ─────────────────────────────────────────────────────────────
// FECHAS: días como texto 'AAAA-MM-DD' (según la hora de la computadora)
// ─────────────────────────────────────────────────────────────
// Sirven para los filtros por día (Hoy, Ayer, selector de fecha).

// Hoy, moviéndolo unos días: diaDeHoy() → hoy · diaDeHoy(-1) → ayer · diaDeHoy(-29) → hace 29 días.
export const diaDeHoy = (desplazamiento = 0) => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + desplazamiento)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}
