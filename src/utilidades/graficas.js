// ─────────────────────────────────────────────────────────────
// DATOS PARA LAS GRÁFICAS
// ─────────────────────────────────────────────────────────────
// Los usan la pantalla de Reportes y el informe que se imprime, para que ambos muestren lo mismo.

import { areaDeLaCategoria } from './areas.js'

// En el círculo caben bien unas 8 porciones: si hay más categorías, las más pequeñas se juntan en "Otras".
export const MAXIMO_DE_PORCIONES = 8

// Las porciones del círculo: categorías con stock, de mayor a menor valor, cada una con el color de su área.
// Si son más de MAXIMO_DE_PORCIONES, las más pequeñas se juntan en una porción gris "Otras".
export function porcionesDelInventario(categorias) {
  const porciones = categorias
    .filter((categoria) => categoria.valorCosto > 0)
    .sort((a, b) => b.valorCosto - a.valorCosto)
    .map((categoria) => {
      const { color } = areaDeLaCategoria(categoria.nombre) // el mismo color que en Vender
      return { clave: categoria.nombre, etiqueta: categoria.nombre, valor: categoria.valorCosto, color }
    })
  if (porciones.length <= MAXIMO_DE_PORCIONES) return porciones

  const grandes = porciones.slice(0, MAXIMO_DE_PORCIONES - 1)
  const pequenas = porciones.slice(MAXIMO_DE_PORCIONES - 1)
  const valorDeLasPequenas = pequenas.reduce((suma, porcion) => suma + porcion.valor, 0)
  return [...grandes, { clave: '(otras)', etiqueta: `Otras (${pequenas.length})`, valor: valorDeLasPequenas, color: '#8c9ab0' }]
}

// "jueves, 24 de septiembre" → "Jueves, 24 de septiembre"
export function conMayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
