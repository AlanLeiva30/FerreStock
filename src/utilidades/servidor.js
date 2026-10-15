// ─────────────────────────────────────────────────────────────
// COMUNICACIÓN CON EL SERVIDOR
// ─────────────────────────────────────────────────────────────
// Las pantallas no tocan la base de datos directamente: le piden las cosas al
// servidor (carpeta /servidor) usando estas funciones.
//
// "async" y "await" significan "esperar la respuesta": el servidor tarda un
// instante en contestar y el programa espera antes de seguir.
//
// La sesión viaja sola en una cookie: el navegador la envía en cada pedido.

// Aviso que se lanza cuando el servidor dice "tu sesión terminó" (App.jsx lo escucha
// y vuelve a mostrar la pantalla de ingreso).
export const SESION_VENCIDA = 'ferrestock:sesion-vencida'

// segundoPlano = true para las consultas automáticas (como las del chat): el servidor no las cuenta como «usó el programa» en la última conexión.
async function pedir(direccion, { metodo = 'GET', datos, segundoPlano = false } = {}) {
  const respuesta = await fetch(`/api${direccion}`, {
    method: metodo,
    headers: segundoPlano ? { 'Content-Type': 'application/json', 'X-Segundo-Plano': '1' } : { 'Content-Type': 'application/json' },
    body: datos && JSON.stringify(datos),
  })
  const contenido = await respuesta.json().catch(() => ({}))
  if (respuesta.status === 401 && !direccion.startsWith('/sesion')) window.dispatchEvent(new Event(SESION_VENCIDA))
  // Si el servidor contestó con un error, se muestra su mensaje en la pantalla.
  if (!respuesta.ok) throw new Error(contenido.error || `Error ${respuesta.status}`)
  return contenido
}

export const servidor = {
  // Ingreso
  estadoDeSesion: () => pedir('/sesion'), // { usuario, necesitaConfiguracion }
  iniciarSesion: (usuario, clave) => pedir('/sesion/iniciar', { metodo: 'POST', datos: { usuario, clave } }),
  crearPrimerAdministrador: (datos) => pedir('/sesion/configurar', { metodo: 'POST', datos }),
  cerrarSesion: () => pedir('/sesion/cerrar', { metodo: 'POST' }),

  // Mi perfil (cualquier usuario con sesión): foto, ajustes y contraseña propios
  // cambios = { foto: 'data:image/jpeg;base64,…' | null, preferencias: { tema, saludo, menuCompacto, inicio } }
  guardarPerfil: (cambios) => pedir('/perfil', { metodo: 'PUT', datos: cambios }),
  cambiarMiClave: (actual, nueva) => pedir('/perfil/clave', { metodo: 'POST', datos: { actual, nueva } }),

  // Ventas y facturas (vendedor y administrador)
  // venta = { productos: [{ productoId, cantidad }], recibido, cliente, clienteDocumento }
  cobrarVenta: (venta) => pedir('/ventas', { metodo: 'POST', datos: venta }), // devuelve la factura
  ventasDeHoy: () => pedir('/ventas/hoy'),
  // filtros = { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD', q: 'texto', limite: 100 } (todos opcionales)
  listaDeVentas: (filtros = {}) => pedir(`/ventas?${new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== '' && valor != null))}`),
  verFactura: (id) => pedir(`/ventas/${id}`),

  // Cotizaciones (vendedor y administrador). No afectan el inventario.
  // datos = { productos: [{ productoId, cantidad }], cliente, documento, contacto, descuento, validez, notas }
  guardarCotizacion: (datos) => pedir('/cotizaciones', { metodo: 'POST', datos }), // devuelve la cotización guardada
  // filtros = { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD', q: 'texto', limite: 100 } (todos opcionales)
  listaDeCotizaciones: (filtros = {}) => pedir(`/cotizaciones?${new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== '' && valor != null))}`),
  verCotizacion: (id) => pedir(`/cotizaciones/${id}`),

  // Usuarios y roles (solo administrador)
  listarUsuarios: () => pedir('/usuarios'),
  crearUsuario: (usuario) => pedir('/usuarios', { metodo: 'POST', datos: usuario }),
  editarUsuario: (id, cambios) => pedir(`/usuarios/${id}`, { metodo: 'PUT', datos: cambios }),
  eliminarUsuario: (id) => pedir(`/usuarios/${id}`, { metodo: 'DELETE' }),
  // foto = 'data:image/jpeg;base64,…' para cambiarla, o null para quitarla
  cambiarFotoDeUsuario: (id, foto) => pedir(`/usuarios/${id}/foto`, { metodo: 'PUT', datos: { foto } }),
  listarRoles: () => pedir('/roles'),
  // Chat del equipo (todos los roles). filtros = { desde: id } (los nuevos) · { antes: id } (los anteriores) · {} (los últimos 50)
  // filtros = { con: idPersona (chat privado; sin «con»: la sala global), desde: id, antes: id }
  chatMensajes: (filtros = {}, segundoPlano = false) => pedir(`/chat?${new URLSearchParams(filtros)}`, { segundoPlano }), // → { mensajes, hayMas }
  // sin «para»: a la sala global; con «para»: chat privado. «menciones» = ids de las personas a las que se les escribió @Nombre (solo en la sala global)
  enviarAlChat: (texto, para, menciones) => pedir('/chat', { metodo: 'POST', datos: { texto, para, menciones } }),
  infoDelMensaje: (id) => pedir(`/chat/${id}/info`), // solo de tus mensajes: quién lo recibió y lo leyó, con la hora
  borrarDelChat: (id) => pedir(`/chat/${id}`, { metodo: 'DELETE' }),
  resumenDelChat: () => pedir('/chat/resumen', { segundoPlano: true }), // → { noLeidos (sala global), privados: { idPersona: n }, noLeidosPrivados, total }
  conversacionesDelChat: (segundoPlano = false) => pedir('/chat/conversaciones', { segundoPlano }), // → { global: { noLeidos, ultimo }, personas: [{ …, noLeidos, ultimo }] }
  marcarChatLeido: (con) => pedir('/chat/leido', { metodo: 'POST', datos: con ? { con } : undefined, segundoPlano: true }), // sin «con»: la sala global
  listarEquipo: (segundoPlano = false) => pedir('/equipo', { segundoPlano }), // todos los roles: [{ id, nombre, rol, rol_nombre, foto, ultima_conexion }]

  // Datos de la ferretería que salen en la factura (solo administrador)
  datosDelNegocio: () => pedir('/negocio'),
  guardarDatosDelNegocio: (datos) => pedir('/negocio', { metodo: 'PUT', datos }),

  // Gráfica de Reportes (solo administrador): [{ fecha: '2026-09-24', facturas, total }, …]
  ventasPorDia: (dias) => pedir(`/reportes/ventas-por-dia?dias=${dias}`),

  // Leer datos
  cargarConfiguracion: () => pedir('/configuracion'), // categorías y motivos
  cargarProductos: () => pedir('/productos'),
  cargarMovimientos: (limite = 500) => pedir(`/movimientos?limite=${limite}`),
  movimientosDelDia: (dia) => pedir(`/movimientos?limite=200&dia=${dia}`), // dia = 'AAAA-MM-DD'

  // Productos
  siguienteCodigoDeProducto: () => pedir('/productos/siguiente-codigo'), // { codigo: 'FER-1017' }: el que recibirá el próximo producto
  crearProducto: (producto) => pedir('/productos', { metodo: 'POST', datos: producto }),
  editarProducto: (id, producto) => pedir(`/productos/${id}`, { metodo: 'PUT', datos: producto }),
  cambiarActivo: (id, activo) => pedir(`/productos/${id}/activo`, { metodo: 'PATCH', datos: { activo } }),

  // Movimientos
  registrarMovimiento: (movimiento) => pedir('/movimientos', { metodo: 'POST', datos: movimiento }),

  // Categorías
  crearCategoria: (nombre) => pedir('/categorias', { metodo: 'POST', datos: { nombre } }),
  renombrarCategoria: (id, nombre) => pedir(`/categorias/${id}`, { metodo: 'PUT', datos: { nombre } }),
  moverCategoria: (id, direccion) => pedir(`/categorias/${id}/mover`, { metodo: 'POST', datos: { direccion } }),
  borrarCategoria: (id) => pedir(`/categorias/${id}`, { metodo: 'DELETE' }),

  // Pantalla "Base de Datos" (solo lectura)
  listarTablasDeLaBase: () => pedir('/base-de-datos'),
  verTablaDeLaBase: (nombre) => pedir(`/base-de-datos/contenido?nombre=${encodeURIComponent(nombre)}`),
}
