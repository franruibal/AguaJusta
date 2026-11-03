# Railway construye esta imagen: compila React y la sirve desde la API de Node.
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY api/src ./src
COPY api/db ./db
COPY --from=web /web/dist /app/web/dist
ENV NODE_ENV=production STATIC_DIR=/app/web/dist
USER node
CMD ["node", "src/server.js"]
