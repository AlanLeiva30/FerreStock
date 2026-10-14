// ─────────────────────────────────────────────────────────────
// SISTEMA: EL MARCO DE FERRESTOCK (después de iniciar sesión)
// ─────────────────────────────────────────────────────────────
// Dibuja lo que siempre está en pantalla: la barra de arriba, el menú de la
// izquierda y el buscador. En el centro muestra la pantalla elegida en el menú
// (las pantallas están en la carpeta "pantallas").
//
// El menú depende del ROL de quien inició sesión:
//   administrador → todas las pantallas (menos "Stock del Almacén", que es la del trabajador)
//   vendedor      → solo "Vender" (cobrar e imprimir la factura)
//   trabajador    → solo "Stock del Almacén" (ver cuánto hay, sin precios)
//
// También se encarga de:
//   - saludar al entrar ("¡Hola, Alan!") y preguntar antes de cerrar sesión
//   - abrir y cerrar las ventanas emergentes (carpeta "ventanas")
//   - guardar los cambios pidiéndoselo al servidor
//   - mostrar el aviso verde con una palomita de abajo a la derecha

import { useEffect, useMemo, useRef, useState } from 'react'
import Alerta from './componentes/Alerta.jsx'
import CampanaDeAlertas from './componentes/CampanaDeAlertas.jsx'
import Icono from './componentes/Icono.jsx'
import MenuDeUsuario from './componentes/MenuDeUsuario.jsx'
import Ventana from './componentes/Ventana.jsx'
import { coincideConBusqueda, listaDeAlertas } from './utilidades/calculos.js'
import { formato } from './utilidades/formato.js'
import { servidor } from './utilidades/servidor.js'
import { useInventario } from './utilidades/useInventario.js'
import PanelPrincipal from './pantallas/PanelPrincipal.jsx'
import Vender from './pantallas/Vender.jsx'
import Facturas from './pantallas/Facturas.jsx'
import Cotizar from './pantallas/Cotizar.jsx'
import Cotizaciones from './pantallas/Cotizaciones.jsx'
import Almacen from './pantallas/Almacen.jsx'
import Catalogo from './pantallas/Catalogo.jsx'
import EntradasYSalidas from './pantallas/EntradasYSalidas.jsx'
import Consulta from './pantallas/Consulta.jsx'
import Alertas from './pantallas/Alertas.jsx'
import Reportes from './pantallas/Reportes.jsx'
import Usuarios from './pantallas/Usuarios.jsx'
import BaseDeDatos from './pantallas/BaseDeDatos.jsx'
import FormularioMovimiento from './ventanas/FormularioMovimiento.jsx'
import FormularioProducto from './ventanas/FormularioProducto.jsx'
import AdministrarCategorias from './ventanas/AdministrarCategorias.jsx'
import AjustesDeUsuario from './ventanas/AjustesDeUsuario.jsx'

// Los roles (deben ser iguales a los de servidor/acceso/roles.js).
const ADMINISTRADOR = 'administrador'
const VENDEDOR = 'vendedor'
const TRABAJADOR = 'trabajador'

// Opciones del menú de la izquierda, en orden.
//   roles    → quién la ve (el servidor, en servidor/api.js, también revisa los permisos)
//   buscador → si se muestra el buscador general arriba de la pantalla
//   Pantalla → lo que se muestra al elegirla
const MENU = [
  { id: 'panel', icono: 'panel', titulo: 'Panel Principal', descripcion: 'Resumen e indicadores clave', roles: [ADMINISTRADOR], buscador: true, Pantalla: PanelPrincipal },
  { id: 'vender', icono: 'vender', titulo: 'Vender', descripcion: 'Agregar productos, cobrar y facturar', roles: [ADMINISTRADOR, VENDEDOR], buscador: false, Pantalla: Vender },
  { id: 'cotizar', icono: 'cotizar', titulo: 'Cotizar', descripcion: 'Armar una cotización para imprimir o guardar en PDF', roles: [ADMINISTRADOR, VENDEDOR], buscador: false, Pantalla: Cotizar },
  { id: 'cotizaciones', icono: 'carpeta', titulo: 'Cotizaciones', descripcion: 'Ver y reimprimir las cotizaciones hechas', roles: [ADMINISTRADOR, VENDEDOR], buscador: false, Pantalla: Cotizaciones },
  { id: 'facturas', icono: 'factura', titulo: 'Facturas', descripcion: 'Ver y reimprimir facturas anteriores', roles: [ADMINISTRADOR, VENDEDOR], buscador: false, Pantalla: Facturas },
  { id: 'almacen', icono: 'almacen', titulo: 'Stock del Almacén', descripcion: 'Cuánto hay de cada producto', roles: [TRABAJADOR], buscador: true, Pantalla: Almacen },
  { id: 'catalogo', icono: 'catalogo', titulo: 'Catálogo de Productos', descripcion: 'Alta, modificación y estados', roles: [ADMINISTRADOR], buscador: true, Pantalla: Catalogo },
  { id: 'movimientos', icono: 'movimientos', titulo: 'Entradas y Salidas', descripcion: 'Registro de flujo de mercadería', roles: [ADMINISTRADOR], buscador: true, Pantalla: EntradasYSalidas },
  { id: 'consulta', icono: 'buscar', titulo: 'Consulta de Inventario', descripcion: 'Búsqueda veloz para mostrador', roles: [ADMINISTRADOR, VENDEDOR], buscador: true, Pantalla: Consulta },
  { id: 'alertas', icono: 'alerta', titulo: 'Alertas de Stock Mínimo', descripcion: 'Productos para reabastecer', roles: [ADMINISTRADOR, VENDEDOR], buscador: true, Pantalla: Alertas },
  { id: 'reportes', icono: 'reportes', titulo: 'Reportes y Estadísticas', descripcion: 'Informes detallados del estado', roles: [ADMINISTRADOR], buscador: false, Pantalla: Reportes },
  { id: 'usuarios', icono: 'usuarios', titulo: 'Usuarios y Roles', descripcion: 'Crear usuarios y asignar su rol', roles: [ADMINISTRADOR], buscador: false, Pantalla: Usuarios },
  { id: 'base', icono: 'baseDeDatos', titulo: 'Base de Datos', descripcion: 'Ver las tablas guardadas (solo lectura)', roles: [ADMINISTRADOR], buscador: false, Pantalla: BaseDeDatos },
]

export default function Sistema({ usuario, tema, cambiarTema, fijarTema, alSalir, actualizarSesion, darBienvenida, alCerrarBienvenida }) {
  const esAdmin = usuario.rol === ADMINISTRADOR
  const esVendedor = usuario.rol === VENDEDOR
  // Reciben los avisos de stock bajo y agotados: el administrador y el vendedor (este último solo para consultar).
  const pantallaDeAlertas = esAdmin || esVendedor ? 'alertas' : null
  const menuDelUsuario = MENU.filter((opcion) => opcion.roles.includes(usuario.rol))

  // ── 1. Datos que vienen de la base (productos, movimientos, categorías) ──
  const { configuracion, productos, movimientos, cargando, errorDeCarga, recargar } = useInventario(esAdmin)

  // ── 2. Lo que el usuario está viendo o haciendo en este momento ──
  // La pantalla con la que abre es la que la persona eligió en sus ajustes (si su rol aún la puede ver).
  const [pantallaActual, setPantallaActual] = useState(() => (menuDelUsuario.find((opcion) => opcion.id === usuario.preferencias?.inicio) ?? menuDelUsuario[0]).id)
  const [busqueda, setBusqueda] = useState('') //   texto escrito en el buscador
  const [categoria, setCategoria] = useState('') // filtro de categoría ('' = todas)
  const [ventana, setVentana] = useState(null) //    ventana emergente abierta (null = ninguna)
  const [aviso, setAviso] = useState('') //          mensaje verde de abajo a la derecha
  const [preguntandoSalir, setPreguntandoSalir] = useState(false) // aviso "¿Seguro que quieres cerrar sesión?"
  const buscador = useRef(null)
  const [avisoDeStock, setAvisoDeStock] = useState('') //                  aviso ámbar de abajo: "se agotó / quedan pocos"
  const estadoAnteriorDelStock = useRef(null)

  // El aviso verde desaparece solo después de 3 segundos.
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  // El aviso ámbar desaparece solo después de 7 segundos.
  useEffect(() => {
    if (!avisoDeStock) return
    const temporizador = setTimeout(() => setAvisoDeStock(''), 7000)
    return () => clearTimeout(temporizador)
  }, [avisoDeStock])

  // ── 3. Cálculos a partir de los datos ──
  const alertas = useMemo(() => (pantallaDeAlertas ? listaDeAlertas(productos) : []), [productos, pantallaDeAlertas])

  // Durante el trabajo: si después de una venta o un movimiento un producto pasa a "poco stock" o "agotado", avisar.
  useEffect(() => {
    if (cargando || !pantallaDeAlertas) return
    const nivel = (producto) => (producto.stock <= 0 ? 2 : producto.stock < producto.minimo ? 1 : 0)
    const ahora = new Map(productos.filter((producto) => producto.activo).map((producto) => [producto.id, nivel(producto)]))
    const antes = estadoAnteriorDelStock.current
    estadoAnteriorDelStock.current = ahora
    if (!antes) return
    const empeoraron = productos.filter((producto) => ahora.has(producto.id) && antes.has(producto.id) && ahora.get(producto.id) > antes.get(producto.id))
    if (!empeoraron.length) return
    const peor = empeoraron.sort((a, b) => ahora.get(b.id) - ahora.get(a.id))[0]
    setAvisoDeStock(empeoraron.length > 1
      ? `${empeoraron.length} productos se están acabando (${peor.nombre} y otros)`
      : `${peor.nombre}: ${peor.stock <= 0 ? 'se agotó' : `quedan solo ${formato.cantidad(peor.stock, peor.unidad)}`}`)
  }, [productos, cargando, pantallaDeAlertas])

  // Productos que coinciden con el buscador y con el filtro de categoría.
  const productosFiltrados = useMemo(() => productos.filter((producto) =>
    (!categoria || producto.categoria === categoria) &&
    coincideConBusqueda(busqueda, producto.codigo, producto.nombre, producto.categoria)), [productos, busqueda, categoria])

  // ── 4. Acciones: navegar, abrir ventanas y guardar ──
  const irA = (idDePantalla) => {
    setPantallaActual(idDePantalla)
    // En la Consulta y en el Almacén, poner el cursor directamente en el buscador.
    if (idDePantalla === 'consulta' || idDePantalla === 'almacen') setTimeout(() => buscador.current?.focus(), 50)
  }

  const abrirMovimiento = (valoresIniciales = {}) => setVentana({ tipo: 'movimiento', valoresIniciales })
  const abrirProducto = (producto = null) => setVentana({ tipo: 'producto', producto })
  const abrirCategorias = () => setVentana({ tipo: 'categorias' })
  const cerrarVentana = () => setVentana(null)

  // Ir al Catálogo mostrando solo una categoría.
  const verCategoria = (nombre) => {
    setCategoria(nombre)
    setBusqueda('')
    irA('catalogo')
  }

  // El nombre de quien registra lo pone el servidor, según la sesión.
  const guardarMovimiento = async (movimiento) => {
    const { producto } = await servidor.registrarMovimiento(movimiento)
    await recargar()
    cerrarVentana()
    setAviso(`${movimiento.tipo === 'salida' ? 'Salida' : 'Entrada'} registrada · ${producto.nombre}: ${producto.stock} ${producto.unidad}`)
  }

  const guardarProducto = async (datos, id) => {
    const producto = id ? await servidor.editarProducto(id, datos) : await servidor.crearProducto(datos)
    await recargar()
    cerrarVentana()
    setAviso(id ? 'Producto actualizado' : `Producto agregado al catálogo (código ${producto?.codigo ?? 'asignado'})`)
  }

  const activarODesactivar = async (producto) => {
    // Pedir confirmación antes de desactivar (activar no la necesita).
    const mensaje = `¿Desactivar "${producto.nombre}"?\n\nDejará de aparecer en consultas, alertas, movimientos y en la pantalla de ventas. Puedes reactivarlo con "Mostrar inactivos".`
    if (producto.activo && !window.confirm(mensaje)) return
    try {
      await servidor.cambiarActivo(producto.id, !producto.activo)
      await recargar()
      setAviso(producto.activo ? `${producto.nombre} desactivado` : `${producto.nombre} activado`)
    } catch (error) {
      setAviso(`Error: ${error.message}`)
    }
  }

  const nombreDeCategoria = (id) => configuracion.categorias.find((opcion) => opcion.id === id)?.nombre

  // Lo que puede hacer la ventana "Categorías".
  const accionesDeCategorias = {
    crear: async (nombre) => {
      await servidor.crearCategoria(nombre)
      await recargar()
      setAviso(`Categoría "${nombre.trim()}" creada`)
    },
    renombrar: async (id, nombre) => {
      const nombreAnterior = nombreDeCategoria(id)
      await servidor.renombrarCategoria(id, nombre)
      if (categoria && categoria === nombreAnterior) setCategoria(nombre.trim()) // mantener el filtro
      await recargar()
    },
    mover: async (id, direccion) => {
      await servidor.moverCategoria(id, direccion)
      await recargar()
    },
    borrar: async (id) => {
      await servidor.borrarCategoria(id)
      if (categoria && categoria === nombreDeCategoria(id)) setCategoria('') // quitar el filtro
      await recargar()
      setAviso('Categoría borrada')
    },
  }

  // ── 5. Dibujar la pantalla ──
  const opcionActual = menuDelUsuario.find((opcion) => opcion.id === pantallaActual) ?? menuDelUsuario[0]
  const { Pantalla } = opcionActual

  // Todo lo que las pantallas pueden usar.
  const datosParaLaPantalla = {
    usuario, esAdmin, productos, productosFiltrados, movimientos, alertas, configuracion, busqueda, categoria,
    elegirCategoria: setCategoria, irA, abrirMovimiento, abrirProducto, abrirCategorias, activarODesactivar, verCategoria,
    recargar, avisar: setAviso, actualizarSesion,
  }

  return (
    <div className="app">
      {/* Barra superior */}
      <header className="top">
        <div className="topin">
          <div className="logo"><Icono nombre="llaveInglesa" tamano={22} /></div>
          <div className="brand"><b>FerreStock</b><small>Ferretería Medrano • Control de Inventarios</small></div>
          <i>v2.2</i>
          <div className="actions">
            {esAdmin && <button className="registrar" onClick={() => abrirMovimiento()} aria-label="Registrar movimiento"><Icono nombre="mas" tamano={16} className="antes" />Registrar Movimiento</button>}
            <button className="theme-toggle" onClick={cambiarTema} aria-label="Cambiar modo">
              {tema === 'dark' ? <><Icono nombre="sol" tamano={16} className="antes" />Claro</> : <><Icono nombre="luna" tamano={16} className="antes" />Oscuro</>}
            </button>
            {pantallaDeAlertas && <CampanaDeAlertas alertas={alertas} alVerTodas={() => irA(pantallaDeAlertas)} sonando={!!avisoDeStock} />}
            {esAdmin && <button className="scope" onClick={() => setVentana({ tipo: 'alcance' })}><Icono nombre="info" tamano={16} className="antes" />Alcance del Proyecto</button>}
            <MenuDeUsuario usuario={usuario} alAjustes={() => setVentana({ tipo: 'ajustes' })} alSalir={() => setPreguntandoSalir(true)}
              avisar={setAviso} actualizarSesion={actualizarSesion} />
          </div>
        </div>
      </header>

      <div className="body">
        {/* Menú de la izquierda (solo las opciones de su rol) */}
        <aside className={usuario.preferencias?.menuCompacto ? 'compacto' : undefined}>
          <nav>
            {menuDelUsuario.map((opcion) => (
              <button key={opcion.id} className={[opcionActual.id === opcion.id && 'active', opcion.id === pantallaDeAlertas && alertas.length > 0 && 'con-aviso'].filter(Boolean).join(' ')} onClick={() => irA(opcion.id)}
                aria-current={opcionActual.id === opcion.id ? 'page' : undefined}>
                <span><Icono nombre={opcion.icono} tamano={19} /></span>
                <b>{opcion.titulo}</b>
                {opcion.id === pantallaDeAlertas && alertas.length > 0 && <em>{alertas.length}</em>}
                <small>{opcion.descripcion}</small>
              </button>
            ))}
          </nav>
          {/* Qué puede hacer este rol (el texto viene de servidor/acceso/roles.js) */}
          <div className="permission"><b><Icono nombre="check" tamano={15} className="antes" />{usuario.rol_nombre}</b><small>{usuario.rol_descripcion}</small></div>
        </aside>

        {/* Zona central */}
        <main>
          <section className="section-indicator">Vista actual: <strong>{opcionActual.titulo}</strong></section>

          {opcionActual.buscador && (
            <div className="search"><Icono nombre="buscar" tamano={20} />
              <input ref={buscador} value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Búsqueda rápida por nombre, código o categoría..." aria-label="Buscar productos" />
              {categoria && <button className="chip" onClick={() => setCategoria('')} aria-label={`Quitar filtro ${categoria}`}>{categoria} ×</button>}
              {busqueda && <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">×</button>}
            </div>
          )}

          {errorDeCarga && (
            <div className="load-error">No se pudo conectar con la base de datos: {errorDeCarga} <button onClick={recargar}>Reintentar</button></div>
          )}
          {cargando ? <p className="loading">Cargando inventario…</p> : <Pantalla {...datosParaLaPantalla} />}
        </main>
      </div>

      {/* Aviso ámbar de stock (se acabó o quedan pocos) */}
      {avisoDeStock && <div className="toast toast-stock" role="status"><Icono nombre="alerta" tamano={16} className="antes" />{avisoDeStock}</div>}

      {/* Aviso verde */}
      {aviso && <div className="toast" role="status"><Icono nombre="check" tamano={15} className="antes" />{aviso}</div>}

      {/* Bienvenida: solo justo después de iniciar sesión. Se cierra sola a los 15 segundos
          (o antes, con "¡Empecemos!", la tecla Escape o un clic fuera del aviso). */}
      {darBienvenida && (
        <Alerta icono="saludo" titulo={`¡Hola, ${primerNombre(usuario.nombre)}!`} textoAceptar="¡Empecemos!"
          cerrarEnSegundos={15} alAceptar={alCerrarBienvenida}>
          <p>{formato.saludo()}. Te damos la bienvenida a <b>FerreStock</b>.</p>
          <p className="alerta-rol">Entraste como <b>{usuario.rol_nombre}</b></p>
        </Alerta>
      )}

      {/* Confirmación antes de cerrar sesión (menú del usuario → "Cerrar sesión") */}
      {preguntandoSalir && (
        <Alerta icono="pregunta" titulo="¿Seguro que quieres cerrar sesión?" textoAceptar="Sí, cerrar sesión" textoCancelar="Cancelar"
          alAceptar={alSalir} alCancelar={() => setPreguntandoSalir(false)}>
          <p>Para volver a entrar tendrás que escribir tu usuario y contraseña.</p>
        </Alerta>
      )}

      {/* Ventanas emergentes (casi todas son del administrador; los ajustes de cuenta son de todos) */}
      {ventana && (
        <Ventana alCerrar={cerrarVentana} ancha={ventana.tipo === 'ajustes'}>
          {ventana.tipo === 'movimiento' && (
            <FormularioMovimiento productos={productos} motivos={configuracion.motivos} valoresIniciales={ventana.valoresIniciales} alGuardar={guardarMovimiento} />
          )}
          {ventana.tipo === 'producto' && (
            <FormularioProducto producto={ventana.producto} categorias={configuracion.categorias} categoriaSugerida={categoria} alGuardar={guardarProducto} />
          )}
          {ventana.tipo === 'categorias' && (
            <AdministrarCategorias categorias={configuracion.categorias} acciones={accionesDeCategorias} />
          )}
          {ventana.tipo === 'ajustes' && (
            <AjustesDeUsuario usuario={usuario} tema={tema} fijarTema={fijarTema} actualizarSesion={actualizarSesion} avisar={setAviso}
              menu={menuDelUsuario.map(({ id, titulo }) => ({ id, titulo }))} />
          )}
          {ventana.tipo === 'alcance' && (
            <>
              <h2>Alcance del proyecto</h2>
              <p>FerreStock guarda las categorías, el catálogo, los movimientos, las ventas (facturas), los usuarios y sus roles en una base de datos en Supabase (requiere conexión a Internet). Cada entrada, salida o venta actualiza el stock. Los vendedores cobran e imprimen la factura; los trabajadores de almacén solo consultan el stock; los administradores pueden todo.</p>
              <button onClick={cerrarVentana}>Entendido</button>
            </>
          )}
        </Ventana>
      )}
    </div>
  )
}

// "Alan Anderson Vasquez" → "Alan"
function primerNombre(nombreCompleto) {
  return nombreCompleto.trim().split(/\s+/)[0]
}
