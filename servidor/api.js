import { cambioAtomico } from './baseDeDatos.js'
// ─────────────────────────────────────────────────────────────
// API: LA "RECEPCIÓN" DEL SERVIDOR
// ─────────────────────────────────────────────────────────────
// Cada vez que una pantalla pide o envía algo, la petición llega aquí.
// La lista RUTAS dice, para cada pedido, QUIÉN puede hacerlo y QUÉ función lo atiende:
//
//   PUBLICO          → cualquiera, aunque no haya iniciado sesión (solo lo del ingreso)
//   TODOS            → cualquier usuario con sesión (administrador, vendedor o trabajador)
//   VENDEDOR_Y_ADMIN → el vendedor y el administrador (cobrar y facturar)
//   SOLO_ADMIN       → solo el administrador
//
// Los permisos se revisan AQUÍ, en el servidor. Aunque alguien lograra ver un
// botón que no le corresponde, el servidor igual rechazaría el pedido.
//
// Los métodos significan:
//   GET = pedir datos · POST = crear · PUT = modificar · PATCH = cambiar un detalle · DELETE = borrar
// ":id" es el número del producto, categoría, usuario o venta (por ejemplo /productos/5).

import { borrarCategoria, crearCategoria, listarCategorias, moverCategoria, renombrarCategoria } from './categorias.js'
import { CODIGOS, ErrorParaElUsuario, leerDatosEnviados, responder, responderError } from './http.js'
import { MOTIVOS } from './motivos.js'
import { listarMovimientos, registrarMovimiento } from './movimientos.js'
import { datosDelNegocio, guardarDatosDelNegocio } from './negocio.js'
import { activarODesactivarProducto, crearProducto, editarProducto, listarProductos } from './productos.js'
import { ADMINISTRADOR, TRABAJADOR, VENDEDOR } from './roles.js'
import { cerrarSesion, configurarPrimerAdministrador, estadoDeSesion, iniciarSesion, usuarioDeLaPeticion } from './sesiones.js'
import { crearUsuario, editarUsuario, eliminarUsuario, listarRoles, listarUsuarios } from './usuarios.js'
import { cobrarVenta, ventasDeHoy, ventasPorDia, verFactura } from './ventas.js'
import { listarTablasYVistas, verContenido } from './visorDeBase.js'

const PUBLICO = 'publico'
const TODOS = [ADMINISTRADOR, VENDEDOR, TRABAJADOR]
const VENDEDOR_Y_ADMIN = [ADMINISTRADOR, VENDEDOR]
const SOLO_ADMIN = [ADMINISTRADOR]

const RUTAS = [
  // método    dirección                   quién              qué hacer
  // Ingreso
  ['GET',    '/sesion',                   PUBLICO,           ({ peticion }) => estadoDeSesion(peticion)],
  ['POST',   '/sesion/iniciar',           PUBLICO,           ({ datos, respuesta }) => iniciarSesion(datos, respuesta)],
  ['POST',   '/sesion/configurar',        PUBLICO,           ({ datos, respuesta }) => configurarPrimerAdministrador(datos, respuesta)],
  ['POST',   '/sesion/cerrar',            PUBLICO,           ({ peticion, respuesta }) => cerrarSesion(peticion, respuesta)],

  // Todos: la lista de productos (cada rol recibe solo los datos que le tocan, ver productos.js)
  ['GET',    '/productos',                TODOS,             ({ usuario }) => listarProductos(usuario)],

  // Vendedor y administrador: cobrar y ver o reimprimir facturas
  ['POST',   '/ventas',                   VENDEDOR_Y_ADMIN,  ({ datos, usuario }) => cobrarVenta(datos, usuario)],
  ['GET',    '/ventas/hoy',               VENDEDOR_Y_ADMIN,  ({ usuario }) => ventasDeHoy(usuario)],
  ['GET',    '/ventas/:id',               VENDEDOR_Y_ADMIN,  ({ id, usuario }) => verFactura(id, usuario)],

  // Solo el administrador
  ['GET',    '/configuracion',            SOLO_ADMIN,        async () => ({ categorias: await listarCategorias(), motivos: MOTIVOS })],

  ['POST',   '/categorias',               SOLO_ADMIN,        ({ datos }) => crearCategoria(datos)],
  ['PUT',    '/categorias/:id',           SOLO_ADMIN,        ({ id, datos }) => renombrarCategoria(id, datos)],
  ['POST',   '/categorias/:id/mover',     SOLO_ADMIN,        ({ id, datos }) => moverCategoria(id, datos)],
  ['DELETE', '/categorias/:id',           SOLO_ADMIN,        ({ id }) => borrarCategoria(id)],

  ['POST',   '/productos',                SOLO_ADMIN,        ({ datos }) => crearProducto(datos)],
  ['PUT',    '/productos/:id',            SOLO_ADMIN,        ({ id, datos }) => editarProducto(id, datos)],
  ['PATCH',  '/productos/:id/activo',     SOLO_ADMIN,        ({ id, datos }) => activarODesactivarProducto(id, datos)],

  ['GET',    '/movimientos',              SOLO_ADMIN,        ({ parametros }) => listarMovimientos(parametros.get('limite'))],
  ['POST',   '/movimientos',              SOLO_ADMIN,        ({ datos, usuario }) => registrarMovimiento(datos, usuario)],

  ['GET',    '/usuarios',                 SOLO_ADMIN,        () => listarUsuarios()],
  ['POST',   '/usuarios',                 SOLO_ADMIN,        ({ datos }) => crearUsuario(datos)],
  ['PUT',    '/usuarios/:id',             SOLO_ADMIN,        ({ id, datos, usuario }) => editarUsuario(id, datos, usuario)],
  ['DELETE', '/usuarios/:id',             SOLO_ADMIN,        ({ id, usuario }) => eliminarUsuario(id, usuario)],
  ['GET',    '/roles',                    SOLO_ADMIN,        () => listarRoles()],

  // Gráfica de Reportes: ventas de cada día. Ejemplo: /reportes/ventas-por-dia?dias=7
  ['GET',    '/reportes/ventas-por-dia',  SOLO_ADMIN,        ({ parametros }) => ventasPorDia(parametros.get('dias'))],

  // Datos de la ferretería que salen en la factura
  ['GET',    '/negocio',                  SOLO_ADMIN,        () => datosDelNegocio()],
  ['PUT',    '/negocio',                  SOLO_ADMIN,        ({ datos }) => guardarDatosDelNegocio(datos)],

  // Pantalla "Base de Datos" (solo lectura). Ejemplo: /base-de-datos/contenido?nombre=productos
  ['GET',    '/base-de-datos',            SOLO_ADMIN,        () => listarTablasYVistas()],
  ['GET',    '/base-de-datos/contenido',  SOLO_ADMIN,        ({ parametros }) => verContenido(parametros.get('nombre'))],
]

// Esta función la llama Vite (ver vite.config.js) por cada petición que empieza con /api.
export async function atenderPeticion(peticion, respuesta) {
  const url = new URL(peticion.url, 'http://localhost')
  try {
    const ruta = buscarRuta(peticion.method, url.pathname)
    if (!ruta) throw new ErrorParaElUsuario(CODIGOS.NO_EXISTE, 'Ruta no encontrada')

    // ¿Tiene permiso?
    const usuario = await usuarioDeLaPeticion(peticion)
    if (ruta.quien !== PUBLICO) {
      if (!usuario) throw new ErrorParaElUsuario(CODIGOS.NO_AUTORIZADO, 'Tu sesión terminó. Vuelve a iniciar sesión.')
      if (!ruta.quien.includes(usuario.rol)) {
        const mensaje = ruta.quien === SOLO_ADMIN ? 'Solo un administrador puede hacer esto' : 'Tu rol no tiene permiso para hacer esto'
        throw new ErrorParaElUsuario(CODIGOS.PROHIBIDO, mensaje)
      }
    }

    const traeDatos = ['POST', 'PUT', 'PATCH'].includes(peticion.method)
    const datos = traeDatos ? await leerDatosEnviados(peticion) : null
    const ejecutar = async () => {
      // Revalida permisos dentro del bloqueo antes de cualquier escritura.
      const actual = await usuarioDeLaPeticion(peticion)
      if (ruta.quien !== PUBLICO && (!actual || !ruta.quien.includes(actual.rol))) {
        throw new ErrorParaElUsuario(CODIGOS.PROHIBIDO, 'Tu permiso cambió. Vuelve a iniciar sesión.')
      }
      return ruta.accion({ id: ruta.id, datos, parametros: url.searchParams, usuario: actual, peticion, respuesta })
    }
    const resultado = peticion.method === 'GET' ? await ejecutar() : await cambioAtomico(ejecutar)

    responder(respuesta, peticion.method === 'POST' ? CODIGOS.CREADO : CODIGOS.OK, resultado)
  } catch (error) {
    responderError(respuesta, error)
  }
}

// Busca en RUTAS la que coincide con el método y la dirección pedidos.
function buscarRuta(metodo, direccion) {
  for (const [metodoDeLaRuta, patron, quien, accion] of RUTAS) {
    if (metodoDeLaRuta !== metodo) continue
    const coincidencia = direccion.match(new RegExp(`^${patron.replace(':id', '(\\d+)')}$`))
    if (coincidencia) return { accion, quien, id: coincidencia[1] ? Number(coincidencia[1]) : undefined }
  }
  return null
}
