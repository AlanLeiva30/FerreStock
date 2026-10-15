// ─────────────────────────────────────────────────────────────
// CHEQUECITOS (los recibos de tus mensajes del chat, como en WhatsApp)
// ─────────────────────────────────────────────────────────────
//   estado: 'enviado'   → el mensaje llegó al servidor              (un ✓)
//           'entregado' → a la otra persona le llegó a su pantalla  (dos ✓✓ grises)
//           'leido'     → ya lo leyó                                (dos ✓✓ de color)
//
// Cada persona elige cómo los ve en «Ajustes de mi cuenta → Chat»:
//   estilo → 'clasico' (✓ ✓✓) · 'circulos' (● ●●) · 'iconos' (avión, ✓✓, ojo) · 'palabras' (Enviado, Entregado, Leído)
//   color  → el color de «leído»: azul, verde, naranja, morado o rosa
// Los ajustes están en usuario.preferencias (chequesEstilo y chequesColor) y no cambian lo que ven las demás personas.

import Icono from './Icono.jsx'

export const ESTILOS_DE_CHEQUES = [
  { clave: 'clasico', texto: 'Clásico' },
  { clave: 'circulos', texto: 'Círculos' },
  { clave: 'iconos', texto: 'Íconos' },
  { clave: 'palabras', texto: 'Palabras' },
]
export const COLORES_DE_CHEQUES = [
  { clave: 'azul', texto: 'Azul', color: '#34b7f1' },
  { clave: 'verde', texto: 'Verde', color: '#25d366' },
  { clave: 'naranja', texto: 'Naranja', color: '#ffb000' },
  { clave: 'morado', texto: 'Morado', color: '#a78bfa' },
  { clave: 'rosa', texto: 'Rosa', color: '#f472b6' },
]
const NOMBRES = { enviado: 'Enviado', entregado: 'Entregado', leido: 'Leído' }

// Una palomita (✓) dibujada como imagen para que se vea igual en todos los navegadores.
const Palomita = ({ x = 0 }) => <path d="m4 12.5 4 4L16 8" transform={`translate(${x} 0)`} />

export default function Cheques({ estado, preferencias = {}, titulo }) {
  const estilo = ESTILOS_DE_CHEQUES.some((opcion) => opcion.clave === preferencias.chequesEstilo) ? preferencias.chequesEstilo : 'clasico'
  const color = COLORES_DE_CHEQUES.find((opcion) => opcion.clave === preferencias.chequesColor)?.color ?? COLORES_DE_CHEQUES[0].color
  const leido = estado === 'leido'
  const estiloDelColor = leido ? { color } : undefined
  const clase = `cheques ${estado}`

  if (estilo === 'palabras') {
    return <span className={`${clase} palabras`} style={estiloDelColor} title={titulo ?? NOMBRES[estado]}>{NOMBRES[estado]}</span>
  }
  if (estilo === 'circulos') {
    const puntos = estado === 'enviado' ? 1 : 2
    return (
      <span className={`${clase} circulos`} style={estiloDelColor} title={titulo ?? NOMBRES[estado]} role="img" aria-label={NOMBRES[estado]}>
        {Array.from({ length: puntos }, (_, i) => <i key={i} />)}
      </span>
    )
  }
  if (estilo === 'iconos') {
    return (
      <span className={`${clase} iconos`} style={estiloDelColor} title={titulo ?? NOMBRES[estado]} role="img" aria-label={NOMBRES[estado]}>
        {estado === 'enviado' && <Icono nombre="enviar" tamano={13} />}
        {estado === 'entregado' && <svg width="17" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><Palomita x={-3} /><Palomita x={3} /></svg>}
        {leido && <Icono nombre="ojo" tamano={15} />}
      </span>
    )
  }
  // clásico: ✓ (enviado) · ✓✓ (entregado y leído)
  return (
    <span className={`${clase} clasico`} style={estiloDelColor} title={titulo ?? NOMBRES[estado]} role="img" aria-label={NOMBRES[estado]}>
      <svg width={estado === 'enviado' ? 14 : 18} height="14" viewBox={estado === 'enviado' ? '2 3 18 18' : '0 3 26 18'} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {estado === 'enviado' ? <Palomita /> : <><Palomita x={-1} /><Palomita x={5} /></>}
      </svg>
    </span>
  )
}
