import { cambioAtomico } from './baseDeDatos.js'
export async function transaccion(baseDeDatos, trabajo) { return cambioAtomico(trabajo) }
