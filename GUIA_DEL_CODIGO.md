# Guía del código de FerreStock

Esta guía explica cómo está armado el programa, pensada para alguien que **nunca ha programado**.
No hace falta entenderlo todo: con saber qué hace cada carpeta y dónde se cambian las cosas más comunes, ya puedes moverte con confianza.

---

## 1. La idea general

FerreStock tiene **tres partes** que trabajan en cadena, como en una ferretería:

```
  PANTALLAS (src/)          SERVIDOR (servidor/)          BASE DE DATOS (data/)
  ─────────────────   →     ────────────────────    →     ─────────────────────
  Lo que ves en el          El "encargado de bodega":      La "bodega": el archivo
  navegador: botones,       recibe los pedidos, revisa     ferrestock.db donde se
  tablas y formularios.     que tengan sentido y los       guarda todo.
  El "mostrador".           guarda o los busca.
```

Las pantallas **nunca** tocan la base de datos directamente: siempre le piden las cosas al servidor.
Así, el servidor puede revisar, por ejemplo, que no se venda más de lo que hay.

---

## 2. Qué hay en cada carpeta

```
FerreStock/
│
├── ABRIR_FERRESTOCK.cmd      ← Doble clic para abrir el programa
├── GUIA_DEL_CODIGO.md        ← Esta guía
├── README.md                 ← Cómo instalar y ejecutar
│
├── data/                     ← LOS DATOS (no se programa aquí)
│   ├── ferrestock.db             la base de datos: TODO tu inventario está aquí
│   └── respaldos/                copias automáticas de seguridad
│
├── servidor/                 ← EL SERVIDOR (habla con la base de datos)
│   ├── api.js                    ★ la "recepción": qué pedidos se aceptan y QUIÉN puede hacerlos
│   ├── roles.js                  ★ los roles (administrador, vendedor, trabajador) y qué hace cada uno
│   ├── sesiones.js               iniciar sesión, saber quién es, cerrar sesión
│   ├── usuarios.js               crear y editar usuarios y asignarles su rol
│   ├── seguridad.js              guarda las contraseñas "revueltas" (nunca tal cual)
│   ├── ventas.js                 cobrar una venta, ver o reimprimir su factura y sumar las ventas de cada día
│   ├── negocio.js                datos de la ferretería que salen en la factura
│   ├── productos.js              crear, editar, activar y desactivar productos
│   ├── movimientos.js            registrar entradas y salidas (y actualizar el stock)
│   ├── categorias.js             crear, renombrar, ordenar y borrar categorías
│   ├── visorDeBase.js            lee las tablas para la pantalla "Base de Datos"
│   ├── motivos.js                ★ lista de motivos (Venta al Contado, Merma…)
│   ├── datosIniciales.js         ★ productos de ejemplo de la primera vez
│   ├── baseDeDatos.js            abre el archivo data/ferrestock.db
│   ├── estructura.js             cómo son las tablas y las vistas
│   ├── actualizaciones.js        convierte bases de versiones anteriores
│   ├── transaccion.js            guarda varios cambios "todos o ninguno"
│   └── http.js                   herramientas para recibir y contestar pedidos
│
├── src/                      ← LAS PANTALLAS (lo que ves en el navegador)
│   ├── main.jsx                  el punto de arranque
│   ├── App.jsx                   decide si mostrar el ingreso o el programa
│   ├── Sistema.jsx               ★ el marco: barra superior, menú (según el rol) y buscador
│   ├── estilos.css               ★ colores, tamaños y posiciones
│   │
│   ├── pantallas/                una por cada opción del menú
│   │   ├── Ingreso.jsx              la primera pantalla: usuario y contraseña (y crear el primer administrador)
│   │   ├── Vender.jsx               la caja: agregar productos, cobrar y facturar
│   │   ├── Almacen.jsx              el stock del almacén (pantalla del trabajador)
│   │   ├── Usuarios.jsx             crear usuarios, asignar roles, ver qué hace cada rol
│   │   ├── PanelPrincipal.jsx
│   │   ├── Catalogo.jsx
│   │   ├── EntradasYSalidas.jsx
│   │   ├── Consulta.jsx
│   │   ├── Alertas.jsx
│   │   ├── Reportes.jsx             números, gráficas (ventas por día y reparto del inventario) y tablas
│   │   └── BaseDeDatos.jsx          ver las tablas guardadas (solo lectura)
│   │
│   ├── ventanas/                 las ventanas que se abren encima
│   │   ├── FormularioMovimiento.jsx    registrar entrada o salida
│   │   ├── FormularioProducto.jsx      nuevo producto / editar producto
│   │   ├── AdministrarCategorias.jsx   ventana "Categorías"
│   │   ├── FormularioUsuario.jsx       nuevo usuario / editar usuario (con su rol)
│   │   ├── QuitarUsuario.jsx           "¿Qué hacemos con…?": desactivar o eliminar a alguien
│   │   ├── VerFactura.jsx              ver e imprimir una factura
│   │   ├── FormularioNegocio.jsx       "Datos de la factura" (nombre, dirección, NIT…)
│   │   └── useGuardar.js               ayuda común para los botones "Guardar"
│   │
│   ├── componentes/              piezas pequeñas que se repiten
│   │   ├── Ventana.jsx                 la ventana emergente (fondo oscuro, ×, Escape)
│   │   ├── Alerta.jsx                  aviso grande estilo SweetAlert (bienvenida, "¿cerrar sesión?")
│   │   ├── CampoClave.jsx              casilla de contraseña con el botón 👁 para verla
│   │   ├── Factura.jsx                 la hoja de la factura (lo que se imprime)
│   │   ├── GraficaDeBarras.jsx         gráfica de barras (en Reportes: ventas de cada día)
│   │   ├── GraficaDeCirculo.jsx        gráfica de círculo (en Reportes: reparto del inventario)
│   │   ├── IconoDeArea.jsx             el cuadrito con el ícono y el color de una categoría (🔨, 🔩, 🚰…)
│   │   ├── EtiquetaEstado.jsx          la etiqueta OK / STOCK BAJO / AGOTADO
│   │   ├── FilasPorCategoria.jsx       tablas agrupadas por categoría
│   │   ├── FilaVacia.jsx               el mensaje "No se encontraron…"
│   │   └── TarjetaMovimiento.jsx       tarjetita de "Últimos Movimientos"
│   │
│   └── utilidades/               herramientas que usan varias pantallas
│       ├── servidor.js                 cómo pedirle cosas al servidor
│       ├── useInventario.js            carga productos, movimientos y categorías
│       ├── calculos.js                 alertas, totales, búsquedas, agrupar
│       ├── areas.js                    ★ el ícono y el color de cada categoría (🔨 Herramientas, 🔩 Ferretería…)
│       └── formato.js                  cómo se ven el dinero, cantidades y fechas
│
├── vite.config.js            ← une las pantallas con el servidor
├── index.html                ← la página vacía donde se dibuja todo
├── package.json              ← lista de programas que necesita FerreStock
│
├── node_modules/             ← programas descargados (no tocar)
├── .runtime/                 ← Node.js portátil que usa ABRIR_FERRESTOCK.cmd (no tocar)
└── dist/                     ← versión "empaquetada" que crea npm run build (no tocar)
```

★ = los archivos que más probablemente quieras cambiar.

---

## 3. Usuarios, roles y permisos

Para entrar a FerreStock hay que escribir **usuario y contraseña**. Cada usuario tiene uno de estos **roles**:

| | Trabajador de almacén | Vendedor | Administrador |
|---|:---:|:---:|:---:|
| Ver el stock de cada producto (pantalla *Stock del Almacén*) | ✅ | ✅ (en *Vender*) | ✅ |
| Ver el precio de venta | ❌ | ✅ | ✅ |
| Armar una venta, **cobrar e imprimir la factura** (pantalla *Vender*) | ❌ | ✅ | ✅ |
| Volver a ver o imprimir facturas del día | ❌ | ✅ (las suyas) | ✅ (todas) |
| Ver el costo de los productos | ❌ | ❌ | ✅ |
| Crear/editar productos, entradas de stock, categorías | ❌ | ❌ | ✅ |
| Alertas, reportes, historial, base de datos | ❌ | ❌ | ✅ |
| Crear usuarios, **asignar roles**, cambiar contraseñas, desactivar o eliminar | ❌ | ❌ | ✅ |
| Cambiar los datos de la factura (nombre, dirección, NIT) | ❌ | ❌ | ✅ |

- **La primera vez** que se abre el programa no hay usuarios: aparece *Configuración inicial* para crear el administrador.
- Solo el administrador crea usuarios y les asigna el rol, en el menú **◉ Usuarios y Roles**.
- Para sacar a alguien del equipo, el administrador pulsa **Desactivar** y elige:
  - **⏸ Desactivar:** no puede entrar, pero sigue en la lista y se puede volver a activar.
  - **🗑 Eliminar:** desaparece de la lista para siempre (pide confirmar). Si nunca vendió, se borra por completo;
    si ya hizo ventas, queda guardado como *ELIMINADO* solo para que sus facturas sigan mostrando su nombre.
    Su nombre de usuario queda libre para otra persona.
  - Nadie puede desactivarse ni eliminarse a sí mismo, y siempre debe quedar un administrador activo.
- Los roles están guardados en la tabla `roles` de la base de datos (se llena sola con `servidor/roles.js`),
  y cada usuario en la tabla `usuarios` con su rol. La vista `usuarios_detalle` los muestra juntos.
- Los permisos se revisan en el **servidor** (`servidor/api.js`, columna "quién"), no solo en la pantalla.
  Aunque alguien lograra ver un botón que no le toca, el servidor rechazaría el pedido.
- Las contraseñas se guardan "revueltas" (`servidor/seguridad.js`): ni abriendo la base de datos se pueden leer.
  El botón **👁** de las casillas de contraseña muestra lo que se está escribiendo, para revisarlo antes de entrar o guardar.
- Tras 5 contraseñas equivocadas seguidas, ese usuario debe esperar 1 minuto.
- Al entrar, FerreStock saluda por el nombre ("¡Hola, Alan!") con un aviso que se cierra solo a los 30 segundos (o antes, con el botón "¡Empecemos!").
- La sesión dura 12 horas; el botón **⎋ Salir** (arriba a la derecha) la cierra antes, después de preguntar
  *"¿Seguro que quieres cerrar sesión?"*.
- **Si alguien olvida su contraseña**, el administrador le pone una nueva en *Usuarios* → *Editar*.
  Si el que la olvida es el administrador, otro administrador puede cambiarla. Por eso conviene tener dos administradores.

---

## 4. Ejemplo: qué pasa cuando un vendedor cobra y factura

1. En **Vender** (`src/pantallas/Vender.jsx`) el vendedor hace clic en los productos (o escribe el código y pulsa Enter).
   Se van sumando a la *Venta actual*, que muestra el total. Cada área tiene su ícono y su color, y los botones
   de arriba (🔨 Herramientas, 🔩 Ferretería…) muestran solo los productos de esa área.
2. Si el cliente lo pide, escribe su nombre y su DUI/NIT (si no, la factura dice *Consumidor Final*).
   Escribe el efectivo que le dieron (opcional) y ve el **cambio**. Pulsa **Cobrar y facturar**.
3. `src/utilidades/servidor.js` envía al servidor la lista de productos, cantidades y los datos del cliente.
4. En el servidor, `servidor/api.js` revisa que su rol pueda cobrar y llama a `cobrarVenta`
   en `servidor/ventas.js`, que:
   - revisa que haya stock de todo y calcula el total con los **precios guardados** (no con los de la pantalla);
   - guarda la venta, una salida por cada producto (con el nombre del vendedor) y descuenta el stock,
     todo junto o nada (`transaccion.js`);
   - devuelve la factura completa: la venta, cada producto y los datos del negocio (`negocio.js`).
5. Se abre la **factura** (`src/ventanas/VerFactura.jsx`). Con **🖨 Imprimir** sale solo la hoja de la factura
   (el resto de la pantalla se esconde al imprimir: sección 15 de `estilos.css`).
6. La factura queda en *Mis ventas de hoy*: tocándola se puede volver a imprimir.

> **Ojo:** esta factura es un comprobante interno del negocio. **No** es una factura electrónica (DTE) certificada por
> Hacienda. Si el negocio necesita emitir DTE, eso se hace con el sistema de Hacienda o con un proveedor autorizado.

---

## 5. Cambios comunes: dónde se hacen

> **Antes de cambiar código:** haz una copia de la carpeta del proyecto. Si algo sale mal, puedes volver atrás.
> Con `npm run dev` abierto, los cambios en `src/` se ven al instante en el navegador.
> Los cambios en `servidor/` necesitan reiniciar el programa (Ctrl + C y otra vez `npm.cmd run dev`).

| Quiero… | Archivo | Qué buscar |
|---|---|---|
| Crear un usuario, asignarle un rol, cambiar una contraseña, desactivar o eliminar a alguien | **No hace falta tocar código:** menú ◉ Usuarios y Roles | |
| Cambiar el nombre, dirección, teléfono o NIT de la factura | **No hace falta tocar código:** Vender → ✎ Datos de la factura (administrador) | |
| Dar a un rol otra pantalla del menú | `src/Sistema.jsx` (`MENU`, columna `roles`) **y** `servidor/api.js` (columna "quién") | ej. agregar `TRABAJADOR` a la lista |
| Cambiar el texto de lo que hace cada rol | `servidor/roles.js` | `descripcion` |
| Cambiar cuánto dura la sesión | `servidor/sesiones.js` | `HORAS_DE_SESION` |
| Cambiar los textos de la pantalla de ingreso (lema, "Inventario al día"…) | `src/pantallas/Ingreso.jsx` | `VENTAJAS`, `Tu ferretería` |
| Cambiar el texto de la bienvenida o cuántos segundos dura | `src/Sistema.jsx` | `Bienvenida`, `cerrarEnSegundos` |
| Cambiar el texto de "¿Seguro que quieres cerrar sesión?" | `src/Sistema.jsx` | `preguntandoSalir` |
| Agregar o quitar un motivo de entrada/salida | `servidor/motivos.js` | las listas `entrada` y `salida` |
| Cambiar un color | `src/estilos.css` | la lista de colores al inicio del archivo |
| Cambiar el ícono o el color de un área (categoría) | `src/utilidades/areas.js` | `AREAS` (se usa en Vender, Catálogo, Panel y Reportes) |
| Cambiar los colores de reserva de la gráfica de círculo | `src/componentes/GraficaDeCirculo.jsx` | `COLORES` (las categorías usan el color de su área) |
| Cambiar los botones "7 días / 30 días" de la gráfica de barras | `src/pantallas/Reportes.jsx` | `PERIODOS` (hasta 90 días) |
| Cambiar "Ferretería Medrano" | `src/Sistema.jsx`, `src/pantallas/Ingreso.jsx` y `src/pantallas/PanelPrincipal.jsx` | `Ferretería Medrano` |
| Cambiar el texto u orden del menú | `src/Sistema.jsx` | `MENU` |
| Cambiar los productos de ejemplo | `servidor/datosIniciales.js` | `PRODUCTOS_INICIALES` (solo afecta a una base nueva) |
| Cambiar el formato de dinero o fechas | `src/utilidades/formato.js` | `es-SV`, `USD` |
| Cambiar cuándo un producto está en "STOCK BAJO" | `src/utilidades/calculos.js` | `estadoDelProducto` |
| Crear, renombrar u ordenar categorías | **No hace falta tocar código:** Catálogo → ▤ Categorías | |

**Consejo:** en VS Code, **Ctrl + Shift + F** busca un texto en todos los archivos a la vez.

---

## 6. Palabras que vas a encontrar

| Palabra | Qué significa |
|---|---|
| **Base de datos** | El archivo donde se guarda todo (`data/ferrestock.db`). |
| **Tabla** | Como una hoja de Excel dentro de la base: `productos`, `movimientos`, `categorias`. |
| **Vista** | Una "tabla" de solo lectura que se calcula sola (ej. `inventario_por_categoria`). Solo sirve para mirar. |
| **SQL** | El idioma de las bases de datos. Es el texto como `SELECT … FROM productos …`. |
| **Servidor / API** | La parte que recibe pedidos de las pantallas y usa la base de datos. |
| **Componente** | Una pieza de pantalla reutilizable (archivos `.jsx`). |
| **JSX** | Mezcla de código y "HTML": `<button>Guardar</button>` dibuja un botón. |
| **React** | La herramienta con la que están hechas las pantallas. |
| **Vite** | La herramienta que abre el programa en el navegador (`npm run dev`). |
| **Node.js** | El programa que hace funcionar todo lo anterior en tu PC. |
| **`async` / `await`** | "Espera la respuesta": se usa cuando hay que esperar al servidor. |
| **`import` / `export`** | Un archivo "presta" (`export`) algo y otro lo "toma prestado" (`import`). |
| **`// …` o `/* … */`** | Comentarios: notas para personas, el programa las ignora. |
| **Sesión** | El tiempo entre que alguien inicia sesión y sale (o pasan 12 horas). |
| **Cookie** | Un dato pequeño que el navegador guarda y envía solo; aquí recuerda la sesión. |
| **Rol** | El tipo de usuario: *administrador*, *vendedor* o *trabajador de almacén*. Decide qué puede ver y hacer. |
| **Factura** | El comprobante de una venta. Su número es el número de la venta (tabla `ventas`). |

---

## 7. Reglas importantes

1. **El stock solo cambia con entradas y salidas.** Así cada cambio queda en el historial. Por eso "Editar producto" no deja cambiar el stock.
2. **Los productos no se borran, se desactivan.** Así su historial de movimientos no se pierde.
3. **No edites `data/ferrestock.db` a mano** mientras el programa está abierto. Para mirarlo, usa la pantalla **▣ Base de Datos** del menú de FerreStock (solo lectura).
4. **Respaldo:** copia `data/ferrestock.db` a una USB o a la nube de vez en cuando.
5. **Los usuarios se pueden desactivar o eliminar.** Aunque se elimine a alguien, sus ventas y facturas no se pierden. Siempre debe quedar al menos un administrador activo.
