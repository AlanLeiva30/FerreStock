// ─────────────────────────────────────────────────────────────
// ÁREAS: el ícono y el color de cada categoría
// ─────────────────────────────────────────────────────────────
// Para que cada área de la ferretería se reconozca de un vistazo:
//   martillo: Herramientas (naranja) · tuerca: Ferretería (verde agua) · tubería: Plomería (azul) · rayo: Electricidad (amarillo) …
// Los nombres de los íconos (martillo, tuerca…) están dibujados en src/componentes/Icono.jsx.
//
// Se elige por PALABRAS del nombre de la categoría: "Plomería y Tubos" contiene
// "plomer", así que lleva el ícono de tubería. Por eso, si creas una categoría nueva (por ejemplo
// "Jardinería"), toma su ícono sola. Si ninguna palabra coincide, lleva una caja y un
// color de la lista COLORES_DE_RESERVA (siempre el mismo para esa categoría).
//
// Para cambiar un ícono o un color, cámbialo en la lista AREAS.
// Las palabras se escriben en minúsculas y sin tildes ("plomer" coincide con "Plomería").
// Si un nombre tiene palabras de dos áreas, gana la que está más arriba en la lista.

const AREAS = [
  { palabras: ['herramienta'], icono: 'martillo', color: '#ff9d00' },
  { palabras: ['ferreter', 'tornill', 'clavo', 'fijacion'], icono: 'tuerca', color: '#20d1aa' },
  { palabras: ['plomer', 'tubo', 'fontaner', 'griferi'], icono: 'tuberia', color: '#3b9cff' },
  { palabras: ['electric', 'cable'], icono: 'rayo', color: '#f7c948' },
  { palabras: ['iluminacion', 'lampara', 'foco'], icono: 'foco', color: '#fde68a' },
  { palabras: ['pintur', 'solvente', 'barniz', 'thinner', 'aguarras'], icono: 'rodillo', color: '#b388ff' },
  { palabras: ['construc', 'cemento', 'bloque', 'albanil'], icono: 'ladrillos', color: '#ff6b4a' },
  { palabras: ['cerrajer', 'candado', 'cerradura'], icono: 'llave', color: '#f472b6' },
  { palabras: ['seguridad', 'proteccion'], icono: 'casco', color: '#9be15d' },
  { palabras: ['jardin', 'agricol'], icono: 'planta', color: '#4ade80' },
  { palabras: ['madera'], icono: 'madera', color: '#c8946a' },
  { palabras: ['limpieza'], icono: 'brillo', color: '#67e8f9' },
  { palabras: ['adhesiv', 'pegamento', 'sellador'], icono: 'pegamento', color: '#fb923c' },
  { palabras: ['hogar', 'cocina'], icono: 'casa', color: '#a3e635' },
  { palabras: ['automo', 'vehicul'], icono: 'auto', color: '#f87171' },
]

// Para las categorías que no coinciden con ninguna área de la lista.
const ICONO_DE_RESERVA = 'caja'
const COLORES_DE_RESERVA = ['#2dd4e0', '#a78bfa', '#fb7185', '#facc15', '#34d399', '#60a5fa']

// 'Plomería y Tubos' → { icono: 'tuberia', color: '#3b9cff' }
export function areaDeLaCategoria(nombre = '') {
  const texto = sinTildes(nombre)
  const area = AREAS.find(({ palabras }) => palabras.some((palabra) => texto.includes(palabra)))
  if (area) return { icono: area.icono, color: area.color }
  return { icono: ICONO_DE_RESERVA, color: COLORES_DE_RESERVA[numeroDelNombre(texto) % COLORES_DE_RESERVA.length] }
}

// 'Plomería' → 'plomeria'
function sinTildes(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Un número que sale de las letras del nombre: el mismo nombre siempre da el mismo número (y el mismo color).
function numeroDelNombre(texto) {
  return [...texto].reduce((suma, letra) => suma + letra.charCodeAt(0), 0)
}
