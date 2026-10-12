import { consultar } from './baseDeDatos.js'
import { CODIGOS, ErrorParaElUsuario } from '../comun/http.js'
import { VISTAS } from './vistasConsulta.js'
const TABLAS = ['categorias', 'productos', 'movimientos', 'ventas', 'usuarios', 'roles', 'negocio']
const OCULTAS = ['clave_hash', 'clave_sal']
const MAXIMO = 1000
async function vistasDisponibles() {
  const vistas = { ...VISTAS }
  const categorias = (await consultar('SELECT id, nombre FROM public.categorias ORDER BY orden, nombre')).rows
  categorias.forEach((c, i) => {
    const nombre = c.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    vistas[`cat_${String(i + 1).padStart(2, '0')}_${nombre}`] = `SELECT codigo, nombre, unidad, stock, minimo, costo, precio, estado FROM (${VISTAS.productos_por_categoria}) AS p WHERE categoria_id = ${Number(c.id)}`
  })
  return vistas
}
export async function listarTablasYVistas() {
  const result = []
  for (const nombre of TABLAS) {
    const { rows } = await consultar(`SELECT count(*) AS n FROM public."${nombre}"`)
    result.push({ nombre, tipo: 'table', filas: rows[0].n })
  }
  for (const [nombre, sql] of Object.entries(await vistasDisponibles()).sort(([a], [b]) => a.localeCompare(b))) {
    const { rows } = await consultar(`SELECT count(*) AS n FROM (${sql}) AS vista`)
    result.push({ nombre, tipo: 'view', filas: rows[0].n })
  }
  return result
}
export async function verContenido(nombre) {
  const vistas = await vistasDisponibles()
  if (Object.hasOwn(vistas, nombre)) {
    const sql = vistas[nombre]
    const { rows, fields } = await consultar(`SELECT * FROM (${sql}) AS vista LIMIT ${MAXIMO}`)
    const total = (await consultar(`SELECT count(*) AS n FROM (${sql}) AS vista`)).rows[0].n
    return { nombre, tipo: 'view', columnas: fields.map(f => ({ nombre: f.name, tipo: '', esClave: false })), filas: rows, total, maximo: MAXIMO }
  }
  if (!TABLAS.includes(nombre)) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Tabla no disponible')
  const { rows } = await consultar(`SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [nombre])
  const columnas = rows.filter(c => !OCULTAS.includes(c.column_name)).map(c => ({
    nombre: c.column_name, tipo: c.data_type, esClave: c.column_name === (nombre === 'roles' ? 'clave' : 'id'),
  }))
  const lista = columnas.map(c => '"' + c.nombre + '"').join(', ')
  const filas = (await consultar(`SELECT ${lista} FROM public."${nombre}" ORDER BY 1 LIMIT ${MAXIMO}`)).rows
  const total = (await consultar(`SELECT count(*) AS n FROM public."${nombre}"`)).rows[0].n
  return { nombre, tipo: 'table', columnas, filas, total, maximo: MAXIMO }
}
