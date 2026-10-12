// Casilla de CONTRASEÑA con un botón de ojo a la derecha para mostrar u ocultar lo
// que se escribió. Sirve para revisar que la contraseña esté bien escrita antes
// de entrar o de guardarla.
//
// Se usa igual que un <input>, pero con "valor" y "alCambiar":
//   <CampoClave valor={clave} alCambiar={setClave} required />

import { useState } from 'react'
import Icono from './Icono.jsx'

export default function CampoClave({ valor, alCambiar, ...otrasOpciones }) {
  const [visible, setVisible] = useState(false) // false = puntitos ••••, true = se lee la contraseña
  const texto = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'

  return (
    <span className="campo-clave">
      <input type={visible ? 'text' : 'password'} value={valor} onChange={(evento) => alCambiar(evento.target.value)}
        autoCapitalize="none" spellCheck="false" {...otrasOpciones} />
      <button type="button" className={visible ? 'ver-clave on' : 'ver-clave'} onClick={() => setVisible(!visible)}
        aria-label={texto} aria-pressed={visible} title={texto}>
        <Icono nombre={visible ? 'ojoCerrado' : 'ojo'} tamano={18} />
      </button>
    </span>
  )
}
