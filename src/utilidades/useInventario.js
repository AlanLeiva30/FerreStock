// ─────────────────────────────────────────────────────────────
// CARGAR EL INVENTARIO
// ─────────────────────────────────────────────────────────────
// Trae del servidor lo que las pantallas necesitan. Después de cada cambio
// (una venta, un producto nuevo…) se llama a recargar() para que todo se vea
// actualizado.
//   - Administrador: categorías, motivos, productos y movimientos.
//   - Vendedor: solo los productos (es lo único que su pantalla usa y que el servidor le deja ver).
//
// En React, las funciones que empiezan con "use" guardan información que puede
// cambiar; cuando cambia, la pantalla se vuelve a dibujar sola.

import { useCallback, useEffect, useState } from 'react'
import { servidor } from './servidor.js'

export function useInventario(esAdministrador) {
  const [configuracion, setConfiguracion] = useState({ categorias: [], motivos: { entrada: [], salida: [] } })
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorDeCarga, setErrorDeCarga] = useState('')

  const recargar = useCallback(async () => {
    try {
      if (esAdministrador) {
        // Pedir las tres cosas a la vez y esperar a que lleguen todas.
        const [nuevaConfiguracion, nuevosProductos, nuevosMovimientos] = await Promise.all([
          servidor.cargarConfiguracion(),
          servidor.cargarProductos(),
          servidor.cargarMovimientos(),
        ])
        setConfiguracion(nuevaConfiguracion)
        setProductos(nuevosProductos)
        setMovimientos(nuevosMovimientos)
      } else {
        setProductos(await servidor.cargarProductos())
      }
      setErrorDeCarga('')
    } catch (error) {
      setErrorDeCarga(error.message)
    } finally {
      setCargando(false)
    }
  }, [esAdministrador])

  // Cargar todo una vez, al entrar al programa.
  useEffect(() => { recargar() }, [recargar])

  return { configuracion, productos, movimientos, cargando, errorDeCarga, recargar }
}
