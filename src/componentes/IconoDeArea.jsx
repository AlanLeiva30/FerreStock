// El cuadrito con el ícono del área de una categoría (martillo, tuerca, tubería…), con su color.
// Los íconos y colores se eligen en src/utilidades/areas.js.
//
//   <IconoDeArea categoria="Herramientas" />          → cuadrito normal
//   <IconoDeArea categoria="Herramientas" pequeno />  → cuadrito chico (por ejemplo, en la venta actual)

import { areaDeLaCategoria } from '../utilidades/areas.js'
import Icono from './Icono.jsx'

export default function IconoDeArea({ categoria, pequeno = false }) {
  const { icono, color } = areaDeLaCategoria(categoria)
  return (
    <span className={pequeno ? 'area-icono pequeno' : 'area-icono'} style={{ '--color-area': color }} title={categoria} aria-hidden="true">
      <Icono nombre={icono} tamano={pequeno ? 14 : 17} />
    </span>
  )
}
