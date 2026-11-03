# Aguas Justas: tablero del río San Antonio

Una sola app: React en el frontend, Node + Express en el backend y MySQL como base.

```
db/    los scripts SQL (la base original + ubicaciones, cruces y tensiones)
api/   backend en Express; también sirve el frontend compilado
web/   frontend en React + Vite (el mapa es de OpenStreetMap)
```

## Subirlo a Railway

1. Subí esta carpeta a un repositorio de GitHub.
2. En [railway.com](https://railway.com): **New Project → Deploy from GitHub repo** y elegí el repositorio. Railway usa el `Dockerfile` solo.
3. En el mismo proyecto: **+ Create → Database → MySQL**.
4. En el servicio de la app, entrá a **Variables** y agregá:
   ```
   MYSQL_URL = ${{MySQL.MYSQL_URL}}
   ```
5. En **Settings → Networking**, tocá **Generate Domain**. Esa es la dirección del tablero.

La primera vez que arranca, la app encuentra la base vacía, crea las tablas y carga los datos. No hay que importar nada a mano.

## Cambiar los datos

Editá los archivos de `db/`, subí los cambios a GitHub y, desde la consola del servicio en Railway, recargá la base:

```bash
npm run db:recargar
```

## Correrlo en tu compu

Necesitás Node 20 o más y un MySQL local con una base vacía.

```bash
export MYSQL_URL="mysql://usuario:clave@127.0.0.1:3306/aguas_justas"
cd web && npm install && npm run build      # compila el frontend
cd ../api && npm install && npm start       # carga la base si está vacía y abre http://localhost:3001
```

Para desarrollar el frontend con recarga en vivo: `cd web && npm run dev` (abre http://localhost:5173 y usa la API del puerto 3001).
