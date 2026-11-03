import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describir, pool } from './db.js';
import * as Q from './queries.js';
import { cargar } from './seed.js';

/*
 * API del tablero. Todas las rutas viven bajo /api: en Vercel la reescritura
 * pública "/api/(.*)" manda la petición a este servicio con la ruta original.
 */
const app = express();
app.disable('x-powered-by');

/* La primera petición contra una base vacía crea las tablas y carga los datos. */
let preparada = null;
let errorCarga = null;
const prepararBase = () => {
  preparada ??= cargar()
    .then((hecho) => { errorCarga = null; if (hecho) console.log('Base vacía: se cargaron las tablas y los datos.'); })
    .catch((err) => {
      errorCarga = { codigo: err.code ?? null, mensaje: err.message };
      console.error('No se pudo preparar la base:', err.message);
      preparada = null;
    });
  return preparada;
};

/** Lee un parámetro de texto opcional de la query string (vacío = sin filtro). */
const param = (req, name, max = 120) => {
  const v = req.query[name];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Envuelve un handler async para que los errores lleguen al manejador común. */
/** Traduce los errores de conexión más comunes a qué revisar. */
const pista = (err) => ({
  ECONNREFUSED: 'No hay base en esa dirección. Si dice 127.0.0.1, falta cargar MYSQL_URL en Vercel y volver a desplegar.',
  ENOTFOUND: 'El host de MYSQL_URL no existe. Revisá que esté bien copiado; si la contraseña tiene @ # / ? o :, regenerala sin esos caracteres.',
  ETIMEDOUT: 'La base no responde. Revisá el host y el puerto (TiDB usa 4000).',
  ER_ACCESS_DENIED_ERROR: 'Usuario o contraseña incorrectos. En TiDB el usuario lleva un prefijo, por ejemplo XXXXXXXX.root.',
  ER_BAD_DB_ERROR: 'La base indicada al final de MYSQL_URL no existe. Usá /test o creala en TiDB.',
  ER_SECURE_TRANSPORT_REQUIRED: 'La base exige conexión cifrada: poné MYSQL_SSL=true.',
  HANDSHAKE_SSL_ERROR: 'Falló el cifrado. Si la base es local, poné MYSQL_SSL=false.',
}[err.code] ?? 'Revisá MYSQL_URL en Vercel (Settings → Environment Variables) y volvé a desplegar.');

const ruta = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

const api = express.Router();
api.use(async (req, res, next) => { await prepararBase(); next(); });
/* Diagnóstico: abrí /api/salud en el navegador para ver por qué falla la base (no muestra la contraseña). */
api.get('/salud', async (req, res) => {
  const conexion = describir();
  try {
    await pool.query('SELECT 1');
    const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'respuesta'");
    res.json({ ok: true, conexion, datos_cargados: n > 0, ...(errorCarga ? { error_al_cargar: errorCarga } : {}) });
  } catch (err) {
    res.status(503).json({ ok: false, conexion, error: { codigo: err.code ?? null, mensaje: err.message }, pista: pista(err), ...(errorCarga ? { error_al_cargar: errorCarga } : {}) });
  }
});
api.get('/resumen', ruta(() => Q.resumen()));
api.get('/temas', ruta(() => Q.temas()));
api.get('/categorias', ruta(() => Q.categorias()));
api.get('/matriz', ruta(() => Q.matriz()));
api.get('/entrevistados', ruta(() => Q.entrevistados()));
api.get('/preguntas', ruta(() => Q.preguntas()));
api.get('/respuestas', ruta((req) => Q.respuestas({
  pregunta: param(req, 'pregunta', 5), entrevistado: param(req, 'entrevistado', 5),
  tema: param(req, 'tema'), lugar: param(req, 'lugar'),
})));
api.get('/temas-por-pregunta', ruta((req) => Q.temasPorPregunta({ pregunta: param(req, 'pregunta', 5) })));
api.get('/hallazgos', ruta((req) => Q.hallazgos({ eje: param(req, 'eje', 5), lugar: param(req, 'lugar') })));
api.get('/lugares', ruta(() => Q.lugares()));
api.get('/tensiones', ruta(() => Q.tensiones()));
api.get('/ejes', ruta(() => Q.ejes()));
api.get('/pendientes', ruta((req) => Q.pendientes({ buscar: param(req, 'buscar', 80) })));
api.use((req, res) => res.status(404).json({ error: 'No existe esa ruta de la API.' }));
app.use('/api', api);

/*
 * Fuera de Vercel (en tu compu o en un servidor propio) la misma app sirve el
 * frontend compilado. En Vercel eso lo hace el servicio "web".
 */
if (!process.env.VERCEL) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = process.env.STATIC_DIR ?? path.resolve(here, '../../web/dist');
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }
}

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'No se pudo leer la base de datos. Abrí /api/salud para ver el motivo.', codigo: err.code ?? null });
});

/* En Vercel se usa la app exportada; en local se levanta un servidor. */
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => console.log(`Aguas Justas en http://localhost:${port}`));
}

export default app;
