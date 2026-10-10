// ─────────────────────────────────────────────────────────────
// FORMATO: cómo se muestran los números y las fechas
// ─────────────────────────────────────────────────────────────
// 'es-SV' = español de El Salvador; 'USD' = dólares.

const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })
const numero = new Intl.NumberFormat('es-SV', { maximumFractionDigits: 2 })
const fechaYHora = new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const soloHora = new Intl.DateTimeFormat('es-SV', { hour: '2-digit', minute: '2-digit' })
const fechaCompleta = new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const diaDeHoy = new Intl.DateTimeFormat('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })
const diaCorto = new Intl.DateTimeFormat('es-SV', { weekday: 'short' })

export const formato = {
  dinero: (valor) => dinero.format(valor), //                          12.5 → $12.50
  numero: (valor) => numero.format(valor), //                          2.5 → 2,5
  cantidad: (valor, unidad) => `${numero.format(valor)} ${unidad}`, // 3, 'Pieza' → 3 Pieza
  fecha: (fechaGuardada) => fechaYHora.format(new Date(fechaGuardada)), // → 23 sept 06:23 p. m.
  fechaCompleta: (fechaGuardada) => fechaCompleta.format(new Date(fechaGuardada)), // → 24/09/2026, 03:30 p. m.
  hora: (fechaGuardada) => soloHora.format(new Date(fechaGuardada)), //   → 06:23 p. m.
  referencia: (id) => `MOV-${String(id).padStart(5, '0')}`, //        12 → MOV-00012
  factura: (id) => String(id).padStart(6, '0'), //                     12 → 000012
  hoy: () => diaDeHoy.format(new Date()), //                           → miércoles, 24 de septiembre
  // Para las gráficas: reciben un día escrito como '2026-09-24'.
  diaDeLaSemana: (dia) => diaCorto.format(leerDia(dia)), //           → jue
  dia: (dia) => diaDeHoy.format(leerDia(dia)), //                     → jueves, 24 de septiembre
  // Según la hora de la computadora: antes de las 12 → días, antes de las 7 p. m. → tardes, si no → noches.
  saludo: () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 19) return 'Buenas tardes'
    return 'Buenas noches'
  },
}

// '2026-09-24' → ese día a la medianoche, en la hora de la computadora.
function leerDia(dia) {
  const [anio, mes, diaDelMes] = dia.split('-').map(Number)
  return new Date(anio, mes - 1, diaDelMes)
}
