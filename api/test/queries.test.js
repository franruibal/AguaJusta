// Pruebas contra la base cargada con db/01 y db/02 (necesitan MySQL o MariaDB levantado).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.js';
import * as Q from '../src/queries.js';

after(() => pool.end());

test('resumen coincide con la base', async () => {
  assert.deepEqual(await Q.resumen(), { entrevistas: 8, personas: 11, respuestas: 49, hallazgos: 12, pendientes: 20 });
});

test('el tema más mencionado es Limpieza municipal (7 de 8)', async () => {
  const { temas, categorias } = await Q.temas();
  assert.equal(temas.length, 27);
  assert.equal(temas[0].tema, 'Limpieza municipal');
  assert.equal(temas[0].entrevistas, 7);
  assert.equal(categorias.length, 6);
});

test('filtros de respuestas', async () => {
  assert.equal((await Q.respuestas({ pregunta: 'P3' })).length, 7);
  assert.equal((await Q.respuestas({ entrevistado: 'E7' })).length, 7);
  assert.equal((await Q.respuestas({ tema: 'Limpieza municipal' })).length, 12);
  assert.equal((await Q.respuestas({ lugar: 'Barrio El Dorado 2' })).length, 2);
});

test('preguntas sin respuesta', async () => {
  const p3 = (await Q.preguntas()).find((p) => p.pregunta === 'P3');
  assert.deepEqual(p3.sin_respuesta, ['E4']);
});

test('tensión T1: 3 contra 7 entrevistas, E5 y E7 en los dos lados', async () => {
  const { tensiones, total_entrevistas } = await Q.tensiones();
  const t1 = tensiones.find((t) => t.codigo === 'T1');
  assert.equal(total_entrevistas, 8);
  assert.deepEqual(t1.polos.map((p) => p.entrevistas), [3, 7]);
  assert.deepEqual(t1.en_ambas, ['E5', 'E7']);
});

test('lugares: 10 ubicados en el mapa y 5 sin ubicar', async () => {
  const ls = await Q.lugares();
  assert.equal(ls.filter((l) => l.lat != null).length, 10);
  assert.equal(ls.filter((l) => l.ubicacion === 'sin_ubicar').length, 5);
});

test('ejes M1–M5 con sus respuestas cruzadas', async () => {
  const es = await Q.ejes();
  assert.deepEqual(es.map((e) => e.eje), ['M1', 'M2', 'M3', 'M4', 'M5']);
  assert.deepEqual(es.map((e) => e.voces.length), [19, 4, 9, 8, 17]);
});

test('buscador de pendientes', async () => {
  assert.equal((await Q.pendientes()).length, 20);
  assert.ok((await Q.pendientes({ buscar: 'cloacal' })).length >= 1);
});
