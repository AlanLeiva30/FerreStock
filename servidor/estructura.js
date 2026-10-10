// ─────────────────────────────────────────────────────────────
// ESTRUCTURA DE LA BASE DE DATOS
// ─────────────────────────────────────────────────────────────
// La base de datos guarda la información en TABLAS, parecidas a hojas de
// Excel: columnas con nombre y una fila por cada registro.
//
//   categorias   → una fila por categoría (Herramientas, Plomería…) y su orden
//   productos    → una fila por producto; cada uno pertenece a una categoría
//   movimientos  → una fila por cada entrada o salida de mercadería
//   roles        → los tipos de usuario (administrador, vendedor, trabajador) y qué puede hacer cada uno
//   usuarios     → quién puede entrar al programa y con qué rol
//   sesiones     → quién tiene la sesión abierta en este momento
//   ventas       → una fila por cada cobro hecho en la pantalla "Vender" (cada una es una factura)
//   negocio      → los datos de la ferretería que salen en la factura (nombre, dirección…)
//
// También crea VISTAS: "tablas" de solo lectura que se calculan solas a partir
// de las anteriores. Sirven para revisar la base ordenada por categoría con
// SQLite Viewer. El programa no las usa; son solo para mirar.
//
// Las instrucciones entre comillas invertidas (`...`) están en SQL, el idioma
// que entienden las bases de datos.

import { transaccion } from './transaccion.js'

// Tabla de CATEGORÍAS.
//   nombre → no se puede repetir (sin importar mayúsculas o minúsculas)
//   orden  → posición en la lista (1 = la primera)
export const SQL_TABLA_CATEGORIAS = `
  CREATE TABLE IF NOT EXISTS categorias (
    id     INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
    orden  INTEGER NOT NULL DEFAULT 0
  );`

// Tabla de PRODUCTOS. Es una función porque, al actualizar una base vieja,
// primero se crea con otro nombre (ver actualizaciones.js).
//   codigo       → no se puede repetir
//   categoria_id → número (id) de la categoría a la que pertenece
//   CHECK (...)  → la base rechaza números negativos
//   activo       → 1 = en uso, 0 = desactivado (no se borra, para conservar su historial)
export function sqlTablaProductos(nombreDeLaTabla) {
  return `
  CREATE TABLE IF NOT EXISTS ${nombreDeLaTabla} (
    id           INTEGER PRIMARY KEY,
    codigo       TEXT NOT NULL UNIQUE,
    nombre       TEXT NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    unidad       TEXT NOT NULL,
    stock        REAL NOT NULL DEFAULT 0 CHECK (stock >= 0),
    minimo       REAL NOT NULL DEFAULT 0 CHECK (minimo >= 0),
    costo        REAL NOT NULL DEFAULT 0 CHECK (costo >= 0),
    precio       REAL NOT NULL DEFAULT 0 CHECK (precio >= 0),
    activo       INTEGER NOT NULL DEFAULT 1
  );`
}

// Tabla de MOVIMIENTOS (el historial). Solo se agregan filas: nunca se modifican ni se borran.
//   tipo            → 'entrada' (suma al stock) o 'salida' (resta del stock)
//   usuario         → nombre de quien lo registró
//   venta_id        → número de la venta, si el movimiento salió de un cobro (si no, vacío)
//   precio_unitario → precio al que se vendió (solo en ventas)
//   fecha           → se guarda en hora universal (UTC); la vista movimientos_detalle la muestra en hora local
const SQL_TABLA_MOVIMIENTOS = `
  CREATE TABLE IF NOT EXISTS movimientos (
    id              INTEGER PRIMARY KEY,
    producto_id     INTEGER NOT NULL REFERENCES productos(id),
    tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    motivo          TEXT NOT NULL,
    cantidad        REAL NOT NULL CHECK (cantidad > 0),
    usuario         TEXT NOT NULL,
    nota            TEXT NOT NULL DEFAULT '',
    fecha           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    venta_id        INTEGER REFERENCES ventas(id),
    precio_unitario REAL
  );`

// Tabla de ROLES: los tipos de usuario. Se llena sola con la lista de servidor/roles.js.
//   clave → 'administrador', 'vendedor' o 'trabajador' (es lo que se guarda en usuarios.rol)
const SQL_TABLA_ROLES = `
  CREATE TABLE IF NOT EXISTS roles (
    clave       TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0
  );`

// Tabla de USUARIOS. Es una función porque, al actualizar una base vieja,
// primero se crea con otro nombre (ver actualizaciones.js).
//   usuario    → el nombre con que se entra (ej. "maria"); no se puede repetir
//   nombre     → el nombre completo que se muestra (ej. "María López")
//   rol        → uno de la tabla "roles": 'administrador', 'vendedor' o 'trabajador'
//   clave_hash → la contraseña NO se guarda tal cual: se guarda "revuelta" (ver seguridad.js),
//   clave_sal     así nadie puede leerla, ni siquiera abriendo la base de datos
//   activo     → 1 = puede entrar, 0 = desactivado
//   eliminado  → vacío = sigue en el equipo; con fecha = se eliminó ese día (solo quedan
//                así los que tenían ventas; los demás se borran por completo)
export function sqlTablaUsuarios(nombreDeLaTabla) {
  return `
  CREATE TABLE IF NOT EXISTS ${nombreDeLaTabla} (
    id         INTEGER PRIMARY KEY,
    usuario    TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nombre     TEXT NOT NULL,
    rol        TEXT NOT NULL REFERENCES roles(clave),
    clave_hash TEXT NOT NULL,
    clave_sal  TEXT NOT NULL,
    activo     INTEGER NOT NULL DEFAULT 1,
    creado     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    eliminado  TEXT
  );`
}

// Tabla de SESIONES: una fila por cada persona con la sesión abierta.
// Se guarda una "huella" de la llave de la sesión, no la llave en sí.
const SQL_TABLA_SESIONES = `
  CREATE TABLE IF NOT EXISTS sesiones (
    token_hash TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    expira     TEXT NOT NULL
  );`

// Tabla de VENTAS: una fila por cada cobro. El número de la venta (id) es el
// número de la factura. Los productos vendidos quedan en "movimientos" (como
// salidas) con el número de la venta en venta_id.
//   cliente           → nombre del cliente ("Consumidor Final" si no se escribe)
//   cliente_documento → DUI o NIT del cliente (vacío si no se escribe)
//   recibido          → efectivo que entregó el cliente (vacío si no se anotó)
//   cambio            → vuelto que se le dio
const SQL_TABLA_VENTAS = `
  CREATE TABLE IF NOT EXISTS ventas (
    id                INTEGER PRIMARY KEY,
    usuario_id        INTEGER NOT NULL REFERENCES usuarios(id),
    total             REAL NOT NULL CHECK (total >= 0),
    recibido          REAL,
    cambio            REAL,
    fecha             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    cliente           TEXT NOT NULL DEFAULT 'Consumidor Final',
    cliente_documento TEXT NOT NULL DEFAULT ''
  );`

// Tabla del NEGOCIO: una sola fila (id = 1) con los datos que salen arriba y
// abajo de la factura. El administrador los cambia en Vender → "Datos de la factura".
const SQL_TABLA_NEGOCIO = `
  CREATE TABLE IF NOT EXISTS negocio (
    id        INTEGER PRIMARY KEY CHECK (id = 1),
    nombre    TEXT NOT NULL DEFAULT 'Ferretería Medrano',
    direccion TEXT NOT NULL DEFAULT '',
    telefono  TEXT NOT NULL DEFAULT '',
    documento TEXT NOT NULL DEFAULT '',
    mensaje   TEXT NOT NULL DEFAULT '¡Gracias por su compra!'
  );
  INSERT OR IGNORE INTO negocio (id) VALUES (1);`

// Crea las tablas que falten. Si ya existen, no las toca.
// Los INDEX son como el índice de un libro: hacen más rápidas las búsquedas.
export function crearTablas(baseDeDatos) {
  baseDeDatos.exec(`
    ${SQL_TABLA_CATEGORIAS}
    ${sqlTablaProductos('productos')}
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id, nombre);
    ${SQL_TABLA_ROLES}
    ${sqlTablaUsuarios('usuarios')}
    ${SQL_TABLA_SESIONES}
    ${SQL_TABLA_VENTAS}
    CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
    ${SQL_TABLA_MOVIMIENTOS}
    CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha DESC);
    ${SQL_TABLA_NEGOCIO}`)
}

// Borra y vuelve a crear todas las vistas. Se llama al abrir el programa y cada
// vez que se crea, renombra, mueve o borra una categoría.
export function actualizarVistas(baseDeDatos) {
  const vistasActuales = baseDeDatos.prepare("SELECT name FROM sqlite_master WHERE type = 'view'").all()
  const categorias = baseDeDatos.prepare('SELECT id, nombre FROM categorias ORDER BY orden, nombre').all()

  transaccion(baseDeDatos, () => {
    for (const vista of vistasActuales) baseDeDatos.exec(`DROP VIEW "${vista.name}"`)

    baseDeDatos.exec(`
      -- Todos los productos, ordenados por categoría y luego por nombre, con su estado.
      CREATE VIEW productos_por_categoria AS
        SELECT c.orden AS orden_categoria, c.nombre AS categoria, p.codigo, p.nombre, p.unidad,
          p.stock, p.minimo, p.costo, p.precio,
          CASE WHEN p.activo = 0 THEN 'INACTIVO'
               WHEN p.stock <= 0 THEN 'AGOTADO'
               WHEN p.stock < p.minimo THEN 'STOCK BAJO'
               ELSE 'OK' END AS estado,
          p.categoria_id
        FROM productos p JOIN categorias c ON c.id = p.categoria_id
        ORDER BY c.orden, c.nombre, p.nombre;

      -- Resumen por categoría: cuántos productos activos, cuántas unidades y cuánto valen.
      CREATE VIEW inventario_por_categoria AS
        SELECT c.orden, c.nombre AS categoria, COUNT(p.id) AS productos_activos,
          COALESCE(SUM(p.stock), 0) AS unidades,
          ROUND(COALESCE(SUM(p.stock * p.costo), 0), 2) AS valor_costo,
          ROUND(COALESCE(SUM(p.stock * p.precio), 0), 2) AS valor_venta
        FROM categorias c LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
        GROUP BY c.id ORDER BY c.orden, c.nombre;

      -- Historial de movimientos con la fecha en hora local y el nombre del producto.
      CREATE VIEW movimientos_detalle AS
        SELECT m.id, datetime(m.fecha, 'localtime') AS fecha_local, c.nombre AS categoria, p.codigo,
          p.nombre AS producto, m.tipo, m.motivo, m.cantidad, p.unidad, m.usuario, m.nota, m.venta_id AS factura
        FROM movimientos m
          JOIN productos p ON p.id = m.producto_id
          JOIN categorias c ON c.id = p.categoria_id
        ORDER BY m.fecha DESC;

      -- Ventas (facturas) con la fecha en hora local, quién cobró, el cliente y cuántos productos llevó.
      CREATE VIEW ventas_detalle AS
        SELECT v.id AS factura, datetime(v.fecha, 'localtime') AS fecha_local, u.nombre AS vendedor,
          v.cliente, v.cliente_documento, v.total, v.recibido, v.cambio,
          (SELECT COUNT(*) FROM movimientos m WHERE m.venta_id = v.id) AS productos
        FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
        ORDER BY v.fecha DESC;

      -- Usuarios con su rol, qué puede hacer y cuánto ha vendido (sin contraseñas).
      CREATE VIEW usuarios_detalle AS
        SELECT u.id, u.nombre, u.usuario, r.nombre AS rol, r.descripcion AS que_puede_hacer,
          CASE WHEN u.eliminado IS NOT NULL THEN 'ELIMINADO' WHEN u.activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END AS estado,
          datetime(u.creado, 'localtime') AS creado_local,
          (SELECT COUNT(*) FROM ventas v WHERE v.usuario_id = u.id) AS ventas,
          (SELECT ROUND(COALESCE(SUM(v.total), 0), 2) FROM ventas v WHERE v.usuario_id = u.id) AS total_vendido
        FROM usuarios u JOIN roles r ON r.clave = u.rol
        ORDER BY r.orden, u.activo DESC, u.nombre;`)

    // Una vista por categoría: cat_01_herramientas, cat_02_ferreteria, …
    categorias.forEach((categoria, posicion) => {
      const nombreDeLaVista = `cat_${String(posicion + 1).padStart(2, '0')}_${nombreParaVista(categoria.nombre)}`
      baseDeDatos.exec(`
        CREATE VIEW "${nombreDeLaVista}" AS
          SELECT codigo, nombre, unidad, stock, minimo, costo, precio, estado
          FROM productos_por_categoria WHERE categoria_id = ${Number(categoria.id)}`)
    })
  })
}

// ¿Existe esta tabla en la base?
export function existeTabla(baseDeDatos, tabla) {
  return Boolean(baseDeDatos.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tabla))
}

// ¿Existe esta columna dentro de esta tabla?
export function existeColumna(baseDeDatos, tabla, columna) {
  if (!existeTabla(baseDeDatos, tabla)) return false
  return baseDeDatos.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === columna)
}

// "Plomería y Tubos" → "plomeria_y_tubos" (sin acentos, espacios ni símbolos).
function nombreParaVista(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // todo lo que no sea letra o número → guion bajo
    .replace(/^_|_$/g, '') || 'categoria'
}
