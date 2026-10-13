# ─────────────────────────────────────────────────────────────
# FerreStock empaquetado para la nube (Google Cloud Run)
# ─────────────────────────────────────────────────────────────
# Etapa 1: compila las pantallas (necesita las herramientas de desarrollo).
FROM node:22-slim AS construir
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: imagen final, liviana: solo lo necesario para ejecutar.
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=construir /app/dist ./dist
COPY servidor ./servidor
# Cloud Run define PORT (8080). No se copia .env.local: la conexión llega por variables de entorno.
USER node
EXPOSE 8080
CMD ["node", "servidor/produccion.js"]
