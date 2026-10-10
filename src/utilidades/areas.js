// ─────────────────────────────────────────────────────────────
// ÁREAS: el ícono y el color de cada categoría
// ─────────────────────────────────────────────────────────────
// Para que cada área de la ferretería se reconozca de un vistazo:
//   🔨 Herramientas (naranja) · 🔩 Ferretería (verde agua) · 🚰 Plomería (azul) · ⚡ Electricidad (amarillo) …
//
// Se elige por PALABRAS del nombre de la categoría: "Plomería y Tubos" contiene
// "plomer", así que lleva 🚰. Por eso, si creas una categoría nueva (por ejemplo
// "Jardinería"), toma su ícono sola. Si ninguna palabra coincide, lleva 📦 y un
// color de la lista COLORES_DE_RESERVA (siempre el mismo para esa categoría).
//
// Para cambiar un ícono o un color, cámbialo en la lista AREAS.
// Las palabras se escriben en minúsculas y sin tildes ("plomer" coincide con "Plomería").
// Si un nombre tiene palabras de dos áreas, gana la que está más arriba en la lista.

const AREAS = [
  { palabras: ['herramienta'], icono: '🔨', color: '#ff9d00' },
  { palabras: ['ferreter', 'tornill', 'clavo', 'fijacion'], icono: '🔩', color: '#20d1aa' },
  { palabras: ['plomer', 'tubo', 'fontaner', 'griferi'], icono: '🚰', color: '#3b9cff' },
  { palabras: ['electric', 'cable'], icono: '⚡', color: '#f7c948' },
  { palabras: ['iluminacion', 'lampara', 'foco'], icono: '💡', color: '#fde68a' },
  { palabras: ['pintur', 'solvente', 'barniz', 'thinner', 'aguarras'], icono: '🎨', color: '#b388ff' },
  { palabras: ['construc', 'cemento', 'bloque', 'albanil'], icono: '🧱', color: '#ff6b4a' },
  { palabras: ['cerrajer', 'candado', 'cerradura'], icono: '🔑', color: '#f472b6' },
  { palabras: ['seguridad', 'proteccion'], icono: '🦺', color: '#9be15d' },
  { palabras: ['jardin', 'agricol'], icono: '🌱', color: '#4ade80' },
  { palabras: ['madera'], icono: '🪵', color: '#c8946a' },
  { palabras: ['limpieza'], icono: '🧽', color: '#67e8f9' },
  { palabras: ['adhesiv', 'pegamento', 'sellador'], icono: '🧴', color: '#fb923c' },
  { palabras: ['hogar', 'cocina'], icono: '🏠', color: '#a3e635' },
  { palabras: ['automo', 'vehicul'], icono: '🚗', color: '#f87171' },
]

// Para las categorías que no coinciden con ninguna área de la lista.
const ICONO_DE_RESERVA = '📦'
const COLORES_DE_RESERVA = ['#2dd4e0', '#a78bfa', '#fb7185', '#facc15', '#34d399', '#60a5fa']

// 'Plomería y Tubos' → { icono: '🚰', color: '#3b9cff' }
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
