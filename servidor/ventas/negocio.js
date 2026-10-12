import {bd} from '../basedatos/baseDeDatos.js';
import {CODIGOS, ErrorParaElUsuario, texto} from '../comun/http.js';
const consultas = {
  ver: bd.prepare('SELECT nombre, direccion, telefono, documento, mensaje FROM negocio WHERE id = 1'),
  guardar: bd.prepare(`
    UPDATE negocio SET nombre = :nombre, direccion = :direccion, telefono = :telefono,
      documento = :documento, mensaje = :mensaje
    WHERE id = 1`)
};
const LARGO_MAXIMO = {
  nombre: 80,
  direccion: 150,
  telefono: 40,
  documento: 60,
  mensaje: 150
};
export async function datosDelNegocio() {
  return await consultas.ver.get();
}
export async function guardarDatosDelNegocio(datos) {
  const limpio = {};
  for (const [campo, maximo] of Object.entries(LARGO_MAXIMO)) {
    limpio[campo] = texto(datos?.[campo]);
    if (limpio[campo].length > maximo) {
      throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, `El dato "${campo}" es muy largo (máximo ${maximo} letras)`);
    }
  }
  if (!limpio.nombre) throw new ErrorParaElUsuario(CODIGOS.DATOS_INCORRECTOS, 'Escribe el nombre del negocio');
  await consultas.guardar.run(limpio);
  return await datosDelNegocio();
}
