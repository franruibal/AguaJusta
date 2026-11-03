import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import * as Q from './queries.js';
import { cargar } from './seed.js';

const app = express();
app.disable('x-powered-by');

/** Lee un parámetro de texto opcional de la query string (vacío = sin filtro). */
const param = (req, name, max = 120) => {
  const v = req.query[name];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Envuelve un handler async para que los errores lleguen al manejador común. */
const ruta = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

const api = express.Router();
api.get('/salud', ruta(async () => { await pool.query('SELECT 1'); return { ok: true }; }));
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

/* En producción la misma app sirve el frontend compilado. */
const here = path.dirname(fileURLToPath(import.meta.url));
const staticDir = process.env.STATIC_DIR ?? path.resolve(here, '../../web/dist');
if (existsSync(staticDir)) {
  app.use(express.static(staticDir, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
}

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'No se pudo leer la base de datos. Revisá que MySQL esté levantado y que la API tenga acceso.' });
});

const port = Number(process.env.PORT ?? 3001);

// La primera vez que arranca contra una base vacía, crea las tablas y carga los datos.
try {
  if (await cargar()) console.log('Base vacía: se cargaron las tablas y los datos.');
} catch (err) {
  console.error('No se pudo preparar la base:', err.message);
}
app.listen(port, () => console.log(`Aguas Justas en el puerto ${port}`));
