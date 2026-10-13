#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Publica FerreStock en Google Cloud Run y te da el link.
# ─────────────────────────────────────────────────────────────
# Qué hace:
#   1. Lee los datos de conexión de tu .env.local (no se imprimen ni se suben al repositorio).
#   2. Guarda la contraseña de la base en Secret Manager de Google (no queda en tu historial de comandos).
#   3. Compila y publica el programa, y muestra el link público.
#
# Antes de ejecutarlo necesitas (ver docs/DOCUMENTACION.md, Parte 3):
#   - Una cuenta de Google Cloud con un proyecto y la facturación activada.
#   - La herramienta "gcloud" instalada y haber iniciado sesión: gcloud auth login
#
# Uso (desde la carpeta del proyecto):
#   ./scripts/desplegar-en-cloud-run.sh ID_DE_TU_PROYECTO
#
# Variables opcionales:  REGION (por defecto northamerica-northeast1, Montreal: la más cercana a tu Supabase)
#                        SERVICIO (por defecto ferrestock)

set -euo pipefail
cd "$(dirname "$0")/.."

PROYECTO="${1:-}"
REGION="${REGION:-northamerica-northeast1}"
SERVICIO="${SERVICIO:-ferrestock}"
SECRETO="ferrestock-pgpassword"

[ -n "$PROYECTO" ] || { echo "Falta el ID del proyecto de Google Cloud."; echo "Uso: ./scripts/desplegar-en-cloud-run.sh ID_DE_TU_PROYECTO"; exit 1; }
command -v gcloud >/dev/null || { echo "No está instalado gcloud. Mira docs/DOCUMENTACION.md (Parte 3, paso 2)."; exit 1; }
[ -f .env.local ] || { echo "No encuentro .env.local en esta carpeta."; exit 1; }

# Lee un valor de .env.local sin ejecutar nada del archivo.
# Si el valor está entre comillas ("..." o '...'), se las quita, igual que hace el programa al leerlo.
valor() {
  local v
  v="$(grep -E "^$1=" .env.local | head -1 | cut -d= -f2- | tr -d '\r')"
  case "$v" in
    \"*\") v="${v#\"}"; v="${v%\"}" ;;
    \'*\') v="${v#\'}"; v="${v%\'}" ;;
  esac
  printf '%s' "$v"
}
for variable in PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD; do
  [ -n "$(valor "$variable")" ] || { echo "Falta $variable en .env.local"; exit 1; }
done

echo "Proyecto: $PROYECTO · Región: $REGION · Servicio: $SERVICIO"
echo "Usará la base de datos de tu .env.local (los mismos datos reales)."
read -r -p "¿Publicar ahora? Escribe SI para continuar: " confirmacion
[ "$confirmacion" = "SI" ] || { echo "Cancelado. No se publicó nada."; exit 0; }

gcloud config set project "$PROYECTO" >/dev/null
echo "→ Activando los servicios de Google necesarios (la primera vez tarda un poco)…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

echo "→ Guardando la contraseña de la base en Secret Manager…"
if gcloud secrets describe "$SECRETO" >/dev/null 2>&1; then
  printf '%s' "$(valor PGPASSWORD)" | gcloud secrets versions add "$SECRETO" --data-file=- >/dev/null
else
  printf '%s' "$(valor PGPASSWORD)" | gcloud secrets create "$SECRETO" --replication-policy=automatic --data-file=- >/dev/null
fi

NUMERO="$(gcloud projects describe "$PROYECTO" --format='value(projectNumber)')"
gcloud secrets add-iam-policy-binding "$SECRETO" \
  --member="serviceAccount:${NUMERO}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

echo "→ Compilando y publicando (tarda unos minutos)…"
gcloud run deploy "$SERVICIO" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 2 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,PGHOST=$(valor PGHOST),PGPORT=$(valor PGPORT),PGDATABASE=$(valor PGDATABASE),PGUSER=$(valor PGUSER)" \
  --set-secrets "PGPASSWORD=${SECRETO}:latest"

echo
echo "✅ Listo. Tu link público es:"
gcloud run services describe "$SERVICIO" --region "$REGION" --format='value(status.url)'
