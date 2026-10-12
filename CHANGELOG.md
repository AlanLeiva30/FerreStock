# Historial de versiones

## 1.7.0 · 2026-10-12

### Nuevo
- **Vendedor:** ahora tiene la *Consulta de Inventario* en solo lectura (sin costos y sin poder modificar nada), con aviso de productos con poco stock y agotados, filtros, globo de alertas en el menú y en la campana, y etiquetas de estado en la pantalla de venta.
- **Alertas de stock para el vendedor:** pantalla *Alertas de Stock Mínimo* (solo lectura, sin costos), **notificación al entrar** con los productos que se están acabando y **aviso en vivo** cuando una venta deja un producto con poco stock o agotado. Se puede apagar en *Ajustes de mi cuenta*. El administrador recibe las mismas notificaciones.
- Nuevo ajuste personal *Avisarme del stock al entrar* (administrador y vendedor).

### Mejorado
- La pantalla *Alertas de Stock Mínimo* se adapta al rol: el administrador ve costos y puede reabastecer; el vendedor solo consulta.
- Descripción del rol vendedor actualizada.

## 1.6.0 · 2026-10-12

### Nuevo
- **Menú de usuario:** el nombre y "Salir" ahora son un solo menú desplegable con foto de perfil, *Cambiar foto de perfil*, *Ajustes de mi cuenta* y *Cerrar sesión*. Disponible para todos los roles.
- **Foto de perfil** por usuario, guardada en Supabase (columna `usuarios.foto`).
- **Ajustes personales** guardados en la cuenta (columna `usuarios.preferencias`): tema, menú compacto, pantalla de inicio y mostrar la bienvenida.
- **Cambiar la propia contraseña** desde los ajustes (pide la actual y cierra las otras sesiones).
- **Íconos vectoriales** con temática de ferretería (martillo, tuerca, válvula, casco…) en lugar de emojis y símbolos de texto.
- **Tema claro rediseñado** (crema con el naranja de FerreStock) y **pantalla de ingreso propia para el modo claro**. El tema elegido en el ingreso se conserva al entrar y se guarda en la cuenta.
- Retoques de relieve, sombras y barras de desplazamiento en ambos temas.

### Mejorado
- **Diseño fluido:** ocupa todo el ancho de la pantalla, con menú lateral fijo y barra superior sin botones partidos.
- **Globo de alertas** del menú: ya no tapa el texto.
- **Bienvenida** más corta (15 segundos).
- `servidor/` reorganizado en carpetas por tema (`acceso`, `inventario`, `ventas`, `basedatos`, `comun`).
- Documentación reescrita: `README.md` y `GUIA_DEL_CODIGO.md`.

### Corregido
- Textos de la pantalla de ingreso desactualizados (mencionaban el lanzador de Windows y datos "solo en esta computadora").

### Eliminado
- Código de SQLite sin uso (`actualizaciones.js`, `estructura.js`, `datosIniciales.js`), `ABRIR_FERRESTOCK.cmd` y `LEEME_SUPABASE.md`.

## 1.5.0
- Versión base con Supabase (PostgreSQL), roles, ventas con factura, inventario y reportes.
