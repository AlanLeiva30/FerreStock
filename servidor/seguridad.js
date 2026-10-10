// ─────────────────────────────────────────────────────────────
// SEGURIDAD: contraseñas y llaves de sesión
// ─────────────────────────────────────────────────────────────
// Las contraseñas NUNCA se guardan tal cual. Se guardan "revueltas" con una
// fórmula de un solo sentido (scrypt): se puede comprobar si una contraseña es
// correcta, pero no se puede recuperar la original a partir de lo guardado.
// La "sal" es un texto al azar distinto para cada usuario, para que dos personas
// con la misma contraseña no queden guardadas igual.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function protegerClave(clave) {
  const sal = randomBytes(16).toString('hex')
  const hash = scryptSync(clave, sal, 64).toString('hex')
  return { hash, sal }
}

export function claveCorrecta(clave, hashGuardado, sal) {
  const calculado = scryptSync(String(clave ?? ''), sal, 64)
  const guardado = Buffer.from(hashGuardado, 'hex')
  // timingSafeEqual compara en tiempo constante (no da pistas a quien intente adivinar).
  return guardado.length === calculado.length && timingSafeEqual(guardado, calculado)
}

// Llave de sesión: un texto largo al azar que el navegador guarda en una cookie.
export const nuevaLlaveDeSesion = () => randomBytes(32).toString('hex')

// En la base se guarda solo la "huella" de la llave. Si alguien copiara la base,
// no podría usar esas huellas para entrar.
export const huellaDeLaLlave = (llave) => createHash('sha256').update(llave).digest('hex')
