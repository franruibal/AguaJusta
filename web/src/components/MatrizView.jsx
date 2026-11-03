import { useMemo, useRef } from 'react';
import { Cita, Estado, useTip } from './ui.jsx';
import { colorCategoria } from './TemasView.jsx';
import { activable, medir, plural, qs, recortar, useAncho, useApi, useTema } from '../lib.js';

function Matriz({ temas, categorias, ents, celdas, sel, setSel }) {
  const { pal } = useTema();
  const [ref, W] = useAncho(280);
  const caja = useRef(null);
  const { nodo, handlers } = useTip(caja);
  const color = colorCategoria(categorias, pal);
  const n = useMemo(() => new Map(celdas.map((c) => [`${c.tema}|${c.entrevistado}`, c.respuestas])), [celdas]);
  const perfil = new Map(ents.map((e) => [e.entrevistado, e.perfil]));
  const filas = [...temas].sort((a, b) => categorias.indexOf(a.categoria) - categorias.indexOf(b.categoria));

  const anchoEtiq = Math.max(...filas.map((t) => medir(t.tema))) + 6;
  const colW = Math.max(28, Math.min(54, (W - 24) / (ents.length + 5)));
  const labelW = Math.max(70, Math.min(anchoEtiq, W - 14 - colW * ents.length));
  const left = labelW + 14, filaH = 26, gap = 10;
  let y = 28, prev = null;
  const pos = filas.map((t) => { if (prev && prev !== t.categoria) y += gap; prev = t.categoria; const o = { ...t, y }; y += filaH; return o; });
  const H = y + 4, Wv = Math.max(W, left + colW * ents.length);
  const paso = (k) => pal.ord[Math.min(3, k) - 1];
  const marcada = (t, e, k) => k > 0 && ((sel.tema === t && sel.ent === e) || (sel.tema === t && !sel.ent) || (sel.ent === e && !sel.tema));

  return (
    <div className="chart" ref={(el) => { ref.current = el; caja.current = el; }} style={{ minHeight: H }}>
      {W > 0 && (
        <svg width="100%" viewBox={`0 0 ${Wv} ${H}`} role="group" aria-label="Matriz de temas por entrevista">
          {ents.map((e, j) => (
            <text key={e.entrevistado} className={`colhead hit${sel.ent === e.entrevistado ? ' on' : ''}`} x={left + j * colW + colW / 2} y={16} textAnchor="middle"
              {...activable(() => setSel({ ent: sel.ent === e.entrevistado && !sel.tema ? null : e.entrevistado, tema: null }), `Entrevista ${e.entrevistado}, ${e.perfil}`, sel.ent === e.entrevistado)}
              {...handlers([e.entrevistado, e.perfil, `Salida ${e.salida}`])}>{e.entrevistado}</text>
          ))}
          {pos.map((t) => (
            <g key={t.tema} transform={`translate(0,${t.y})`}>
              <rect x={0} y={6} width={4} height={filaH - 12} rx={1} fill={color(t.categoria)} />
              <text className={`lbl hit${sel.tema === t.tema ? ' on' : ''}`} x={10} y={filaH / 2 + 4}
                {...activable(() => setSel({ tema: sel.tema === t.tema && !sel.ent ? null : t.tema, ent: null }), `${t.tema}, ${plural(t.entrevistas, 'entrevista', 'entrevistas')}`, sel.tema === t.tema)}
                {...handlers([plural(t.entrevistas, 'entrevista', 'entrevistas'), t.tema, t.categoria])}>{recortar(t.tema, labelW - 6)}</text>
              {ents.map((e, j) => {
                const k = n.get(`${t.tema}|${e.entrevistado}`) ?? 0;
                return (
                  <rect key={e.entrevistado} x={left + j * colW + 1} y={1} width={colW - 2} height={filaH - 2} rx={3}
                    className={k ? 'hit' : undefined} fill={k ? paso(k) : pal.vacio}
                    stroke={marcada(t.tema, e.entrevistado, k) ? pal.tinta : 'none'} strokeWidth={1.5}
                    onClick={() => k && setSel({ tema: t.tema, ent: e.entrevistado })}
                    {...handlers([k ? plural(k, 'respuesta', 'respuestas') : 'No lo menciona', t.tema, `${e.entrevistado}, ${perfil.get(e.entrevistado)}`])} />
                );
              })}
            </g>
          ))}
        </svg>
      )}
      {nodo}
    </div>
  );
}

export default function MatrizView({ sel, setSel }) {
  const { pal } = useTema();
  const temas = useApi('/api/temas');
  const ents = useApi('/api/entrevistados');
  const celdas = useApi('/api/matriz');
  const hay = sel.tema || sel.ent;
  const citas = useApi(hay ? qs('/api/respuestas', { tema: sel.tema, entrevistado: sel.ent }) : null);
  const perfil = ents.data?.find((e) => e.entrevistado === sel.ent)?.perfil;

  return (
    <>
      <section className="sec" aria-labelledby="t-matriz">
        <h2 id="t-matriz">Quién dice qué</h2>
        <p className="note">Cada fila es un tema y cada columna una entrevista; la marca de color de la izquierda indica la categoría. Elegí una celda, un tema o un código de entrevista.</p>
        <div className="leyenda">
          <span>Respuestas sobre el tema:</span>
          {['1', '2', '3 o más'].map((t, i) => <span key={t}><span className="sw" style={{ background: pal.ord[i] }} />{t}</span>)}
        </div>
        <Estado estado={temas} alto="40rem" />
        {temas.data && ents.data && celdas.data && (
          <Matriz temas={temas.data.temas} categorias={temas.data.categorias} ents={ents.data} celdas={celdas.data} sel={sel} setSel={setSel} />
        )}
      </section>
      <section className="sec" aria-labelledby="t-citas" aria-live="polite">
        <h2 id="t-citas">Citas</h2>
        {!hay && <p className="note">Todavía no elegiste un tema ni una entrevista.</p>}
        {hay && (
          <>
            <div className="fila">
              <button type="button" className="limpiar" onClick={() => setSel({ tema: null, ent: null })}>
                Quitar {[sel.tema, sel.ent && `${sel.ent}${perfil ? ` (${perfil})` : ''}`].filter(Boolean).join(', ')} ✕
              </button>
            </div>
            <Estado estado={citas} />
            {citas.data && (
              <div className={`citas${citas.cargando ? ' refrescando' : ''}`}>
                <div className="resumen">{plural(citas.data.length, 'respuesta', 'respuestas')}</div>
                {citas.data.map((r) => <Cita key={r.id} r={r} />)}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
