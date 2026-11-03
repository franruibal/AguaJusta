# Aguas Justas: tablero del río San Antonio

Una sola app: React en el frontend, Node + Express en el backend y MySQL como base.

```
api/   backend en Express (api/db tiene los scripts SQL de la base)
web/   frontend en React + Vite (el mapa es de OpenStreetMap)
```

## Subirlo a Vercel

El `vercel.json` define dos servicios en un mismo proyecto: `web` (React) responde en `/` y `api` (Express) en `/api`.

1. Subí esta carpeta a un repositorio de GitHub.
2. Conseguí una base MySQL en la nube, porque Vercel no trae MySQL propio. Sirven, por ejemplo, TiDB Cloud o Aiven, que tienen planes gratis. Copiá la cadena de conexión (`mysql://usuario:clave@host:puerto/base`).
3. En [vercel.com](https://vercel.com): **Add New → Project** e importá el repositorio. Vercel lee el `vercel.json` y arma los dos servicios.
4. En **Settings → Environment Variables** agregá:
   ```
   MYSQL_URL = mysql://usuario:clave@host:puerto/base
   MYSQL_SSL = true        # si el proveedor pide conexión cifrada (TiDB y Aiven la piden)
   ```
5. Hacé el deploy. La primera vez que alguien abre el tablero, la API encuentra la base vacía, crea las tablas y carga los datos.

Para probar todo junto en tu compu, igual que en Vercel: `vercel dev` desde esta carpeta.

## Cambiar los datos

Editá los archivos de `api/db/`, subí los cambios y recargá la base desde tu compu, apuntando a la base de la nube:

```bash
cd api && MYSQL_URL="mysql://..." MYSQL_SSL=true npm run db:recargar
```

## Correrlo en tu compu

Necesitás Node 20 o más y un MySQL local con una base vacía.

```bash
export MYSQL_URL="mysql://usuario:clave@127.0.0.1:3306/aguas_justas"
cd web && npm install && npm run build      # compila el frontend
cd ../api && npm install && npm start       # carga la base si está vacía y abre http://localhost:3001
```

Para desarrollar el frontend con recarga en vivo: `cd web && npm run dev` (abre http://localhost:5173 y usa la API del puerto 3001).
