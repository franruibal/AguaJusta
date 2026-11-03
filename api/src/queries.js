import { q } from './db.js';

/* Etiquetas legibles para los valores ENUM de la base */
export const CATEGORIA = {
  contaminacion: 'Contaminación', gestion: 'Gestión', infraestructura: 'Infraestructura',
  seguridad: 'Seguridad', ambiente: 'Ambiente', social: 'Social',
};
const CONDICION = { residente: 'Residente', trabajador: 'Trabaja en la zona', empleado_municipal: 'Empleada municipal', turista: 'Turista' };
const ORIGEN = { directa: 'Respuesta directa', reconstruida: 'Reconstruida del relato' };
const ESTADO = {
  anunciado: 'Anunciado', en_ejecucion: 'En ejecución', inaugurado: 'Inaugurado', vigente: 'Vigente',
  realizado: 'Realizado', sin_dato: 'Sin dato', sin_verificar: 'Sin verificar', observado: 'Observado en campo',
};
const TIPO_FUENTE = { oficial_municipal: 'Oficial municipal', oficial_provincial: 'Oficial provincial', prensa: 'Prensa', normativa: 'Normativa' };
const TIPO_LUGAR = { curso_agua: 'Curso de agua', localidad: 'Localidad', barrio: 'Barrio', balneario: 'Balneario', predio: 'Predio', sitio: 'Sitio' };

const lista = (s) => (s ? s.split('; ') : []);
const ORDEN_PREGUNTA = "FIELD(p.modulo, 'vecinos', 'municipal'), p.orden";

/* Subconsultas reutilizadas */
const TEMAS_DE_RESPUESTA = `(SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR '; ')
   FROM respuesta_tema rt JOIN tema t ON t.id_tema = rt.id_tema WHERE rt.id_respuesta = r.id_respuesta)`;
const LUGARES_DE_RESPUESTA = `(SELECT GROUP_CONCAT(l.nombre ORDER BY l.nombre SEPARATOR '; ')
   FROM respuesta_lugar rl JOIN lugar l ON l.id_lugar = rl.id_lugar WHERE rl.id_respuesta = r.id_respuesta)`;

const respuestaDesdeFila = (r) => ({
  id: r.id, entrevistado: r.entrevistado, perfil: r.perfil, salida: r.salida, pregunta: r.pregunta,
  texto: r.texto, origen: ORIGEN[r.origen], temas: lista(r.temas), lugares: lista(r.lugares),
});

/* ---------------------------------------------------------------- */

export async function resumen() {
  const [row] = await q(`SELECT
      (SELECT COUNT(*) FROM entrevistado)               AS entrevistas,
      (SELECT SUM(cantidad_personas) FROM entrevistado) AS personas,
      (SELECT COUNT(*) FROM respuesta)                  AS respuestas,
      (SELECT COUNT(*) FROM hallazgo)                   AS hallazgos,
      (SELECT COUNT(*) FROM dato_pendiente)             AS pendientes`);
  return { ...row, personas: Number(row.personas) };
}

/** Temas ordenados por cantidad de entrevistas que los mencionan. */
export async function temas() {
  const filas = await q(`SELECT t.nombre AS tema, t.categoria,
        COUNT(DISTINCT r.id_entrevistado) AS entrevistas,
        COUNT(DISTINCT rt.id_respuesta)   AS respuestas,
        (SELECT COUNT(*) FROM hallazgo_tema ht WHERE ht.id_tema = t.id_tema) AS hallazgos
      FROM tema t
      LEFT JOIN respuesta_tema rt ON rt.id_tema = t.id_tema
      LEFT JOIN respuesta r       ON r.id_respuesta = rt.id_respuesta
      GROUP BY t.id_tema, t.nombre, t.categoria
      ORDER BY entrevistas DESC, respuestas DESC, t.nombre`);
  // Orden fijo de categorías (el de la base): el color sigue a la categoría, nunca al ranking.
  const cats = await q('SELECT categoria FROM tema GROUP BY categoria ORDER BY MIN(id_tema)');
  return {
    categorias: cats.map((c) => CATEGORIA[c.categoria]),
    temas: filas.map((f) => ({ ...f, categoria: CATEGORIA[f.categoria] })),
  };
}

export async function categorias() {
  const filas = await q(`SELECT t.categoria, COUNT(DISTINCT r.id_entrevistado) AS entrevistas
      FROM respuesta_tema rt
      JOIN tema t      ON t.id_tema = rt.id_tema
      JOIN respuesta r ON r.id_respuesta = rt.id_respuesta
      GROUP BY t.categoria ORDER BY entrevistas DESC, t.categoria`);
  return filas.map((f) => ({ categoria: CATEGORIA[f.categoria], entrevistas: f.entrevistas }));
}

/** Respuestas por tema y entrevista (para la matriz). */
export async function matriz() {
  return q(`SELECT t.nombre AS tema, e.codigo AS entrevistado, COUNT(*) AS respuestas
      FROM respuesta_tema rt
      JOIN respuesta r    ON r.id_respuesta = rt.id_respuesta
      JOIN entrevistado e ON e.id_entrevistado = r.id_entrevistado
      JOIN tema t         ON t.id_tema = rt.id_tema
      GROUP BY t.nombre, e.codigo`);
}

export async function entrevistados() {
  const filas = await q(`SELECT e.codigo AS entrevistado, e.perfil, e.condicion, e.cantidad_personas AS personas,
        e.localidad_residencia AS localidad, e.antiguedad, e.observaciones, s.numero AS salida
      FROM entrevistado e JOIN salida_campo s ON s.id_salida = e.id_salida
      ORDER BY e.codigo`);
  return filas.map((f) => ({ ...f, condicion: CONDICION[f.condicion], localidad: f.localidad ?? 'Sin dato' }));
}

export async function preguntas() {
  const filas = await q(`SELECT p.codigo AS pregunta, p.modulo, p.orden, p.texto,
        (SELECT COUNT(*) FROM respuesta r WHERE r.id_pregunta = p.id_pregunta) AS respuestas,
        (SELECT GROUP_CONCAT(e.codigo ORDER BY e.codigo SEPARATOR ', ') FROM entrevistado e
          WHERE NOT EXISTS (SELECT 1 FROM respuesta r WHERE r.id_entrevistado = e.id_entrevistado AND r.id_pregunta = p.id_pregunta)
        ) AS sin_respuesta
      FROM pregunta p ORDER BY ${ORDEN_PREGUNTA}`);
  return filas.map((f) => ({ ...f, modulo: f.modulo === 'vecinos' ? 'Vecinos' : 'Municipal', sin_respuesta: f.sin_respuesta ? f.sin_respuesta.split(', ') : [] }));
}

/** Respuestas con filtros opcionales: pregunta, entrevistado, tema, lugar. */
export async function respuestas({ pregunta = null, entrevistado = null, tema = null, lugar = null } = {}) {
  const filas = await q(`SELECT r.id_respuesta AS id, e.codigo AS entrevistado, e.perfil, s.numero AS salida,
        p.codigo AS pregunta, r.texto, r.origen,
        ${TEMAS_DE_RESPUESTA} AS temas, ${LUGARES_DE_RESPUESTA} AS lugares
      FROM respuesta r
      JOIN entrevistado e ON e.id_entrevistado = r.id_entrevistado
      JOIN salida_campo s ON s.id_salida = e.id_salida
      JOIN pregunta p     ON p.id_pregunta = r.id_pregunta
      WHERE (? IS NULL OR p.codigo = ?)
        AND (? IS NULL OR e.codigo = ?)
        AND (? IS NULL OR EXISTS (SELECT 1 FROM respuesta_tema rt JOIN tema t ON t.id_tema = rt.id_tema
                                  WHERE rt.id_respuesta = r.id_respuesta AND t.nombre = ?))
        AND (? IS NULL OR EXISTS (SELECT 1 FROM respuesta_lugar rl JOIN lugar l ON l.id_lugar = rl.id_lugar
                                  WHERE rl.id_respuesta = r.id_respuesta AND l.nombre = ?))
      ORDER BY ${ORDEN_PREGUNTA}, e.codigo`,
    [pregunta, pregunta, entrevistado, entrevistado, tema, tema, lugar, lugar]);
  return filas.map(respuestaDesdeFila);
}

export async function temasPorPregunta({ pregunta = null } = {}) {
  return q(`SELECT p.codigo AS pregunta, t.nombre AS tema, COUNT(*) AS respuestas
      FROM respuesta_tema rt
      JOIN respuesta r ON r.id_respuesta = rt.id_respuesta
      JOIN pregunta p  ON p.id_pregunta = r.id_pregunta
      JOIN tema t      ON t.id_tema = rt.id_tema
      WHERE (? IS NULL OR p.codigo = ?)
      GROUP BY p.codigo, t.nombre
      ORDER BY respuestas DESC, t.nombre`, [pregunta, pregunta]);
}

/** Hallazgos documentales y de campo, con filtros opcionales. */
export async function hallazgos({ eje = null, lugar = null, ids = null } = {}) {
  const filas = await q(`SELECT h.id_hallazgo AS id, p.codigo AS eje, h.tipo, h.titulo, h.descripcion, h.estado,
        h.monto, h.fecha, f.titulo AS fuente, f.medio, f.tipo AS tipo_fuente, l.nombre AS lugar,
        (SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR '; ') FROM hallazgo_tema ht
           JOIN tema t ON t.id_tema = ht.id_tema WHERE ht.id_hallazgo = h.id_hallazgo) AS temas
      FROM hallazgo h
      LEFT JOIN pregunta p ON p.id_pregunta = h.id_pregunta
      LEFT JOIN fuente f   ON f.id_fuente = h.id_fuente
      LEFT JOIN lugar l    ON l.id_lugar = h.id_lugar
      WHERE (? IS NULL OR p.codigo = ?) AND (? IS NULL OR l.nombre = ?)
      ORDER BY h.id_hallazgo`, [eje, eje, lugar, lugar]);
  return filas
    .filter((h) => !ids || ids.includes(h.id))
    .map((h) => ({
      ...h,
      tipo: h.tipo === 'documental' ? 'Documental' : 'Observación de campo',
      estado: ESTADO[h.estado],
      fuente: h.fuente ?? (h.tipo === 'observacion_campo' ? 'Observación propia (Salida 2)' : 'Sin fuente (vacío documental)'),
      tipo_fuente: TIPO_FUENTE[h.tipo_fuente] ?? null,
      temas: lista(h.temas),
    }));
}

/** Lugares con su ubicación en el mapa y cuántas veces se los menciona. */
export async function lugares() {
  const filas = await q(`SELECT l.id_lugar AS id, l.nombre AS lugar, l.tipo, l.referencia,
        u.lat, u.lng, u.precision_ubicacion AS ubicacion, u.radio_m, u.localidad, u.nota,
        (SELECT COUNT(DISTINCT r.id_entrevistado) FROM respuesta_lugar rl
           JOIN respuesta r ON r.id_respuesta = rl.id_respuesta WHERE rl.id_lugar = l.id_lugar) AS entrevistas,
        (SELECT COUNT(*) FROM respuesta_lugar rl WHERE rl.id_lugar = l.id_lugar) AS respuestas,
        (SELECT COUNT(*) FROM hallazgo h WHERE h.id_lugar = l.id_lugar) AS hallazgos
      FROM lugar l LEFT JOIN lugar_ubicacion u ON u.id_lugar = l.id_lugar
      ORDER BY l.id_lugar`);
  return filas
    .map((f) => ({ ...f, tipo: TIPO_LUGAR[f.tipo], ubicacion: f.ubicacion ?? 'sin_ubicar', lat: f.lat == null ? null : Number(f.lat), lng: f.lng == null ? null : Number(f.lng) }))
    .sort((a, b) => (b.entrevistas + b.hallazgos) - (a.entrevistas + a.hallazgos) || a.lugar.localeCompare(b.lugar, 'es'));
}

/** Tensiones con las dos posturas, quiénes las sostienen, sus citas y los documentos relacionados. */
export async function tensiones() {
  const [ts, citas, docs, [{ total }]] = await Promise.all([
    q('SELECT id_tension, codigo, titulo, polo_a, polo_b FROM tension ORDER BY id_tension'),
    q(`SELECT tr.id_tension, tr.polo, r.id_respuesta AS id, e.codigo AS entrevistado, e.perfil, s.numero AS salida,
          p.codigo AS pregunta, r.texto, r.origen, ${TEMAS_DE_RESPUESTA} AS temas, ${LUGARES_DE_RESPUESTA} AS lugares
        FROM tension_respuesta tr
        JOIN respuesta r    ON r.id_respuesta = tr.id_respuesta
        JOIN entrevistado e ON e.id_entrevistado = r.id_entrevistado
        JOIN salida_campo s ON s.id_salida = e.id_salida
        JOIN pregunta p     ON p.id_pregunta = r.id_pregunta
        ORDER BY tr.id_tension, tr.polo, e.codigo, ${ORDEN_PREGUNTA}`),
    q('SELECT id_tension, id_hallazgo FROM tension_hallazgo'),
    q('SELECT COUNT(*) AS total FROM entrevistado'),
  ]);
  const todos = await hallazgos();
  return {
    total_entrevistas: total,
    tensiones: ts.map((t) => {
      const polo = (p, texto) => {
        const cs = citas.filter((c) => c.id_tension === t.id_tension && c.polo === p).map(respuestaDesdeFila);
        const quienes = [...new Set(cs.map((c) => c.entrevistado))].sort();
        return { polo: p, texto, entrevistas: quienes.length, quienes, citas: cs };
      };
      const a = polo('A', t.polo_a), b = polo('B', t.polo_b);
      const idsDocs = docs.filter((d) => d.id_tension === t.id_tension).map((d) => d.id_hallazgo);
      return {
        codigo: t.codigo, titulo: t.titulo, polos: [a, b],
        en_ambas: a.quienes.filter((e) => b.quienes.includes(e)),
        documentos: todos.filter((h) => idsDocs.includes(h.id)),
      };
    }),
  };
}

/** Cada eje municipal con sus temas cruzados, hallazgos, respuestas relacionadas y pendientes. */
export async function ejes() {
  const [ps, et, voces, pend, hs] = await Promise.all([
    q("SELECT p.id_pregunta, p.codigo, p.texto FROM pregunta p WHERE p.modulo = 'municipal' ORDER BY p.orden"),
    q('SELECT p.codigo, t.nombre FROM eje_tema et JOIN pregunta p ON p.id_pregunta = et.id_pregunta JOIN tema t ON t.id_tema = et.id_tema ORDER BY t.nombre'),
    q(`SELECT p.codigo AS eje, r.id_respuesta AS id, e.codigo AS entrevistado, e.perfil, s.numero AS salida,
          pr.codigo AS pregunta, r.texto, r.origen, ${TEMAS_DE_RESPUESTA} AS temas, ${LUGARES_DE_RESPUESTA} AS lugares,
          (r.id_pregunta = p.id_pregunta) AS directa,
          (SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ', ') FROM respuesta_tema rt
             JOIN eje_tema et ON et.id_tema = rt.id_tema AND et.id_pregunta = p.id_pregunta
             JOIN tema t ON t.id_tema = rt.id_tema WHERE rt.id_respuesta = r.id_respuesta) AS temas_cruzados
        FROM pregunta p
        JOIN respuesta r ON r.id_pregunta = p.id_pregunta OR EXISTS (
             SELECT 1 FROM respuesta_tema rt JOIN eje_tema et ON et.id_tema = rt.id_tema
             WHERE et.id_pregunta = p.id_pregunta AND rt.id_respuesta = r.id_respuesta)
        JOIN entrevistado e ON e.id_entrevistado = r.id_entrevistado
        JOIN salida_campo s ON s.id_salida = e.id_salida
        JOIN pregunta pr    ON pr.id_pregunta = r.id_pregunta
        WHERE p.modulo = 'municipal'
        ORDER BY p.orden, directa DESC, FIELD(pr.modulo, 'vecinos', 'municipal'), pr.orden, e.codigo`),
    pendientes(),
    hallazgos(),
  ]);
  return ps.map((p) => ({
    eje: p.codigo, texto: p.texto,
    temas: et.filter((x) => x.codigo === p.codigo).map((x) => x.nombre),
    hallazgos: hs.filter((h) => h.eje === p.codigo),
    voces: voces.filter((v) => v.eje === p.codigo).map((v) => ({
      ...respuestaDesdeFila(v),
      via: v.directa ? 'Respondió a este eje' : `Por el tema: ${v.temas_cruzados}`,
    })),
    pendientes: pend.filter((x) => x.eje === p.codigo),
  }));
}

export async function pendientes({ buscar = null } = {}) {
  const patron = buscar ? `%${buscar}%` : null;
  return q(`SELECT d.id_pendiente AS id, p.codigo AS eje, COALESCE(h.titulo, 'Sin hallazgo asociado') AS hallazgo, d.descripcion AS pendiente
      FROM dato_pendiente d
      LEFT JOIN hallazgo h ON h.id_hallazgo = d.id_hallazgo
      JOIN pregunta p ON p.id_pregunta = COALESCE(d.id_pregunta, h.id_pregunta)
      WHERE (? IS NULL OR CONCAT_WS(' ', p.codigo, h.titulo, d.descripcion) LIKE ?)
      ORDER BY ${ORDEN_PREGUNTA}, d.id_pendiente`, [patron, patron]);
}
