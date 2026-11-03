/*
 * Carga la base desde db/01_aguas_justas.sql y db/02_lecturas.sql en la base
 * a la que apunta la conexión (en Railway se llama "railway").
 *
 *   node src/seed.js            carga solo si las tablas no existen
 *   node src/seed.js --recargar borra las tablas del tablero y las vuelve a cargar
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = process.env.DB_DIR ?? path.resolve(here, '../../db');
const ARCHIVOS = ['01_aguas_justas.sql', '02_lecturas.sql'];
const TABLAS = ['tension_hallazgo', 'tension_respuesta', 'tension', 'eje_tema', 'lugar_ubicacion', 'dato_pendiente',
  'hallazgo_tema', 'hallazgo', 'fuente', 'respuesta_lugar', 'respuesta_tema', 'lugar', 'tema', 'respuesta',
  'entrevistado', 'pregunta', 'salida_campo'];
const VISTAS = ['v_matriz_vecinos', 'v_menciones_por_tema', 'v_evidencia_por_pregunta', 'v_pendientes'];

/** Quita las líneas que crean o eligen la base: se usa la base de la conexión. */
const adaptar = (sql) => sql.split('\n').filter((l) => !/^\s*(DROP DATABASE|CREATE DATABASE|USE)\b/i.test(l)).join('\n');

export async function cargar({ recargar = false } = {}) {
  const cn = await mysql.createConnection({ ...config, multipleStatements: true, charset: 'utf8mb4' });
  try {
    const [hay] = await cn.query("SHOW TABLES LIKE 'respuesta'");
    if (hay.length && !recargar) return false;
    if (recargar) {
      await cn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const v of VISTAS) await cn.query(`DROP VIEW IF EXISTS \`${v}\``);
      for (const t of TABLAS) await cn.query(`DROP TABLE IF EXISTS \`${t}\``);
      await cn.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    for (const f of ARCHIVOS) await cn.query(adaptar(await readFile(path.join(dbDir, f), 'utf8')));
    return true;
  } finally {
    await cn.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cargar({ recargar: process.argv.includes('--recargar') })
    .then((hecho) => console.log(hecho ? 'Base cargada.' : 'La base ya tenía datos; no se tocó nada.'))
    .catch((err) => { console.error(err.message); process.exit(1); });
}
