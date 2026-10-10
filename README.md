# FerreStock

Sistema de inventario y ventas para ferretería, construido con React y Vite. La base activa está en Supabase (PostgreSQL).

## Abrir el programa

Doble clic en `ABRIR_FERRESTOCK.cmd`. Requiere Internet. Inicia sesión con el mismo usuario y contraseña de FerreStock que utilizabas antes de la migración. Si el puerto 5173 está ocupado por FerreStock, abre `http://127.0.0.1:5173/` sin iniciar otra instancia.

## Configuración

La conexión privada se configura en `.env.local`. No compartas ese archivo. Si cambias la contraseña de la base en Supabase, actualiza `PGPASSWORD` y reinicia FerreStock. Las contraseñas de ingreso de los usuarios se administran dentro del programa.

El servidor conserva la validación de permisos: el administrador administra todo; el vendedor cobra y consulta sus facturas; el trabajador consulta existencias sin precios ni costos.

## Datos y respaldo

Los cambios nuevos se guardan en Supabase. `data/ferrestock.db` es una copia histórica anterior a la migración: copiarla ya no respalda los nuevos datos. Los respaldos actuales deben hacerse desde PostgreSQL/Supabase. No ejecutes la versión anterior para registrar operaciones nuevas.

Se conservó un respaldo del código y la base local antes de instalar esta actualización. `LEEME_SUPABASE.md` contiene detalles y verificaciones. `GUIA_DEL_CODIGO.md` describe la estructura original y puede contener referencias antiguas a SQLite.

## Desarrollo

`npm run dev` abre el programa localmente. `npm run build` compila la interfaz; `npm run preview` la sirve junto al servidor local. No basta con publicar la carpeta `dist`: las rutas de servidor siguen siendo necesarias.

Las operaciones de escritura son transaccionales. La conexión usa TLS con validación del certificado de Supabase. El programa no arranca otra base local si pierde Internet.
