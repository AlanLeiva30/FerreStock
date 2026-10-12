// El círculo con la foto de perfil de una persona. Si no tiene foto, muestra la inicial de su nombre.
//
//   <Avatar usuario={usuario} />              → 32 px
//   <Avatar usuario={usuario} tamano={72} />  → más grande

export default function Avatar({ usuario, tamano = 32 }) {
  const medidas = { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.42) }
  if (usuario.foto) return <img className="avatar" src={usuario.foto} alt="" style={medidas} />
  return <span className="avatar" style={medidas} aria-hidden="true">{usuario.nombre.trim()[0]?.toUpperCase()}</span>
}
