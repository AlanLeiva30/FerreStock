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
//   - mostrar el aviso verde "✓ …" de abajo a la derecha

import { useEffect, useMemo, useRef, useState } from 'react'
import Alerta from './componentes/Alerta.jsx'
import Ventana from './componentes/Ventana.jsx'
import { coincideConBusqueda, listaDeAlertas } from './utilidades/calculos.js'
import { formato } from './utilidades/formato.js'
import { servidor } from './utilidades/servidor.js'
import { useInventario } from './utilidades/useInventario.js'
import PanelPrincipal from './pantallas/PanelPrincipal.jsx'
import Vender from './pantallas/Vender.jsx'
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

// Los roles (deben ser iguales a los de servidor/acceso/roles.js).
const ADMINISTRADOR = 'administrador'
const VENDEDOR = 'vendedor'
const TRABAJADOR = 'trabajador'

// Opciones del menú de la izquierda, en orden.
//   roles    → quién la ve (el servidor, en servidor/api.js, también revisa los permisos)
//   buscador → si se muestra el buscador general arriba de la pantalla
//   Pantalla → lo que se muestra al elegirla
const MENU = [
  { id: 'panel', icono: '▦', titulo: 'Panel Principal', descripcion: 'Resumen e indicadores clave', roles: [ADMINISTRADOR], buscador: true, Pantalla: PanelPrincipal },
  { id: 'vender', icono: '$', titulo: 'Vender', descripcion: 'Agregar productos, cobrar y facturar', roles: [ADMINISTRADOR, VENDEDOR], buscador: false, Pantalla: Vender },
  { id: 'almacen', icono: '▤', titulo: 'Stock del Almacén', descripcion: 'Cuánto hay de cada producto', roles: [TRABAJADOR], buscador: true, Pantalla: Almacen },
  { id: 'catalogo', icono: '◇', titulo: 'Catálogo de Productos', descripcion: 'Alta, modificación y estados', roles: [ADMINISTRADOR], buscador: true, Pantalla: Catalogo },
  { id: 'movimientos', icono: '⇅', titulo: 'Entradas y Salidas', descripcion: 'Registro de flujo de mercadería', roles: [ADMINISTRADOR], buscador: true, Pantalla: EntradasYSalidas },
  { id: 'consulta', icono: '⌕', titulo: 'Consulta de Inventario', descripcion: 'Búsqueda veloz para mostrador', roles: [ADMINISTRADOR], buscador: true, Pantalla: Consulta },
  { id: 'alertas', icono: '△', titulo: 'Alertas de Stock Mínimo', descripcion: 'Productos para reabastecer', roles: [ADMINISTRADOR], buscador: true, Pantalla: Alertas },
  { id: 'reportes', icono: '▥', titulo: 'Reportes y Estadísticas', descripcion: 'Informes detallados del estado', roles: [ADMINISTRADOR], buscador: false, Pantalla: Reportes },
  { id: 'usuarios', icono: '◉', titulo: 'Usuarios y Roles', descripcion: 'Crear usuarios y asignar su rol', roles: [ADMINISTRADOR], buscador: false, Pantalla: Usuarios },
  { id: 'base', icono: '▣', titulo: 'Base de Datos', descripcion: 'Ver las tablas guardadas (solo lectura)', roles: [ADMINISTRADOR], buscador: false, Pantalla: BaseDeDatos },
]

export default function Sistema({ usuario, tema, cambiarTema, alSalir, actualizarSesion, darBienvenida, alCerrarBienvenida }) {
  const esAdmin = usuario.rol === ADMINISTRADOR
  const menuDelUsuario = MENU.filter((opcion) => opcion.roles.includes(usuario.rol))

  // ── 1. Datos que vienen de la base (productos, movimientos, categorías) ──
  const { configuracion, productos, movimientos, cargando, errorDeCarga, recargar } = useInventario(esAdmin)

  // ── 2. Lo que el usuario está viendo o haciendo en este momento ──
  const [pantallaActual, setPantallaActual] = useState(menuDelUsuario[0].id)
  const [busqueda, setBusqueda] = useState('') //   texto escrito en el buscador
  const [categoria, setCategoria] = useState('') // filtro de categoría ('' = todas)
  const [ventana, setVentana] = useState(null) //    ventana emergente abierta (null = ninguna)
  const [aviso, setAviso] = useState('') //          mensaje verde de abajo a la derecha
  const [preguntandoSalir, setPreguntandoSalir] = useState(false) // aviso "¿Seguro que quieres cerrar sesión?"
  const buscador = useRef(null)

  // El aviso verde desaparece solo después de 3 segundos.
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  // ── 3. Cálculos a partir de los datos ──
  const alertas = useMemo(() => (esAdmin ? listaDeAlertas(productos) : []), [productos, esAdmin])

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
    if (id) await servidor.editarProducto(id, datos)
    else await servidor.crearProducto(datos)
    await recargar()
    cerrarVentana()
    setAviso(id ? 'Producto actualizado' : 'Producto agregado al catálogo')
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
          <div className="logo">⬡</div>
          <div className="brand"><b>FerreStock</b><small>Ferretería Medrano • Control de Inventarios</small></div>
          <i>v1.5</i>
          <div className="actions">
            {esAdmin && <button className="registrar" onClick={() => abrirMovimiento()} aria-label="Registrar movimiento">⊕ Registrar Movimiento</button>}
            <button className="theme-toggle" onClick={cambiarTema} aria-label="Cambiar modo">
              {tema === 'dark' ? '☀ Claro' : '☾ Oscuro'}
            </button>
            {esAdmin && (
              <button className="bell" onClick={() => irA('alertas')} aria-label={`${alertas.length} alertas de stock`}>
                ♧{alertas.length > 0 && <em>{alertas.length}</em>}
              </button>
            )}
            {esAdmin && <button className="scope" onClick={() => setVentana({ tipo: 'alcance' })}>ⓘ Alcance del Proyecto</button>}
            <span className="user" title={`Usuario: ${usuario.usuario}`}>
              <strong>{usuario.nombre[0]}</strong>
              <span className="user-datos"><b>{usuario.nombre}</b><small>{usuario.rol_nombre}</small></span>
            </span>
            <button className="salir" onClick={() => setPreguntandoSalir(true)} aria-label="Cerrar sesión">⎋ Salir</button>
          </div>
        </div>
      </header>

      <div className="body">
        {/* Menú de la izquierda (solo las opciones de su rol) */}
        <aside>
          <nav>
            {menuDelUsuario.map((opcion) => (
              <button key={opcion.id} className={opcionActual.id === opcion.id ? 'active' : ''} onClick={() => irA(opcion.id)}
                aria-current={opcionActual.id === opcion.id ? 'page' : undefined}>
                <span>{opcion.icono}</span>
                <b>{opcion.titulo}</b>
                {opcion.id === 'alertas' && alertas.length > 0 && <em>{alertas.length}</em>}
                <small>{opcion.descripcion}</small>
              </button>
            ))}
          </nav>
          {/* Qué puede hacer este rol (el texto viene de servidor/acceso/roles.js) */}
          <div className="permission"><b>✓ {usuario.rol_nombre}</b><small>{usuario.rol_descripcion}</small></div>
        </aside>

        {/* Zona central */}
        <main>
          <section className="section-indicator">Vista actual: <strong>{opcionActual.titulo}</strong></section>

          {opcionActual.buscador && (
            <div className="search">⌕
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

      {/* Aviso verde */}
      {aviso && <div className="toast" role="status">✓ {aviso}</div>}

      {/* Bienvenida: solo justo después de iniciar sesión. Se cierra sola a los 30 segundos
          (o antes, con "¡Empecemos!", la tecla Escape o un clic fuera del aviso). */}
      {darBienvenida && (
        <Alerta icono="saludo" titulo={`¡Hola, ${primerNombre(usuario.nombre)}!`} textoAceptar="¡Empecemos!"
          cerrarEnSegundos={30} alAceptar={alCerrarBienvenida}>
          <p>{formato.saludo()}. Te damos la bienvenida a <b>FerreStock</b>.</p>
          <p className="alerta-rol">Entraste como <b>{usuario.rol_nombre}</b></p>
        </Alerta>
      )}

      {/* Confirmación antes de cerrar sesión (botón "⎋ Salir") */}
      {preguntandoSalir && (
        <Alerta icono="pregunta" titulo="¿Seguro que quieres cerrar sesión?" textoAceptar="Sí, cerrar sesión" textoCancelar="Cancelar"
          alAceptar={alSalir} alCancelar={() => setPreguntandoSalir(false)}>
          <p>Para volver a entrar tendrás que escribir tu usuario y contraseña.</p>
        </Alerta>
      )}

      {/* Ventanas emergentes (solo las usa el administrador) */}
      {ventana && (
        <Ventana alCerrar={cerrarVentana}>
          {ventana.tipo === 'movimiento' && (
            <FormularioMovimiento productos={productos} motivos={configuracion.motivos} valoresIniciales={ventana.valoresIniciales} alGuardar={guardarMovimiento} />
          )}
          {ventana.tipo === 'producto' && (
            <FormularioProducto producto={ventana.producto} categorias={configuracion.categorias} categoriaSugerida={categoria} alGuardar={guardarProducto} />
          )}
          {ventana.tipo === 'categorias' && (
            <AdministrarCategorias categorias={configuracion.categorias} acciones={accionesDeCategorias} />
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
