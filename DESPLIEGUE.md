# Publicar FerreStock en Google Cloud Run

Con esto FerreStock queda en un servidor de Google, con un **link público** que puedes compartir y abrir desde cualquier computadora o celular.

> **Importante:** el link usará **la misma base de datos de Supabase** que tu programa de ahora. Quien tenga un usuario y contraseña de FerreStock podrá entrar y cambiar datos reales. Crea un usuario aparte para quien lo vea (por ejemplo un vendedor) y no compartas el tuyo. Al terminar, puedes apagar el servicio (paso 7) y cambiar o borrar la base.

## Qué se publica y qué no

| Se publica | No se publica nunca |
|---|---|
| Las pantallas compiladas y el servidor de FerreStock | `.env.local` (tus datos de conexión) |
| | La carpeta `docs/` con las capturas |

La contraseña de la base no viaja en el código: se guarda en **Secret Manager** de Google y se entrega al programa como variable de entorno.

## Antes de empezar (lo haces tú)

Estas partes necesitan tu cuenta de Google y tu tarjeta, así que no se pueden automatizar:

1. **Cuenta y proyecto de Google Cloud**
   - Entra a <https://console.cloud.google.com> con tu cuenta de Google.
   - Crea un proyecto nuevo (por ejemplo `ferrestock`) y **anota su ID** (aparece junto al nombre; puede ser distinto al nombre, por ejemplo `ferrestock-123456`).
   - Activa la **facturación** del proyecto (*Facturación → Vincular una cuenta de facturación*). Google pide una tarjeta, pero Cloud Run tiene una **capa gratuita mensual** y con poco uso normalmente no se cobra. Revisa los precios actuales en <https://cloud.google.com/run/pricing>.
   - Recomendado: en *Facturación → Presupuestos y alertas* crea un presupuesto de, por ejemplo, 5 USD para que Google te avise por correo si el gasto sube.

2. **Instalar `gcloud`** (la herramienta de Google para la terminal). En la terminal del Mac:

   ```bash
   curl https://sdk.cloud.google.com | bash
   ```

   Cierra y abre la terminal. Comprueba que funciona con `gcloud --version`. (Otra forma: el instalador de <https://cloud.google.com/sdk/docs/install>.)

3. **Iniciar sesión** (se abre el navegador para que aceptes con tu cuenta):

   ```bash
   gcloud auth login
   ```

## Publicar

Desde la carpeta del proyecto, ejecuta el script con el ID de tu proyecto:

```bash
./scripts/desplegar-en-cloud-run.sh ID_DE_TU_PROYECTO
```

El script:
1. Lee los datos de conexión de tu `.env.local` (no los muestra).
2. Pide confirmación: escribe `SI`.
3. Activa los servicios de Google necesarios (la primera vez tarda unos minutos).
4. Guarda la contraseña de la base en Secret Manager.
5. Compila el programa en Google y lo publica en la región **Montreal** (`northamerica-northeast1`), la más cercana a tu Supabase (Canadá).
6. Al final imprime el link, parecido a `https://ferrestock-xxxxxxxx-nn.a.run.app`.

La primera publicación tarda entre 3 y 8 minutos.

## Comprobar que funciona

1. Abre el link: debe aparecer la pantalla de ingreso.
2. Inicia sesión con tu usuario.
3. Crea desde *Usuarios y Roles* un usuario para quien vaya a verlo y dale solo el rol que necesite.

## Actualizar después de hacer cambios

Vuelve a ejecutar el mismo script. El link no cambia.

## Apagar o borrar (paso 7)

- **Dejar de publicar el programa** (el link deja de funcionar y no se cobra más):

  ```bash
  gcloud run services delete ferrestock --region northamerica-northeast1
  ```

- **Borrar todo el proyecto de Google** (incluye el secreto de la contraseña): *Consola de Google Cloud → IAM y administración → Configuración → Cerrar*.
- **Tu base de datos no se toca** al apagar el servicio. Si quieres cambiar la contraseña de la base, hazlo en Supabase (*Project Settings → Database*) y vuelve a ejecutar el script.

## Si algo falla

| Mensaje o problema | Qué hacer |
|---|---|
| `Billing account ... not found` o `billing must be enabled` | Falta activar la facturación del proyecto (paso 1). |
| `The user does not have permission` | Entra con la cuenta dueña del proyecto: `gcloud auth login`. |
| El link abre pero dice "Error interno" al entrar | Revisa los registros: *Consola → Cloud Run → ferrestock → Registros*. |
| No conecta a Supabase (tiempo de espera) | En Supabase, revisa *Settings → Database → Network restrictions*. Si hay restricciones de IP, Cloud Run no tiene una IP fija y quedaría bloqueado. |
| `Permission denied` al ejecutar el script | Ejecuta una vez `chmod +x scripts/desplegar-en-cloud-run.sh`. |
| `Build failed because the default service account is missing required IAM permissions` | Pasa en proyectos nuevos de Google. Dale a la cuenta de compilación el rol de constructor: `gcloud projects add-iam-policy-binding ID_DEL_PROYECTO --member="serviceAccount:NUMERO_DEL_PROYECTO-compute@developer.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"`. El número del proyecto sale en el propio mensaje de error (o con `gcloud projects describe ID_DEL_PROYECTO`). |
| El link abre, pero al entrar sale "Error interno del servidor" y los registros dicen `28P01` | La base rechazó la contraseña. El script ya quita las comillas de `.env.local` (si la contraseña está escrita `"así"`); vuelve a ejecutarlo para guardar la contraseña correcta. |
| `gcloud` dice que Python no es compatible | `gcloud` necesita Python 3.10 o más. Instala uno y apunta `CLOUDSDK_PYTHON` a él. |

## Probar el servidor de producción en tu computadora

```bash
npm run build
npm start
```

Se abre en `http://localhost:8080`. (Usa el mismo `.env.local`.)

## Notas de seguridad

- Cada entrada de la API valida el rol en el servidor; el link público no cambia eso.
- Tras 5 contraseñas incorrectas seguidas, el usuario espera 1 minuto. Ese contador es **por instancia** del servicio; por eso se limitó a 2 instancias.
- La cookie de sesión se envía solo por HTTPS en la nube (`Secure`).
- El servidor añade protecciones del navegador (CSP, `X-Frame-Options`, etc.).
