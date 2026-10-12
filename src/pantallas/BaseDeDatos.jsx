// ─────────────────────────────────────────────────────────────
// PANTALLA: BASE DE DATOS (solo lectura)
// ─────────────────────────────────────────────────────────────
// Muestra Supabase tal como está guardado, al estilo de un visor
// de bases de datos:
//
//   ┌──────────────┬───────────────────────────────────────────┐
//   │ TABLAS       │ Filas: 16                [Filtrar filas…] │
//   │ › categorias │ ┌───┬────────┬──────────┬─────┐           │
//   │ › productos  │ │   │ id 🔑# │ nombre abc │ …   │ ← filtro  │
//   │ › movimientos│ │ 1 │      1 │ Martillo … │     │   por     │
//   │ VISTAS       │ │ 2 │      2 │ Taladro …  │     │  columna  │
//   │ › cat_01_…   │ └───┴────────┴──────────┴─────┘           │
//   └──────────────┴───────────────────────────────────────────┘
//
// Tablas → donde se guardan los datos (categorias, productos, movimientos)
// Vistas → resúmenes que se calculan solos (una por categoría, inventario, historial)
// Aquí no se puede modificar nada.

import { useCallback, useEffect, useState } from 'react'
import { servidor } from '../utilidades/servidor.js'
import Icono from '../componentes/Icono.jsx'

export default function BaseDeDatos() {
  const [lista, setLista] = useState([]) //                   tablas y vistas disponibles
  const [elegida, setElegida] = useState('productos') //     la que se está viendo
  const [contenido, setContenido] = useState(null) //         { columnas, filas, total, maximo }
  const [error, setError] = useState('')
  const [filtroDeTablas, setFiltroDeTablas] = useState('') // casilla "Filtrar tablas…"
  const [filtroGeneral, setFiltroGeneral] = useState('') //   casilla "Filtrar filas…"
  const [filtrosPorColumna, setFiltrosPorColumna] = useState({}) // { nombreDeColumna: texto }

  // Pedir al servidor la lista de tablas y el contenido de la elegida.
  const cargar = useCallback(async () => {
    try {
      const [nuevaLista, nuevoContenido] = await Promise.all([servidor.listarTablasDeLaBase(), servidor.verTablaDeLaBase(elegida)])
      setLista(nuevaLista)
      setContenido(nuevoContenido)
      setError('')
    } catch (problema) {
      setError(problema.message)
    }
  }, [elegida])

  // Cargar al abrir la pantalla y cada vez que se elige otra tabla.
  useEffect(() => { cargar() }, [cargar])

  const elegir = (nombre) => {
    setElegida(nombre)
    setFiltroGeneral('')
    setFiltrosPorColumna({})
  }

  // Tablas y vistas que coinciden con "Filtrar tablas…"
  const coincideNombre = (item) => item.nombre.toLowerCase().includes(filtroDeTablas.trim().toLowerCase())
  const tablas = lista.filter((item) => item.tipo === 'table' && coincideNombre(item))
  const vistas = lista.filter((item) => item.tipo === 'view' && coincideNombre(item))

  // Filas que pasan el filtro general y los filtros de cada columna.
  const columnas = contenido?.columnas ?? []
  const filas = (contenido?.filas ?? []).filter((fila) =>
    contiene(Object.values(fila).join(' '), filtroGeneral) &&
    columnas.every((columna) => contiene(fila[columna.nombre], filtrosPorColumna[columna.nombre])))

  const botonDeTabla = (item) => (
    <button key={item.nombre} className={item.nombre === elegida ? 'db-item on' : 'db-item'} onClick={() => elegir(item.nombre)}>
      <span>›</span>{item.nombre}<small>{item.filas}</small>
    </button>
  )

  return (
    <section className="panel db-viewer">
      {/* Columna izquierda: lista de tablas y vistas */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <button onClick={cargar} title="Volver a leer la base de datos" aria-label="Actualizar">↻</button>
          <input value={filtroDeTablas} onChange={(evento) => setFiltroDeTablas(evento.target.value)} placeholder={`Filtrar ${lista.length} tablas…`} aria-label="Filtrar tablas" />
        </div>
        <h4>TABLAS</h4>
        {tablas.map(botonDeTabla)}
        <h4>VISTAS</h4>
        {vistas.map(botonDeTabla)}
        <p className="db-readonly">Solo lectura · Supabase</p>
      </aside>

      {/* Zona derecha: filas de la tabla elegida */}
      <div className="db-main">
        <div className="db-toolbar">
          <span>☰ <b>{elegida}</b> · Filas: {filas.length}{contenido && filas.length !== contenido.total && ` de ${contenido.total}`}</span>
          <input value={filtroGeneral} onChange={(evento) => setFiltroGeneral(evento.target.value)} placeholder={`Filtrar ${contenido?.total ?? 0} filas…`} aria-label="Filtrar filas" />
        </div>

        {error && <div className="load-error db-error">{error}</div>}

        {contenido && (
          <div className="db-grid-wrap">
            <table className="db-grid">
              <thead>
                <tr>
                  <th className="db-rownum" />
                  {columnas.map((columna) => (
                    <th key={columna.nombre}>
                      <div className="db-colname">
                        {columna.nombre}
                        <span className="db-type" title={columna.tipo || 'sin tipo'}>{iconoDelTipo(columna, contenido.filas)}</span>
                      </div>
                      <input value={filtrosPorColumna[columna.nombre] ?? ''} placeholder="Filtrar…" aria-label={`Filtrar ${columna.nombre}`}
                        onChange={(evento) => setFiltrosPorColumna({ ...filtrosPorColumna, [columna.nombre]: evento.target.value })} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, numero) => (
                  <tr key={numero}>
                    <td className="db-rownum">{numero + 1}</td>
                    {columnas.map((columna) => <Celda key={columna.nombre} valor={fila[columna.nombre]} />)}
                  </tr>
                ))}
              </tbody>
            </table>
            {!filas.length && <p className="db-empty">{contenido.total ? 'Ninguna fila coincide con los filtros.' : 'Esta tabla está vacía.'}</p>}
            {contenido.total > contenido.maximo && <p className="db-empty">Se muestran las primeras {contenido.maximo} filas.</p>}
          </div>
        )}
      </div>
    </section>
  )
}

// Una celda. Los números van a la derecha; los vacíos se muestran atenuados:
//   NULL → no tiene ningún dato      '' → tiene un texto vacío
function Celda({ valor }) {
  if (valor === null || valor === undefined) return <td className="db-null">NULL</td>
  if (valor === '') return <td className="db-null">''</td>
  if (typeof valor === 'number') return <td className="num">{valor}</td>
  return <td title={String(valor)}>{String(valor)}</td>
}

// Ícono de cada columna: llave = clave principal, # número, abc texto.
function iconoDelTipo(columna, filas) {
  const tipo = columna.tipo.toUpperCase()
  // Las columnas de las vistas no siempre traen tipo: se deduce del primer valor.
  const esNumero = /INT|REAL|NUM|DEC|FLOAT|DOUBLE/.test(tipo) ||
    (!tipo && typeof filas.find((fila) => fila[columna.nombre] != null)?.[columna.nombre] === 'number')
  return <>{columna.esClave && <Icono nombre="llavePrincipal" tamano={12} className="antes" />}{esNumero ? '#' : 'abc'}</>
}

// ¿El valor contiene el texto buscado? (sin importar mayúsculas; si no se buscó nada, sí)
function contiene(valor, buscado) {
  const texto = (buscado ?? '').trim().toLowerCase()
  return !texto || String(valor ?? '').toLowerCase().includes(texto)
}
