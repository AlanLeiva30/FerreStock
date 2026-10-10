# FerreStock conectado a Supabase

Abre `ABRIR_FERRESTOCK.cmd` e inicia sesión con tu usuario y contraseña de FerreStock habituales. La contraseña de la base de datos no es la contraseña de ingreso del usuario.

El programa necesita Internet. Los cambios se guardan en Supabase; `data/ferrestock.db` queda como copia anterior y ya no recibe actualizaciones. No uses a la vez la versión anterior para registrar nuevas ventas.

La configuración privada está en `.env.local`. Si cambias la contraseña de la base en Supabase, actualiza `PGPASSWORD` en ese archivo y reinicia el programa. No compartas ni subas ese archivo. La conexión verifica el certificado oficial incluido en `servidor/supabase-ca.crt`.

Se conservan los usuarios, sus contraseñas de FerreStock, los roles, las ventas y el inventario migrados. Las vistas del visor se calculan en el servidor. El navegador no recibe claves de base de datos.

Para cerrar el programa iniciado con doble clic, cierra su ventana. No basta con cerrar la pestaña del navegador.

Las operaciones de escritura se ejecutan en transacciones y se serializan entre instancias del programa para evitar ventas simultáneas sobre el mismo stock. Las ventas y movimientos también bloquean los productos afectados.

Verificación realizada: comparación de los datos de todas las tablas migradas, consultas de reportes y vistas en Supabase, y pruebas de escritura en PostgreSQL local en memoria (ventas, inventario, usuarios, sesiones, permisos y rollback). No se crearon ventas de prueba en la base real.
