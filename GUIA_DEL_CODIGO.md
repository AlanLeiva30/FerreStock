# FerreStock · Guía técnica del código

Sistema de inventario y ventas para ferretería. Esta guía documenta su arquitectura, estructura, modelo de datos, API, permisos y dónde modificar cada comportamiento. Está escrita para poder leerse sin experiencia previa en programación; los términos técnicos se explican en el [glosario](#10-glosario).

| | |
|---|---|
| **Versión** | 1.7.0 |
| **Interfaz** | React 19 + Vite 8 |
| **Servidor** | Node.js ≥ 22.13 (middleware de Vite, sin framework adicional) |
| **Base de datos** | PostgreSQL alojado en Supabase (`pg` 8) |
| **Idioma del código** | Español (nombres de archivos, funciones y textos) |

## Contenido

1. [Arquitectura](#1-arquitectura)
2. [Puesta en marcha](#2-puesta-en-marcha)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Referencia de la API](#5-referencia-de-la-api)
6. [Roles y permisos](#6-roles-y-permisos)
7. [Flujo de ejemplo: cobrar una venta](#7-flujo-de-ejemplo-cobrar-una-venta)
8. [Seguridad y consistencia de datos](#8-seguridad-y-consistencia-de-datos)
9. [Guía de cambios frecuentes](#9-guía-de-cambios-frecuentes)
10. [Glosario](#10-glosario)

---

## 1. Arquitectura

FerreStock se divide en **tres capas**. Cada una solo habla con la siguiente:

```
┌────────────────────┐      ┌───────────────────────┐      ┌──────────────────────┐
│  INTERFAZ  (src/)  │ ───► │  SERVIDOR (servidor/) │ ───► │  BASE DE DATOS       │
│  React, navegador  │ /api │  reglas y permisos    │  SQL │  PostgreSQL/Supabase │
│  "el mostrador"    │ ◄─── │  "el encargado"       │ ◄─── │  "la bodega"         │
└────────────────────┘      └───────────────────────┘      └──────────────────────┘
```

- La interfaz **nunca** accede a la base de datos. Todo pasa por el servidor, que valida permisos y reglas del negocio (por ejemplo, que no se venda más stock del que existe).
- Las credenciales de la base viven solo en `.env.local`, que lee el servidor. El navegador nunca las recibe.
- En desarrollo, un único proceso (Vite) sirve la interfaz y atiende las peticiones `/api`, tal como lo configura `vite.config.js`.

### Cómo se conectan los módulos

```
index.html ─► src/main.jsx ─► src/App.jsx ─┬─► pantallas/Ingreso.jsx          (sin sesión)
                                           └─► src/Sistema.jsx                (con sesión)
                                                  ├─► pantallas/*  ─► ventanas/*  ─► componentes/*
                                                  └─► utilidades/servidor.js ──── /api ────┐
                                                                                           ▼
 vite.config.js ──────────────────────────────────────────────────────────────►  servidor/api.js
                                                                                           │
                          ┌────────────────────┬──────────────────┬────────────────────┐   │
                          ▼                    ▼                  ▼                    ▼   ▼
                    acceso/              inventario/          ventas/             basedatos/
               roles · sesiones      productos · categorias   ventas · negocio    postgres (Supabase)
               usuarios · seguridad  movimientos · motivos                        transaccion · visor
```

---

## 2. Puesta en marcha

**Requisitos:** Node.js ≥ 22.13, conexión a Internet y un archivo `.env.local` en la raíz.

```bash
npm install      # una sola vez: descarga las dependencias
npm run dev      # inicia el programa en http://127.0.0.1:5173
```

En VS Code también se puede usar **⇧⌘B** (tarea `FerreStock`, definida en `.vscode/tasks.json`).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Modo desarrollo. Los cambios en `src/` se ven al instante; los de `servidor/` requieren reiniciar (Ctrl + C y volver a ejecutar). |
| `npm run build` | Compila la interfaz en `dist/` (carpeta generada, no se edita). |
| `npm run preview` | Sirve la versión compilada junto con el servidor. |

**Contenido de `.env.local`** (archivo secreto, nunca se sube a un repositorio público):

| Variable | Descripción |
|---|---|
| `PGHOST` · `PGPORT` | Dirección y puerto del servidor de Supabase (pooler). |
| `PGDATABASE` | Nombre de la base (normalmente `postgres`). |
| `PGUSER` | Usuario técnico de la base de datos (no es un usuario de FerreStock). |
| `PGPASSWORD` | Contraseña de la base de datos. |

---

## 3. Estructura del proyecto

★ marca los archivos que con más probabilidad se modificarán.

### 3.1 Raíz

| Archivo / carpeta | Función |
|---|---|
| `.env.local` | Credenciales de conexión a Supabase. |
| `package.json` · `package-lock.json` | Dependencias, versiones exactas y comandos `npm run …`. |
| `vite.config.js` | Conecta la interfaz con el servidor: las rutas `/api` se atienden con `servidor/api.js`. |
| `index.html` | Página vacía donde React dibuja la aplicación. |
| `README.md` · `GUIA_DEL_CODIGO.md` · `CHANGELOG.md` · `DESPLIEGUE.md` | Documentación (uso, técnica, historial de versiones y cómo publicarlo en Google Cloud Run). |
| `Dockerfile` · `.dockerignore` · `.gcloudignore` | Empaquetado para la nube. Excluyen siempre `.env.local`. |
| `scripts/desplegar-en-cloud-run.sh` | Publica FerreStock en Google Cloud Run con un comando. |
| `docs/versiones/` | Capturas de pantalla (antes y después) que usa el `CHANGELOG.md`. Se tomaron con datos de ejemplo. |
| `.gitignore` · `.gitattributes` | Reglas de git: qué no se sube y cómo se normalizan los saltos de línea. |
| `.vscode/tasks.json` | Tarea `FerreStock` para VS Code. |
| `node_modules/` | Dependencias descargadas; se regenera con `npm install`. No se edita. |

### 3.2 `servidor/` — lógica y acceso a datos

| Carpeta | Archivo | Responsabilidad |
|---|---|---|
| (raíz) | `api.js` ★ | Tabla de rutas: qué petición se acepta, **quién** puede hacerla y qué función la atiende. |
| (raíz) | `produccion.js` | Servidor para la nube (`npm start`): sirve las pantallas compiladas y atiende `/api`. En tu computadora esto lo hace Vite. |
| `acceso/` | `roles.js` ★ | Define los roles (administrador, vendedor, trabajador) y su descripción. |
| | `sesiones.js` | Iniciar y cerrar sesión, identificar al usuario de cada petición, primer administrador. |
| | `usuarios.js` | Crear, editar, desactivar y eliminar usuarios; asignar rol. |
| | `seguridad.js` | Cifrado de contraseñas (scrypt) y llaves de sesión. |
| | `perfil.js` | Foto de perfil, ajustes personales y cambio de la propia contraseña. Crea las columnas `foto` y `preferencias` si faltan. |
| `inventario/` | `productos.js` | Crear, editar, activar y desactivar productos; filtra datos según el rol. |
| | `categorias.js` | Crear, renombrar, ordenar y borrar categorías. |
| | `movimientos.js` | Registrar entradas y salidas y actualizar el stock. |
| | `motivos.js` ★ | Lista de motivos de entrada y salida (Venta al Contado, Merma…). |
| `ventas/` | `ventas.js` | Cobrar, consultar y reimprimir facturas, ventas del día y por día. |
| | `negocio.js` | Datos de la ferretería que aparecen en la factura. |
| `basedatos/` | `postgres.js` | Conexión privada a Supabase (TLS con verificación de certificado). |
| | `baseDeDatos.js` | Punto único de acceso a la base para el resto del servidor. |
| | `transaccion.js` | Agrupa varios cambios para que se guarden "todos o ninguno". |
| | `visorDeBase.js` · `vistasConsulta.js` | Alimentan la pantalla *Base de Datos* (solo lectura). |
| | `supabase-ca.crt` | Certificado oficial para comprobar que la conexión es realmente con Supabase. |
| `comun/` | `http.js` | Lectura de peticiones, respuestas, cookies y códigos de error. |

### 3.3 `src/` — interfaz

| Carpeta / archivo | Contenido |
|---|---|
| `main.jsx` | Punto de arranque del navegador. |
| `App.jsx` | Decide entre pantalla de ingreso y programa, según haya sesión. |
| `Sistema.jsx` ★ | Marco general: barra superior, menú según el rol, buscador y bienvenida. |
| `estilos.css` ★ | Colores, tamaños y posiciones de toda la interfaz. |
| **`pantallas/`** | Una por cada opción del menú (ver tabla siguiente). |
| **`ventanas/`** | Ventanas emergentes y formularios (incluye `AjustesDeUsuario.jsx`, los ajustes de cuenta de cada persona). |
| **`componentes/`** | Piezas reutilizables sin lógica de negocio. |
| **`utilidades/`** | Funciones compartidas: comunicación con el servidor, cálculos y formato. |

**Pantallas** (cada una se conecta al servidor mediante `utilidades/servidor.js`):

| Pantalla | Rol | Función |
|---|---|---|
| `Ingreso.jsx` | Público | Usuario y contraseña; creación del primer administrador. |
| `PanelPrincipal.jsx` | Admin | Resumen general e indicadores. |
| `Vender.jsx` | Admin · Vendedor | Caja: armar la venta, cobrar y facturar. |
| `Almacen.jsx` | Trabajador | Stock por categoría, sin precios ni costos. |
| `Catalogo.jsx` | Admin | Alta, edición y estado de productos; administración de categorías. |
| `EntradasYSalidas.jsx` | Admin | Historial de movimientos con filtros. |
| `Consulta.jsx` | Admin · Vendedor | Búsqueda rápida de productos. El vendedor la ve en solo lectura, sin costos y con aviso de poco stock y agotados. |
| `Alertas.jsx` | Admin · Vendedor | Productos bajo el mínimo. El administrador ve el costo de reposición y puede reabastecer; el vendedor solo consulta (sin costos). |
| `Reportes.jsx` | Admin | Estadísticas, ventas por día y reparto del inventario. |
| `Usuarios.jsx` | Admin | Gestión de usuarios y roles. |
| `BaseDeDatos.jsx` | Admin | Visor de tablas y resúmenes (solo lectura). |

**Ventanas:** `FormularioProducto`, `FormularioMovimiento`, `FormularioUsuario`, `FormularioNegocio`, `AdministrarCategorias`, `QuitarUsuario`, `VerFactura` y el ayudante `useGuardar.js` (estado "Guardando…" y errores en los formularios).

**Componentes:** `MenuDeUsuario` (foto + nombre arriba a la derecha, con cambiar foto, ajustes y cerrar sesión), `Avatar`, `Icono`, `Ventana`, `Alerta`, `CampoClave`, `Factura`, `GraficaDeBarras`, `GraficaDeCirculo`, `IconoDeArea`, `EtiquetaEstado`, `FilasPorCategoria`, `FilaVacia`, `TarjetaMovimiento`.

**Utilidades:** `foto.js` (recorta y reduce la foto de perfil a 256 × 256 px), `servidor.js` (peticiones a `/api`), `useInventario.js` (carga y refresca productos y movimientos), `calculos.js` (alertas, totales, búsquedas), `areas.js` ★ (ícono y color por categoría), `formato.js` (moneda, cantidades y fechas).

---

## 4. Modelo de datos

La base tiene **8 tablas**. Las relaciones se indican con `→`.

| Tabla | Descripción | Columnas principales |
|---|---|---|
| `categorias` | Categorías de productos y su orden en pantalla. | `id`, `nombre`, `orden` |
| `productos` | Catálogo con stock, costo y precio. | `id`, `codigo`, `nombre`, `categoria_id → categorias`, `unidad`, `stock`, `minimo`, `costo`, `precio`, `activo` |
| `movimientos` | Cada entrada o salida de mercadería. | `id`, `producto_id → productos`, `tipo`, `motivo`, `cantidad`, `usuario`, `nota`, `fecha`, `venta_id → ventas`, `precio_unitario` |
| `ventas` | Una fila por cobro (cada una es una factura). | `id`, `usuario_id → usuarios`, `total`, `recibido`, `cambio`, `fecha`, `cliente`, `cliente_documento` |
| `usuarios` | Personas que pueden entrar al sistema. | `id`, `usuario`, `nombre`, `rol → roles`, `clave_hash`, `clave_sal`, `activo`, `creado`, `eliminado`, `foto`, `preferencias` |
| `roles` | Tipos de usuario y su descripción. | `clave`, `nombre`, `descripcion`, `orden` |
| `sesiones` | Sesiones abiertas; guarda solo el *hash* de la llave. | `token_hash`, `usuario_id → usuarios`, `expira` |
| `negocio` | Datos de la ferretería para la factura (una sola fila). | `nombre`, `direccion`, `telefono`, `documento`, `mensaje` |

```
categorias ◄── productos ◄── movimientos ──► ventas ──► usuarios ──► roles
                                                           ▲
                                                       sesiones
```

La pantalla *Base de Datos* muestra además resúmenes calculados (`productos_por_categoria`, `inventario_por_categoria`, `movimientos_detalle`, `ventas_detalle`, `usuarios_detalle`), definidos en `servidor/basedatos/vistasConsulta.js`. Son solo de lectura.

---

## 5. Referencia de la API

Todas las rutas empiezan con `/api` y se declaran en `servidor/api.js`. Los métodos significan: `GET` consultar · `POST` crear · `PUT` modificar · `PATCH` cambiar un detalle · `DELETE` borrar.

**Quién puede llamarla:** `Público` (sin sesión) · `Todos` (cualquier usuario con sesión) · `Admin + Vendedor` · `Admin`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/sesion` | Público | Estado de la sesión actual. |
| POST | `/sesion/iniciar` | Público | Iniciar sesión. |
| POST | `/sesion/configurar` | Público | Crear el primer administrador (solo si no hay usuarios). |
| POST | `/sesion/cerrar` | Público | Cerrar sesión. |
| PUT | `/perfil` | Todos | Cambiar la propia foto y los propios ajustes. |
| POST | `/perfil/clave` | Todos | Cambiar la propia contraseña (pide la actual). |
| GET | `/productos` | Todos | Listar productos; cada rol recibe solo los datos que le corresponden. |
| POST | `/ventas` | Admin + Vendedor | Cobrar una venta y generar la factura. |
| GET | `/ventas/hoy` | Admin + Vendedor | Ventas del día (el vendedor ve solo las suyas). |
| GET | `/ventas/:id` | Admin + Vendedor | Ver o reimprimir una factura. |
| GET | `/configuracion` | Admin | Categorías y motivos para los formularios. |
| POST · PUT · DELETE | `/categorias` · `/categorias/:id` | Admin | Crear, renombrar, borrar. |
| POST | `/categorias/:id/mover` | Admin | Subir o bajar una categoría. |
| POST · PUT | `/productos` · `/productos/:id` | Admin | Crear o editar un producto. |
| PATCH | `/productos/:id/activo` | Admin | Activar o desactivar un producto. |
| GET · POST | `/movimientos` | Admin | Listar o registrar entradas y salidas. |
| GET · POST · PUT · DELETE | `/usuarios` · `/usuarios/:id` | Admin | Gestión de usuarios. |
| GET | `/roles` | Admin | Lista de roles y descripciones. |
| GET | `/reportes/ventas-por-dia?dias=7` | Admin | Ventas agrupadas por día. |
| GET · PUT | `/negocio` | Admin | Datos de la factura. |
| GET | `/base-de-datos` · `/base-de-datos/contenido?nombre=…` | Admin | Visor de solo lectura. |

---

## 6. Roles y permisos

| Capacidad | Trabajador | Vendedor | Administrador |
|---|:---:|:---:|:---:|
| Ver stock de cada producto | ✅ (*Stock del Almacén*) | ✅ (en *Vender*) | ✅ |
| Ver precio de venta | ❌ | ✅ | ✅ |
| Consultar el inventario con avisos de poco stock y agotados | ✅ (*Stock del Almacén*) | ✅ (*Consulta* y *Alertas*, solo lectura) | ✅ (*Alertas*) |
| Recibir la notificación de stock al entrar y el aviso cuando algo se agota | ❌ | ✅ | ✅ |
| Ver costo de los productos | ❌ | ❌ | ✅ |
| Cobrar e imprimir facturas | ❌ | ✅ | ✅ |
| Ver o reimprimir facturas del día | ❌ | ✅ (las suyas) | ✅ (todas) |
| Crear/editar productos, categorías y entradas de stock | ❌ | ❌ | ✅ |
| Alertas, reportes, historial y base de datos | ❌ | ❌ | ✅ |
| Crear usuarios, asignar roles, cambiar contraseñas, desactivar o eliminar | ❌ | ❌ | ✅ |
| Cambiar los datos de la factura | ❌ | ❌ | ✅ |

**Perfil y ajustes personales (todos los roles)**
- Al pulsar el nombre arriba a la derecha se abre un menú con **Cambiar foto de perfil**, **Ajustes de mi cuenta** y **Cerrar sesión**.
- La foto se recorta y se reduce en el navegador (256 × 256 px) y se guarda en la columna `usuarios.foto`.
- Los ajustes se guardan en `usuarios.preferencias` y acompañan a la persona en cualquier computadora: **tema** claro u oscuro, **menú compacto**, **pantalla de inicio**, **mostrar la bienvenida** y (administrador y vendedor) **avisarme del stock al entrar**.
- Cada persona puede cambiar **su propia contraseña** (pide la actual y cierra sus otras sesiones).
- Nadie puede modificar el perfil de otra persona desde ahí: el servidor siempre usa el usuario de la sesión.

**Gestión de usuarios**
- La primera vez que se abre el programa no hay usuarios: aparece *Configuración inicial* para crear al administrador.
- Solo el administrador crea usuarios y asigna roles (menú **Usuarios y Roles**).
- **Desactivar:** el usuario no puede entrar, pero sigue en la lista y puede reactivarse.
- **Eliminar:** desaparece de la lista. Si nunca vendió, se borra por completo; si ya tiene ventas, queda marcado como *eliminado* únicamente para que sus facturas conserven su nombre. Su nombre de usuario queda libre.
- Nadie puede desactivarse ni eliminarse a sí mismo, y siempre debe quedar al menos un administrador activo.
- **Contraseña olvidada:** el administrador asigna una nueva en *Usuarios → Editar*. Conviene tener dos administradores.

**Dónde se aplican los permisos:** en el servidor (`servidor/api.js`, columna "quién"), no solo en la interfaz. Aunque alguien lograra ver un botón que no le corresponde, el servidor rechazaría la petición. `roles.js` contiene la descripción de cada rol, pero **cambiarla no modifica los permisos reales**.

---

## 7. Flujo de ejemplo: cobrar una venta

1. En **Vender** (`src/pantallas/Vender.jsx`), el vendedor selecciona productos (con clic o escribiendo el código y pulsando Enter). Se acumulan en la *Venta actual* con su total.
2. Opcionalmente indica el cliente (nombre y DUI/NIT; si no, la factura dice *Consumidor Final*) y el efectivo recibido; la pantalla calcula el **cambio**. Luego pulsa **Cobrar y facturar**.
3. `src/utilidades/servidor.js` envía al servidor `POST /api/ventas` con los productos, las cantidades y los datos del cliente.
4. `servidor/api.js` verifica que el rol pueda cobrar y llama a `cobrarVenta` en `servidor/ventas/ventas.js`, que:
   - comprueba que haya stock de todo y calcula el total con los **precios guardados en la base** (no con los que muestra la pantalla);
   - guarda la venta, una salida por cada producto (con el nombre del vendedor) y descuenta el stock, **todo junto o nada** (`servidor/basedatos/transaccion.js`);
   - devuelve la factura completa: venta, productos y datos del negocio (`servidor/ventas/negocio.js`).
5. Se abre la factura (`src/ventanas/VerFactura.jsx`). **Imprimir** envía a la impresora solo la hoja de la factura; el resto de la pantalla se oculta (sección de impresión de `estilos.css`). También permite *Guardar como PDF*.
6. La factura queda en *Mis ventas de hoy* y puede reimprimirse.

> **Importante:** la factura es un comprobante interno. **No** es un Documento Tributario Electrónico (DTE) certificado por Hacienda. Si el negocio necesita emitir DTE, debe hacerlo con el sistema de Hacienda o con un proveedor autorizado.

---

## 8. Seguridad y consistencia de datos

| Aspecto | Cómo se resuelve |
|---|---|
| Contraseñas de usuarios | Se guardan cifradas con **scrypt** y sal individual (`clave_hash`, `clave_sal`). No se pueden recuperar, ni siquiera abriendo la base. |
| Intentos fallidos | Tras 5 contraseñas incorrectas seguidas, el usuario debe esperar 1 minuto. |
| Sesiones | Duran 12 horas. En la base solo se guarda el *hash* de la llave; el navegador la recibe en una cookie. |
| Permisos | Se validan en el servidor en cada petición y se revalidan antes de escribir. |
| Credenciales de la base | Solo en `.env.local`; el navegador nunca las recibe. Archivos sensibles (`.env*`, certificados, `servidor/`) están bloqueados para el servidor de desarrollo. |
| Conexión | TLS con verificación del certificado oficial de Supabase (`supabase-ca.crt`). |
| Escrituras | Son transaccionales y se serializan entre instancias; las ventas y movimientos bloquean los productos afectados para evitar ventas simultáneas sobre el mismo stock. |
| Sin conexión | El programa no arranca otra base local si pierde Internet. |

---

## 9. Guía de cambios frecuentes

> **Antes de modificar código**, haz una copia de la carpeta. Los cambios en `src/` se ven al instante con `npm run dev`; los de `servidor/` requieren reiniciarlo.

**Sin tocar código:**

| Quiero… | Dónde |
|---|---|
| Cambiar mi foto, mi tema, mi pantalla de inicio o mi contraseña | Nombre de usuario (arriba a la derecha) → **Ajustes de mi cuenta** |
| Crear usuarios, asignar roles, cambiar contraseñas, desactivar o eliminar | Menú **Usuarios y Roles** |
| Cambiar nombre, dirección, teléfono o NIT de la factura | **Vender → Datos de la factura** (administrador) |
| Crear, renombrar u ordenar categorías | **Catálogo → Categorías** |

**Modificando archivos:**

| Quiero… | Archivo | Qué buscar |
|---|---|---|
| Dar a un rol otra pantalla del menú | `src/Sistema.jsx` (`MENU`, columna `roles`) **y** `servidor/api.js` (columna "quién") | Agregar el rol a ambas listas |
| Cambiar el texto u orden del menú | `src/Sistema.jsx` | `MENU` |
| Cambiar la descripción de un rol | `servidor/acceso/roles.js` | `descripcion` |
| Agregar un ajuste personal nuevo | `servidor/acceso/perfil.js` (`normalizarPreferencias`) y `src/ventanas/AjustesDeUsuario.jsx` | Añadir la clave en ambos |
| Cambiar la duración de la sesión | `servidor/acceso/sesiones.js` | `HORAS_DE_SESION` |
| Agregar o quitar un motivo de entrada o salida | `servidor/inventario/motivos.js` | Listas `entrada` y `salida` |
| Cambiar el criterio de "STOCK BAJO" | `src/utilidades/calculos.js` | `estadoDelProducto` |
| Cambiar el formato de dinero o fechas | `src/utilidades/formato.js` | `es-SV`, `USD` |
| Cambiar colores generales | `src/estilos.css` | Lista de colores al inicio |
| Retocar el tema oscuro o el claro | `src/estilos.css` | El oscuro (marino con naranja) está en las secciones 1 a 12 y 16. El claro (crema con el mismo naranja, en tonos suaves) está en la sección 13 y 16, todas con `[data-theme="light"]` |
| Retocar la pantalla de ingreso en modo claro | `src/estilos.css` | Sección 17 (el ingreso oscuro es la sección 12c) |
| Cambiar ícono o color de una categoría | `src/utilidades/areas.js` | `AREAS` |
| Cambiar colores de reserva de la gráfica de círculo | `src/componentes/GraficaDeCirculo.jsx` | `COLORES` |
| Cambiar los períodos de la gráfica de barras | `src/pantallas/Reportes.jsx` | `PERIODOS` (hasta 90 días) |
| Cambiar los textos de ingreso | `src/pantallas/Ingreso.jsx` | `VENTAJAS`, `Tu ferretería` |
| Cambiar la bienvenida o el aviso de cerrar sesión | `src/Sistema.jsx` | `Bienvenida`, `cerrarEnSegundos`, `preguntandoSalir` |
| Cambiar el nombre "Ferretería Medrano" | `src/Sistema.jsx`, `src/pantallas/Ingreso.jsx`, `src/pantallas/PanelPrincipal.jsx` | `Ferretería Medrano` |
| Cambiar la contraseña de la base de datos | `.env.local` | `PGPASSWORD` (y reiniciar) |

**Consejo:** en VS Code, **⇧⌘F** (Mac) o **Ctrl + Shift + F** busca un texto en todos los archivos.

---

## 10. Glosario

| Término | Significado |
|---|---|
| **API** | Conjunto de rutas (`/api/…`) con las que la interfaz le pide cosas al servidor. |
| **Servidor** | La parte que recibe pedidos, valida permisos y usa la base de datos (`servidor/`). |
| **Base de datos** | Donde se guarda todo. Aquí es PostgreSQL en Supabase, en la nube. |
| **Supabase** | Servicio en Internet que aloja la base de datos. |
| **Tabla** | Como una hoja de Excel dentro de la base: `productos`, `ventas`… |
| **Vista / resumen** | Tabla calculada de solo lectura, por ejemplo `inventario_por_categoria`. |
| **SQL** | Lenguaje de las bases de datos (`SELECT … FROM productos …`). |
| **Transacción** | Grupo de cambios que se guardan completos o no se guarda ninguno. |
| **Hash** | Versión "revuelta" de un dato que permite comprobarlo pero no recuperarlo. |
| **Rol** | Tipo de usuario que define qué puede hacer: administrador, vendedor o trabajador. |
| **`.env.local`** | Archivo secreto con las credenciales de la base. |
| **React** | Herramienta con la que están hechas las pantallas. |
| **Componente** | Pieza de pantalla reutilizable (archivos `.jsx`). |
| **JSX** | Mezcla de código y "HTML": `<button>Guardar</button>` dibuja un botón. |
| **Vite** | Herramienta que abre el programa en el navegador y atiende `/api`. |
| **Node.js** | Programa que ejecuta el servidor y las herramientas en tu computadora. |
| **npm** | Instalador de programas de Node.js (`npm install`, `npm run dev`). |
| **`async` / `await`** | "Espera la respuesta": se usa cuando hay que esperar al servidor. |
