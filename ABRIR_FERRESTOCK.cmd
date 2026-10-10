@echo off
REM ============================================================
REM  ABRIR FERRESTOCK
REM  Doble clic en este archivo para abrir el programa.
REM  Usa el Node.js portatil de la carpeta .runtime (no hace falta
REM  tener Node instalado) y abre el navegador en localhost:5173.
REM  Para cerrar FerreStock, cierra esta ventana negra.
REM ============================================================
cd /d "%~dp0"
echo Iniciando FerreStock...
echo Los datos se guardan en Supabase. Necesitas conexion a Internet. No cierres esta ventana mientras uses el sistema.
"%~dp0.runtime\node\node.exe" "%~dp0node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort --open
