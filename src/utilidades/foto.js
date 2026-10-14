// ─────────────────────────────────────────────────────────────
// FOTO DE PERFIL: elegir una imagen y dejarla lista para guardar
// ─────────────────────────────────────────────────────────────
// La imagen se recorta al centro en un cuadrado y se reduce a 256 × 256 px.
// Así pesa unos 20 KB, se guarda rápido y se ve bien en un círculo.
// Todo ocurre en el navegador: la foto original nunca sale de la computadora.

const LADO = 256
const LARGO_MAXIMO = 80_000 // el servidor rechaza más de 90 000
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Devuelve la foto como texto ('data:image/jpeg;base64,…') o lanza un error con un mensaje claro.
export async function reducirFoto(archivo) {
  if (!archivo || !TIPOS.includes(archivo.type)) throw new Error('Elige una imagen JPG, PNG o WebP')
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La imagen pesa demasiado (máximo 15 MB)')

  const imagen = await cargarImagen(archivo)
  const lado = Math.min(imagen.width, imagen.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = LADO
  const dibujo = lienzo.getContext('2d')
  dibujo.fillStyle = '#ffffff' // fondo para las imágenes con partes transparentes
  dibujo.fillRect(0, 0, LADO, LADO)
  dibujo.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, LADO, LADO)

  for (const calidad of [0.85, 0.7, 0.55, 0.4]) {
    const resultado = lienzo.toDataURL('image/jpeg', calidad)
    if (resultado.length <= LARGO_MAXIMO) return resultado
  }
  throw new Error('No se pudo reducir la imagen. Prueba con otra.')
}

// Lee el archivo como texto 'data:…' y lo carga en una imagen. Se usa "data:" (y no una dirección "blob:")
// porque la política de seguridad del sitio publicado (Content-Security-Policy, en servidor/produccion.js)
// solo permite imágenes "self" y "data:": con "blob:" la foto se bloquea y nunca se puede subir.
function cargarImagen(archivo) {
  return new Promise((listo, fallo) => {
    const lector = new FileReader()
    lector.onerror = () => fallo(new Error('No se pudo leer la imagen'))
    lector.onload = () => {
      const imagen = new Image()
      imagen.onload = () => listo(imagen)
      imagen.onerror = () => fallo(new Error('No se pudo leer la imagen. Prueba con otra (JPG, PNG o WebP).'))
      imagen.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}
