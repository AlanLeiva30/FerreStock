// ─────────────────────────────────────────────────────────────
// ACTUALIZACIONES DE LA BASE DE DATOS
// ─────────────────────────────────────────────────────────────
// Cuando una versión nueva del programa cambia la forma de guardar los datos,
// estas funciones convierten la base vieja al formato nuevo SIN perder nada.
// Antes de tocar algo, guardan una copia en data/respaldos/.

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORIAS_INICIALES } from './datosIniciales.js'
import { SQL_TABLA_CATEGORIAS, existeColumna, sqlTablaProductos, sqlTablaUsuarios } from './estructura.js'
import { transaccion } from './transaccion.js'

export function actualizarBaseAntigua(baseDeDatos, carpetaDeRespaldos) {
  // Versión 1.1 → 1.2: la categoría era un texto dentro de cada producto;
  // ahora las categorías tienen su propia tabla.
  if (existeColumna(baseDeDatos, 'productos', 'categoria')) {
    guardarRespaldo(baseDeDatos, carpetaDeRespaldos, 'antes-de-categorias')
    pasarCategoriasASuPropiaTabla(baseDeDatos)
  }
}

function pasarCategoriasASuPropiaTabla(baseDeDatos) {
  // Los movimientos "apuntan" a los productos. Mientras se reconstruye la tabla
  // de productos hay que apagar un momento esa revisión; al final se vuelve a encender.
  baseDeDatos.exec('PRAGMA foreign_keys = OFF')
  try {
    transaccion(baseDeDatos, () => {
      // 1. Crear la tabla de categorías con las de siempre y cualquier otra que ya se usara.
      baseDeDatos.exec(SQL_TABLA_CATEGORIAS)
      const agregarCategoria = baseDeDatos.prepare('INSERT OR IGNORE INTO categorias (nombre, orden) VALUES (?, ?)')
      const categoriasUsadas = baseDeDatos.prepare('SELECT DISTINCT categoria FROM productos').all().map((fila) => fila.categoria)
      ;[...CATEGORIAS_INICIALES, ...categoriasUsadas].forEach((nombre, posicion) => agregarCategoria.run(nombre, posicion + 1))

      // 2. Copiar los productos a una tabla nueva, cambiando el nombre de la categoría por su número (id).
      baseDeDatos.exec(sqlTablaProductos('productos_nueva'))
      baseDeDatos.exec(`
        INSERT INTO productos_nueva (id, codigo, nombre, categoria_id, unidad, stock, minimo, costo, precio, activo)
        SELECT p.id, p.codigo, p.nombre, c.id, p.unidad, p.stock, p.minimo, p.costo, p.precio, p.activo
        FROM productos p JOIN categorias c ON c.nombre = p.categoria`)

      // 3. Comprobar que no se perdió ningún producto.
      const antes = baseDeDatos.prepare('SELECT COUNT(*) AS n FROM productos').get().n
      const despues = baseDeDatos.prepare('SELECT COUNT(*) AS n FROM productos_nueva').get().n
      if (antes !== despues) throw new Error(`Actualización cancelada: había ${antes} productos y se copiaron ${despues}`)

      // 4. Cambiar la tabla vieja por la nueva y comprobar que los movimientos siguen bien enlazados.
      baseDeDatos.exec('DROP TABLE productos; ALTER TABLE productos_nueva RENAME TO productos;')
      if (baseDeDatos.prepare('PRAGMA foreign_key_check').all().length) {
        throw new Error('Actualización cancelada: hay movimientos que no encuentran su producto')
      }
    })
  } finally {
    baseDeDatos.exec('PRAGMA foreign_keys = ON')
  }
}

// Se llama DESPUÉS de crear las tablas que falten y de guardar la lista de roles.
export function actualizarTablasExistentes(baseDeDatos, carpetaDeRespaldos) {
  // Versión 1.2 → 1.3: los movimientos ahora recuerdan a qué venta pertenecen y a
  // qué precio se vendió cada producto. Se agregan esas dos columnas (vacías en
  // los movimientos anteriores); no se modifica ningún dato existente.
  if (!existeColumna(baseDeDatos, 'movimientos', 'venta_id')) {
    guardarRespaldo(baseDeDatos, carpetaDeRespaldos, 'antes-de-usuarios')
    baseDeDatos.exec(`
      ALTER TABLE movimientos ADD COLUMN venta_id INTEGER REFERENCES ventas(id);
      ALTER TABLE movimientos ADD COLUMN precio_unitario REAL;`)
  }
  baseDeDatos.exec('CREATE INDEX IF NOT EXISTS idx_movimientos_venta ON movimientos(venta_id);')

  // Versión 1.3 → 1.4: nuevo rol "trabajador" y la factura guarda los datos del cliente.
  const faltaElCliente = !existeColumna(baseDeDatos, 'ventas', 'cliente')
  const faltanRoles = usuariosSoloAceptanDosRoles(baseDeDatos)
  if (faltaElCliente || faltanRoles) guardarRespaldo(baseDeDatos, carpetaDeRespaldos, 'antes-de-roles')
  if (faltaElCliente) {
    baseDeDatos.exec(`
      ALTER TABLE ventas ADD COLUMN cliente TEXT NOT NULL DEFAULT 'Consumidor Final';
      ALTER TABLE ventas ADD COLUMN cliente_documento TEXT NOT NULL DEFAULT '';`)
  }
  if (faltanRoles) permitirRolesNuevos(baseDeDatos)

  // Versión 1.4 → 1.5: los usuarios se pueden eliminar. Los que ya hicieron ventas
  // no se borran de la base (sus facturas llevan su nombre): se marca la fecha en
  // que se eliminaron y dejan de aparecer. Se agrega esa columna (vacía para todos).
  if (!existeColumna(baseDeDatos, 'usuarios', 'eliminado')) {
    guardarRespaldo(baseDeDatos, carpetaDeRespaldos, 'antes-de-eliminar-usuarios')
    baseDeDatos.exec('ALTER TABLE usuarios ADD COLUMN eliminado TEXT;')
  }
}

// En la versión 1.3 la tabla de usuarios solo aceptaba 'administrador' o 'vendedor'
// (una regla CHECK escrita dentro de la tabla).
function usuariosSoloAceptanDosRoles(baseDeDatos) {
  const fila = baseDeDatos.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'").get()
  return Boolean(fila?.sql.includes('CHECK (rol IN'))
}

// SQLite no deja cambiar esa regla, así que se hace una tabla de usuarios nueva
// (que acepta cualquier rol de la tabla "roles"), se copian todos los usuarios
// tal cual (con sus mismas contraseñas) y se cambia la vieja por la nueva.
function permitirRolesNuevos(baseDeDatos) {
  baseDeDatos.exec('PRAGMA foreign_keys = OFF') // las ventas y sesiones "apuntan" a los usuarios
  try {
    transaccion(baseDeDatos, () => {
      // Las vistas se borran un momento (se vuelven a crear al final del arranque).
      for (const vista of baseDeDatos.prepare("SELECT name FROM sqlite_master WHERE type = 'view'").all()) {
        baseDeDatos.exec(`DROP VIEW "${vista.name}"`)
      }

      baseDeDatos.exec(sqlTablaUsuarios('usuarios_nueva'))
      baseDeDatos.exec(`
        INSERT INTO usuarios_nueva (id, usuario, nombre, rol, clave_hash, clave_sal, activo, creado)
        SELECT id, usuario, nombre, rol, clave_hash, clave_sal, activo, creado FROM usuarios`)

      const antes = baseDeDatos.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n
      const despues = baseDeDatos.prepare('SELECT COUNT(*) AS n FROM usuarios_nueva').get().n
      if (antes !== despues) throw new Error(`Actualización cancelada: había ${antes} usuarios y se copiaron ${despues}`)

      baseDeDatos.exec('DROP TABLE usuarios; ALTER TABLE usuarios_nueva RENAME TO usuarios;')
      if (baseDeDatos.prepare('PRAGMA foreign_key_check').all().length) {
        throw new Error('Actualización cancelada: hay ventas o sesiones que no encuentran su usuario')
      }
    })
  } finally {
    baseDeDatos.exec('PRAGMA foreign_keys = ON')
  }
}

// Guarda una copia completa de la base, por ejemplo: data/respaldos/antes-de-categorias-2026-09-23.db
// Si ya existe una copia con ese nombre (del mismo día), no la reemplaza.
function guardarRespaldo(baseDeDatos, carpetaDeRespaldos, nombre) {
  mkdirSync(carpetaDeRespaldos, { recursive: true })
  const hoy = new Date().toLocaleDateString('sv-SE') // formato AAAA-MM-DD, en hora local
  const archivo = join(carpetaDeRespaldos, `${nombre}-${hoy}.db`)
  if (!existsSync(archivo)) baseDeDatos.exec(`VACUUM INTO '${archivo.replaceAll("'", "''")}'`)
}
