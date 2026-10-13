// ─────────────────────────────────────────────────────────────
// ROLES: los tipos de usuario y qué puede hacer cada uno
// ─────────────────────────────────────────────────────────────
// Esta lista se copia a la tabla "roles" de la base de datos cada vez que se
// abre el programa, para que al revisar la base se vea qué significa cada rol.
//
//   clave       → cómo se guarda en la base (en la columna usuarios.rol); no cambiarla
//   nombre      → cómo se muestra en pantalla
//   descripcion → qué puede hacer (se muestra en el menú y en la pantalla Usuarios)
//
// OJO: cambiar una descripción aquí NO cambia los permisos. Los permisos reales
// están en servidor/api.js (columna "quién") y en src/Sistema.jsx (MENU).

export const ADMINISTRADOR = 'administrador'
export const VENDEDOR = 'vendedor'
export const TRABAJADOR = 'trabajador'

export const ROLES = [
  {
    clave: ADMINISTRADOR,
    nombre: 'Administrador',
    nombreFemenino: 'Administradora',
    descripcion: 'Puede hacer todo: productos, stock, categorías, ventas, reportes, usuarios y base de datos.',
  },
  {
    clave: VENDEDOR,
    nombre: 'Vendedor',
    nombreFemenino: 'Vendedora',
    descripcion: 'Consulta el inventario (solo lectura y sin costos), arma la venta, cobra e imprime la factura. Recibe avisos de poco stock y agotados.',
  },
  {
    clave: TRABAJADOR,
    nombre: 'Trabajador de almacén',
    nombreFemenino: 'Trabajadora de almacén',
    descripcion: 'Solo consulta el stock de lo que hay en el almacén (sin precios ni costos).',
  },
]

// El nombre de un rol depende del sexo de la persona: una mujer es "Administradora", "Vendedora"
// o "Trabajadora de almacén". sexo = 'F' (femenino) o 'M' (masculino); sin dato se usa el masculino.
export function nombreDelRol(clave, sexo) {
  const rol = ROLES.find((opcion) => opcion.clave === clave)
  if (!rol) return clave
  return sexo === 'F' ? rol.nombreFemenino : rol.nombre
}

// Recibe una fila con "rol" y "sexo" y pone en "rol_nombre" el nombre que le toca a esa persona.
export function conNombreDeRol(fila) {
  return fila?.rol ? { ...fila, rol_nombre: nombreDelRol(fila.rol, fila.sexo) } : fila
}

// Copia la lista anterior a la tabla "roles" (agrega los que falten y actualiza los textos).
export function guardarRolesEnLaBase(baseDeDatos) {
  const guardar = baseDeDatos.prepare(`
    INSERT INTO roles (clave, nombre, descripcion, orden) VALUES (?, ?, ?, ?)
    ON CONFLICT (clave) DO UPDATE SET nombre = excluded.nombre, descripcion = excluded.descripcion, orden = excluded.orden`)
  ROLES.forEach((rol, posicion) => guardar.run(rol.clave, rol.nombre, rol.descripcion, posicion + 1))
}
