# Historial de versiones

Aquí se ve **qué cambió en cada versión**, con capturas del **antes** y el **después**.

> Las capturas se tomaron con **datos de ejemplo** (productos, ventas y usuarios ficticios), no con datos reales.
> Las del **antes** salen de la versión 1.5.0 original; las del **después**, de la versión actual.
> Todas están en `docs/versiones/`.

| Versión | Fecha | Resumen |
|---|---|---|
| [1.7.0](#170--12-de-octubre-de-2026) | 12-oct-2026 | El vendedor consulta el inventario y recibe avisos de poco stock |
| [1.6.0](#160--12-de-octubre-de-2026) | 12-oct-2026 | Menú de usuario con foto y ajustes, íconos nuevos, temas rediseñados y diseño fluido |
| [1.5.0](#150--versión-base) | — | Versión base con Supabase |

---

## Próxima versión (sin publicar)

### Nuevo
- **Publicación en Google Cloud Run:** servidor de producción (`npm start`), `Dockerfile`, script `scripts/desplegar-en-cloud-run.sh` y la guía `DESPLIEGUE.md`.
- La conexión a Supabase ahora puede venir de **variables de entorno** (en la nube), además de `.env.local`.
- La cookie de sesión lleva la marca `Secure` cuando el programa corre en producción (HTTPS).
- El script de publicación quita las comillas de los valores de `.env.local`, igual que el programa.

---

## 1.7.0 · 12 de octubre de 2026

**El vendedor consulta el inventario y recibe avisos de poco stock y de productos agotados.** Todo es de solo lectura: no ve costos ni puede modificar nada.

### Qué cambió
- **Consulta de Inventario para el vendedor:** búsqueda, filtros (Todos / Con stock / Poco stock / Agotados) y un aviso en la parte de arriba que dice cuántos productos se están acabando.
- **Alertas de Stock Mínimo para el vendedor:** la misma pantalla del administrador, pero sin costos de reposición y sin botón "Reabastecer".
- **Notificación al entrar:** una ventana con los productos agotados o con poco stock, para el vendedor y el administrador. Tiene "Ver alertas" y "Ahora no".
- **Aviso en vivo:** si una venta deja un producto con poco stock o agotado, aparece una franja ámbar abajo a la derecha (por ejemplo, "Taladro Percutor: quedan solo 2 Pieza").
- **Campana y globo del menú** también para el vendedor.
- **Etiquetas de estado** (STOCK BAJO / AGOTADO) junto a la cantidad en la pantalla de venta.
- **Ajuste nuevo** *Avisarme del stock al entrar* en *Ajustes de mi cuenta* (viene activado).
- La descripción del rol vendedor se actualizó.

### Cómo se ve
Antes, el vendedor no tenía ninguna de estas pantallas.

**Consulta de Inventario del vendedor (con el aviso de stock y los filtros)**

<img src="docs/versiones/1.7.0/vendedor-consulta.jpg" width="80%">

**Alertas de Stock Mínimo del vendedor (sin costos ni reabastecer)**

<img src="docs/versiones/1.7.0/vendedor-alertas.jpg" width="80%">

**Notificación al entrar**

<img src="docs/versiones/1.7.0/vendedor-notificacion-de-stock.jpg" width="80%">

**Pantalla de venta del vendedor (tema claro, con etiquetas de estado)**

<img src="docs/versiones/1.7.0/vendedor-vender-claro.jpg" width="80%">

### Detalle técnico
- Nuevos o modificados: `src/pantallas/Consulta.jsx`, `src/pantallas/Alertas.jsx`, `src/pantallas/Vender.jsx`, `src/Sistema.jsx`, `src/componentes/Alerta.jsx`, `src/ventanas/AjustesDeUsuario.jsx`, `servidor/acceso/perfil.js` (ajuste `avisoStock`), `servidor/acceso/roles.js` y `src/estilos.css`.
- El servidor ya ocultaba el costo al vendedor y rechazaba sus escrituras; no hubo cambios de permisos.

---

## 1.6.0 · 12 de octubre de 2026

**Menú de usuario con foto y ajustes personales, íconos nuevos, temas rediseñados y diseño que se adapta a la pantalla.**

### 1. Menú de usuario, foto de perfil y ajustes de cuenta
El nombre del usuario y el botón "Salir" eran dos cosas separadas. Ahora son un solo menú desplegable con **cambiar foto de perfil**, **ajustes de mi cuenta** y **cerrar sesión**, para todos los roles. Los ajustes se guardan en la base de datos, así que acompañan a la persona en cualquier computadora.

**Barra superior**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/detalle-barra-superior.jpg" width="100%"> | <img src="docs/versiones/1.7.0/detalle-barra-superior.jpg" width="100%"> |

**Menú de usuario abierto (tema oscuro)**

<img src="docs/versiones/1.7.0/menu-de-usuario-oscuro.jpg" width="80%">

**Ajustes de mi cuenta (tema oscuro)**

<img src="docs/versiones/1.7.0/ajustes-de-cuenta-oscuro.jpg" width="80%">

**Ajustes de mi cuenta (tema claro)**

<img src="docs/versiones/1.7.0/ajustes-de-cuenta-claro.jpg" width="80%">


Cada persona puede cambiar: **foto de perfil**, **tema** (claro u oscuro), **menú compacto**, **pantalla de inicio**, **mostrar la bienvenida** y **su propia contraseña** (pide la actual y cierra sus otras sesiones).

### 2. Íconos nuevos con temática de ferretería
Los emojis y símbolos de texto (🔨 ▦ ⇅ 👁 🖨…) se veían distintos en cada sistema. Se reemplazaron por **íconos vectoriales propios**: martillo, tuerca, válvula, rayo, foco, rodillo, ladrillos, llave, casco y más, con el color de cada categoría.

**Catálogo de productos (íconos de las categorías y del menú)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/catalogo-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/catalogo-oscuro.jpg" width="100%"> |

### 3. Diseño que se adapta a la pantalla
El contenido tenía un ancho fijo de 1190 px y quedaba con franjas oscuras a los lados; en la barra de arriba, los botones se partían en dos líneas. Ahora **ocupa todo el ancho**, el menú lateral queda fijo al desplazarse y la barra superior se simplifica en pantallas angostas.

**Panel principal (tema oscuro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/panel-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/panel-oscuro.jpg" width="100%"> |

### 4. Dos temas con personalidad propia
- **Oscuro:** marino profundo con relieve, sombras suaves y brillo naranja en la opción activa.
- **Claro:** crema cálido con el naranja de FerreStock, tinta marrón y sombras suaves. Dejó de ser "el oscuro invertido".
- El tema elegido en la pantalla de ingreso **se conserva al entrar** y se guarda en la cuenta.

**Panel principal (tema claro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/panel-claro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/panel-claro.jpg" width="100%"> |

**Catálogo (tema claro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/catalogo-claro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/catalogo-claro.jpg" width="100%"> |

**Reportes (tema claro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/reportes-claro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/reportes-claro.jpg" width="100%"> |

### 5. Pantalla de ingreso
- **Oscuro:** igual que antes, con íconos vectoriales y textos corregidos.
- **Claro:** diseño propio, con un panel de la marca en dorado suave sobre fondo crema. Mantiene el mismo orden (marca a la izquierda, formulario a la derecha).
- Se corrigieron dos textos desactualizados: mencionaba un lanzador de Windows que ya no existe y decía que los datos se guardaban "solo en esta computadora".

**Ingreso (tema oscuro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/ingreso-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/ingreso-oscuro.jpg" width="100%"> |

**Ingreso (tema claro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/ingreso-claro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/ingreso-claro.jpg" width="100%"> |

### 6. Globo de alertas del menú
El número de alertas quedaba encima del texto "reabastecer". Ahora está centrado a la derecha, no tapa nada y se invierte (círculo oscuro) cuando la opción está activa.

**Detalle del globo de alertas**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/detalle-globo-de-alertas.jpg" width="70%"> | <img src="docs/versiones/1.7.0/detalle-globo-de-alertas.jpg" width="70%"> |

### 7. Otras pantallas (antes y después)

**Vender (tema oscuro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/vender-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/vender-oscuro.jpg" width="100%"> |

**Entradas y Salidas (tema oscuro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/entradas-y-salidas-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/entradas-y-salidas-oscuro.jpg" width="100%"> |

**Alertas de Stock Mínimo del administrador (tema oscuro)**

| Antes (1.5.0) | Después |
|---|---|
| <img src="docs/versiones/1.5.0/alertas-oscuro.jpg" width="100%"> | <img src="docs/versiones/1.7.0/alertas-oscuro.jpg" width="100%"> |

### Otros cambios de la 1.6.0
- **Bienvenida** más corta: de 30 a 15 segundos.
- **Servidor reorganizado** en carpetas por tema: `acceso`, `inventario`, `ventas`, `basedatos` y `comun`.
- **Documentación reescrita:** `README.md` y `GUIA_DEL_CODIGO.md` (arquitectura, modelo de datos, API, roles y dónde hacer cada cambio).
- **Base de datos:** se añadieron dos columnas a la tabla `usuarios`: `foto` y `preferencias`. Se crean solas si faltan.
- **Eliminado:** código de SQLite sin uso (`actualizaciones.js`, `estructura.js`, `datosIniciales.js`), `ABRIR_FERRESTOCK.cmd` y `LEEME_SUPABASE.md`.

### Detalle técnico
- Nuevos: `servidor/acceso/perfil.js`, `src/componentes/Icono.jsx`, `Avatar.jsx`, `MenuDeUsuario.jsx`, `src/ventanas/AjustesDeUsuario.jsx` y `src/utilidades/foto.js`.
- Nuevas rutas de la API: `PUT /api/perfil` y `POST /api/perfil/clave` (para todos los roles; cada persona solo toca lo suyo).
- Seguridad: la foto solo acepta JPG, PNG o WebP (no SVG) de hasta 90 KB; los ajustes se validan en el servidor.

---

## 1.5.0 · Versión base

Sistema de inventario y ventas para ferretería con React, Vite y Supabase (PostgreSQL): roles (administrador, vendedor y trabajador), ventas con factura imprimible, inventario por categorías, entradas y salidas, alertas de stock mínimo, reportes y administración de usuarios.

Así se veía:

| Ingreso | Panel principal |
|---|---|
| <img src="docs/versiones/1.5.0/ingreso-oscuro.jpg"> | <img src="docs/versiones/1.5.0/panel-oscuro.jpg"> |
