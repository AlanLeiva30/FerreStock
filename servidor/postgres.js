// Conexión privada a Supabase, importada únicamente por el servidor.
import pg from 'pg'
import { AsyncLocalStorage } from 'node:async_hooks'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

const config = { ...parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8')), ...process.env }
if (!config.PGPASSWORD || config.PGPASSWORD === 'ESCRIBE_AQUI_TU_CONTRASENA') throw new Error('Falta configurar la contraseña de Supabase en .env.local')
const contexto = new AsyncLocalStorage()
pg.types.setTypeParser(20, value => {
  const n = Number(value)
  if (!Number.isSafeInteger(n)) throw new Error('Identificador fuera del rango admitido')
  return n
})
pg.types.setTypeParser(1700, Number)
pg.types.setTypeParser(1082, value => value)
const pool = new pg.Pool({
  host: config.PGHOST, port: Number(config.PGPORT || 5432), database: config.PGDATABASE,
  user: config.PGUSER, password: config.PGPASSWORD,
  ssl: { rejectUnauthorized: true, ca: readFileSync(new URL('./supabase-ca.crt', import.meta.url), 'utf8') }, max: 5,
  connectionTimeoutMillis: 15000, idleTimeoutMillis: 30000,
  statement_timeout: 20000,
  options: '-c search_path=public -c timezone=America/El_Salvador',
})
pool.on('error', error => console.error('[Supabase] Conexión interrumpida:', error.code || 'desconocido'))

export async function consultar(sql, valores = []) {
  return (contexto.getStore() || pool).query(sql, valores)
}
export const bd = {
  prepare(sql) {
    function parametros(args) {
      let index = 0
      if (args.length === 1 && args[0] && typeof args[0] === 'object') {
        const valores = []
        const texto = sql.replace(/(?<!:):([a-z_]+)/g, (_, nombre) => {
          valores.push(args[0][nombre]); return '$' + valores.length
        })
        return [texto, valores]
      }
      return [sql.replace(/\?/g, () => '$' + (++index)), args]
    }
    return {
      async all(...args) { return (await consultar(...parametros(args))).rows },
      async get(...args) { return (await consultar(...parametros(args))).rows[0] },
      async run(...args) {
        let [texto, valores] = parametros(args)
        if (/^\s*INSERT INTO (categorias|productos|usuarios|ventas|movimientos)\b/i.test(texto)) texto += ' RETURNING id'
        const result = await consultar(texto, valores)
        return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id }
      },
    }
  },
  exec: sql => consultar(sql),
}
export async function enTransaccion(trabajo) {
  if (contexto.getStore()) return trabajo()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await contexto.run(client, trabajo)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally { client.release() }
}
// Serializa las escrituras de la aplicación, incluso entre distintas instancias.
export async function cambioAtomico(trabajo) {
  return enTransaccion(async () => {
    await consultar('SELECT pg_advisory_xact_lock(726491830)')
    return trabajo()
  })
}
export const cerrarBase = () => pool.end()
