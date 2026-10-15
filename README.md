<div align="center">

# 🔩 FerreStock

### Controla tu inventario, tus ventas y tu equipo desde un solo lugar.

Sistema de gestión para ferreterías: factura en segundos, sabe cuándo reponer y nunca vende lo que no tienes.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.13-339933?logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)
![Versión](https://img.shields.io/badge/versi%C3%B3n-3.0-orange)

### 🌐 [Abrir FerreStock en línea](https://ferrestock-pgyocehooa-nn.a.run.app)

[`https://ferrestock-pgyocehooa-nn.a.run.app`](https://ferrestock-pgyocehooa-nn.a.run.app)

<sub>Funciona desde cualquier computadora o celular con internet. Se necesita un usuario y contraseña para entrar.</sub>

</div>

---

## ¿Por qué FerreStock?

Una ferretería maneja cientos de productos, entradas y salidas todos los días. Con cuadernos u hojas de cálculo es fácil perder el control. FerreStock reemplaza eso por un sistema pensado para el mostrador y la bodega:

| Antes | Con FerreStock |
|---|---|
| No sabes cuánto queda de cada producto | Stock actualizado al instante, por categoría |
| Te enteras tarde de que algo se agotó | **Alertas** de stock mínimo con el costo de reponer |
| Las facturas se hacen a mano | **Cobra, factura e imprime** en pocos clics |
| Cualquiera ve costos y precios | Cada persona ve **solo lo que le corresponde** |
| Datos en una sola computadora | Datos en la **nube**, seguros y accesibles |

---

## ✨ Qué incluye

### 🛒 Caja y facturación
- Agrega productos con un clic o escribiendo el código.
- Cálculo automático del total y del cambio, con **descuento en %** opcional.
- Factura lista para **imprimir o guardar en PDF**, con los datos de tu negocio.
- **Historial de facturas:** busca por fecha, cliente o número y reimprime cualquier factura anterior.
- Consumidor final o cliente con DUI/NIT.

### 📝 Cotizaciones
- Arma una cotización con productos del catálogo, descuento y vigencia.
- **Vista previa** antes de imprimir y descarga en PDF. No toca el inventario ni registra ventas.
- **De cotización a venta:** con un clic, una cotización guardada pasa a la caja con sus productos, cliente y descuento, y queda marcada como vendida al cobrar.
- **Panel de cotizaciones:** cada una se guarda con su número; consúltalas, filtra por fecha o cliente, reimprímelas o úsalas como base de una nueva.

### 📦 Inventario
- Catálogo por categorías, con íconos y colores para ubicar todo de un vistazo.
- **Código automático** al crear un producto: sigue la numeración sola (FER-1017, FER-1018…), sin repetir ni saltarse ninguno.
- Registro de **entradas y salidas** con motivo (venta, merma, compra…).
- Historial completo de movimientos, con filtros y buscador.
- Búsqueda rápida de productos para el mostrador.

### 🔔 Alertas y reportes
- Productos por debajo del mínimo, con lo que falta y lo que costaría reponerlo.
- Ventas por día en gráficas de 7, 30 o hasta 90 días.
- Reparto del inventario por categoría y valor del stock.
- Panel principal con los indicadores clave.
- **Informe en PDF:** un clic en Reportes y sale el informe con gráficas y tablas, listo para imprimir o guardar como PDF.

### 💬 Chat del equipo
- Un **ícono de mensajes** arriba abre una ventanita flotante (tipo Messenger) con la sala del equipo y **chats privados** uno a uno, con globo de mensajes sin leer, «Visto» y quién está en línea.
- **Recibos tipo WhatsApp:** ✓ enviado, ✓✓ entregado y ✓✓ de color leído, con la hora de cada uno, la información de cada mensaje y chequecitos que cada persona personaliza (estilo y color).
- En la sala del equipo, escribe **@** para elegir a quién va dirigido el mensaje (queda resaltado para esa persona).
- En pantalla completa se ven todas las conversaciones en una lista a la izquierda.
- Los privados solo los ven las dos personas; también hay una pantalla del chat del equipo y la última conexión de cada persona.

### 👥 Equipo y permisos
Al crear cada usuario se indica su sexo y el rol se muestra en femenino o masculino (*Vendedora*, *Vendedor*…). Cada persona personaliza su cuenta: **foto de perfil**, tema claro u oscuro, menú compacto, pantalla de inicio y su propia contraseña, desde el menú de su nombre.

Tres roles, cada uno con su propia vista:

| | 👷 Trabajador | 💵 Vendedor | 🛡️ Administrador |
|---|:---:|:---:|:---:|
| Ver existencias | ✅ | ✅ | ✅ |
| Ver precios | ❌ | ✅ | ✅ |
| Consultar el inventario y ver las alertas de poco stock | ✅ | ✅ (solo lectura) | ✅ |
| Campanita con las notificaciones de poco stock y agotados | ❌ | ✅ | ✅ |
| Ver costos | ❌ | ❌ | ✅ |
| Cobrar y facturar | ❌ | ✅ | ✅ |
| Inventario, reportes y alertas | ❌ | ❌ | ✅ |
| Gestionar usuarios y roles | ❌ | ❌ | ✅ |
| Ver, cambiar o quitar la foto de perfil de otros usuarios | ❌ | ❌ | ✅ |

---

## 🔒 Seguridad y confianza

- **Datos en la nube:** se guardan en PostgreSQL (Supabase), no en una sola computadora.
- **Contraseñas cifradas:** nadie puede leerlas, ni siquiera abriendo la base de datos.
- **Permisos validados en el servidor:** un botón oculto no es una puerta abierta.
- **Sin ventas dobles:** las operaciones son transaccionales y bloquean el stock afectado, así dos cajas no venden la misma pieza.
- **Conexión cifrada** con verificación del certificado oficial.
- **Bloqueo temporal** tras varios intentos fallidos de ingreso y sesiones que vencen solas.

---

## 🚀 Puesta en marcha

**Necesitas:** Node.js 22.13 o superior, conexión a Internet y el archivo `.env.local` con los datos de tu base en Supabase.

```bash
npm install     # una sola vez
npm run dev     # abre FerreStock en http://127.0.0.1:5173
```

En VS Code también puedes pulsar **⇧⌘B** (Mac) para abrirlo.

La primera vez que se abre sin usuarios, el sistema te guía para crear al **administrador**. Después, inicia sesión con tu usuario y contraseña de FerreStock.

### Configuración (`.env.local`)

```
PGHOST=
PGPORT=5432
PGDATABASE=postgres
PGUSER=
PGPASSWORD=
```

> ⚠️ Este archivo contiene la contraseña de tu base de datos. No lo compartas ni lo publiques.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre el programa en modo desarrollo |
| `npm run build` | Compila la interfaz |
| `npm run preview` | Sirve la versión compilada junto con el servidor |

---

## ☁️ Publicarlo en internet

FerreStock está publicado en **Google Cloud Run**: **https://ferrestock-pgyocehooa-nn.a.run.app**. Cada vez que se suben cambios de código a la rama `main` de GitHub, el link se actualiza solo. Para publicarlo desde cero, sigue la [guía de publicación](docs/DOCUMENTACION.md#parte-3-publicar-en-google-cloud-run). El proyecto ya incluye el `Dockerfile`, el servidor de producción (`npm start`) y un script que lo publica con un solo comando.

> El link usa la misma base de datos que tu `.env.local`. Crea un usuario aparte para quien lo vea.

---

## 🧱 Tecnologías y servicios

FerreStock usa herramientas estándar de la industria; casi todo el código es propio, con muy pocas librerías externas (solo React, el paquete `pg` y Vite).

### Lo que ves y lo que corre

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Interfaz | **React 19** + **JSX** | Todas las pantallas, tablas, ventanas y formularios |
| Compilador | **Vite 8** | Abre el programa mientras se desarrolla y lo compila para publicar |
| Estilos | **CSS propio** (sin librerías) | Tema oscuro y claro, diseño adaptable a la pantalla |
| Íconos y gráficas | **SVG** dibujado a mano | Íconos de ferretería y las gráficas de barras y de círculo (también las del informe impreso) |
| Servidor | **Node.js 22** (`node:http`, sin Express) | La API: ventas, inventario, usuarios, cotizaciones y reportes |
| Base de datos | **PostgreSQL** con el paquete **`pg`** | Productos, movimientos, ventas, cotizaciones, usuarios y sesiones |
| Instalable | **PWA** (manifiesto web e íconos) | Se puede instalar como aplicación desde el navegador |

### Servicios en la nube

| Servicio | Para qué se usa |
|---|---|
| **Supabase** | Aloja la base PostgreSQL, con conexión cifrada y verificación del certificado |
| **Google Cloud Run** | Ejecuta FerreStock en internet y da el link público |
| **Google Cloud Build** y **Artifact Registry** | Compilan el programa y guardan su imagen |
| **Google Secret Manager** | Guarda la contraseña de la base fuera del código |
| **GitHub** | Guarda el código y su historial |
| **GitHub Actions** + **Workload Identity Federation** | Publican la nueva versión solos al subir cambios, sin guardar claves de Google en GitHub |
| **Docker** | Empaqueta el programa para que funcione igual en cualquier lugar |

### Seguridad

- Contraseñas guardadas con **scrypt** (cifrado de una sola vía) y bloqueo temporal tras intentos fallidos.
- Sesión en una **cookie** `HttpOnly`, `SameSite=Strict` y `Secure`.
- Permisos por rol validados **en el servidor**, más cabeceras de seguridad (`Content-Security-Policy` y otras).
- **Transacciones** y bloqueos en la base para que dos cajas no vendan la misma pieza.

### Herramientas de desarrollo

**Visual Studio Code**, **Node.js / npm**, **Git y GitHub Desktop**, la consola de **Google Cloud (`gcloud`)** y **Chrome** para probar y tomar las capturas de la documentación. Parte del código y de la documentación se escribió con la ayuda de **Claude Code** (asistente de IA de Anthropic), siguiendo las indicaciones del autor.

📚 El detalle de cada pieza está en la [Guía técnica](docs/DOCUMENTACION.md#parte-2-guía-técnica-del-código).

---|---|
| Interfaz | React 19 + Vite 8 |
| Servidor | Node.js (integrado en Vite) |
| Base de datos | PostgreSQL en Supabase |

---

## 📁 Estructura

```
FerreStock/
├── src/          Pantallas: pantallas/ · ventanas/ · componentes/ · utilidades/
├── servidor/     Lógica: acceso/ · inventario/ · ventas/ · basedatos/ · comun/ · api.js
├── index.html    Página donde se dibuja la aplicación
└── vite.config.js
```

📚 Toda la documentación está en un solo archivo: [**`DOCUMENTACION.md`**](docs/DOCUMENTACION.md).

📜 ¿Qué cambió en cada versión? Mira el [**Historial de versiones**](docs/DOCUMENTACION.md#parte-4-historial-de-versiones), con capturas del antes y el después.

📖 ¿Quieres entender o modificar el código? Lee la [**Guía técnica**](docs/DOCUMENTACION.md#parte-2-guía-técnica-del-código): explica cada archivo, el modelo de datos, la API y dónde hacer cada cambio.

---

## ℹ️ Notas

- Las facturas son un **comprobante interno**. No son Documentos Tributarios Electrónicos (DTE) certificados por Hacienda.
- Los respaldos deben hacerse desde PostgreSQL/Supabase.
- No uses dos versiones del programa a la vez para registrar operaciones.
- Para detener el programa, pulsa **Ctrl + C** en la terminal; cerrar la pestaña del navegador no lo detiene.

<div align="center">

**FerreStock** · Hecho para ferreterías · v3.0

</div>
