import { useState } from 'react';
import { Cita, Estado, Hallazgo } from './ui.jsx';
import { plural, qs, useApi } from '../lib.js';

export default function PreguntasView() {
  const [preg, setPreg] = useState('P3');
  const [tema, setTema] = useState(null);
  const preguntas = useApi('/api/preguntas');
  const temas = useApi(qs('/api/temas-por-pregunta', { pregunta: preg }));
  const resp = useApi(qs('/api/respuestas', { pregunta: preg, tema }));
  const docs = useApi(qs('/api/hallazgos', { eje: preg }));
  const p = preguntas.data?.find((x) => x.pregunta === preg);
  const modulos = [...new Set((preguntas.data ?? []).map((x) => x.modulo))];

  return (
    <section className="sec" aria-labelledby="t-preg">
      <h2 id="t-preg">Respuestas por pregunta</h2>
      <p className="note">Elegí una pregunta del cuestionario. Los temas filtran las respuestas.</p>
      <Estado estado={preguntas} />
      {preguntas.data && (
        <>
          <div className="fila">
            <label className="visually-hidden" htmlFor="sel-preg">Pregunta del cuestionario</label>
            <select id="sel-preg" className="select" value={preg} onChange={(e) => { setPreg(e.target.value); setTema(null); }}>
              {modulos.map((m) => (
                <optgroup key={m} label={`Módulo ${m.toLowerCase()}`}>
                  {preguntas.data.filter((x) => x.modulo === m).map((x) => (
                    <option key={x.pregunta} value={x.pregunta}>{x.pregunta}: {x.texto.length > 70 ? `${x.texto.slice(0, 68).trimEnd()}…` : x.texto}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {p && <p className="pregunta-texto">{p.texto}</p>}
          {p && <div className="resumen">{plural(p.respuestas, 'respuesta', 'respuestas')}.{p.sin_respuesta.length ? ` Sin respuesta: ${p.sin_respuesta.join(', ')}.` : ''}</div>}
          {temas.data && (
            <div className="chips fila" role="group" aria-label="Filtrar por tema">
              {temas.data.map((t) => (
                <button key={t.tema} type="button" className="chip" aria-pressed={tema === t.tema} onClick={() => setTema(tema === t.tema ? null : t.tema)}>
                  {t.tema} ({t.respuestas})
                </button>
              ))}
            </div>
          )}
          <Estado estado={resp} />
          <div className={`citas${resp.cargando ? ' refrescando' : ''}`} aria-live="polite">
            {resp.data?.map((r) => <Cita key={r.id} r={r} />)}
            {!tema && docs.data?.map((h) => <Hallazgo key={h.id} h={h} />)}
            {resp.data && !resp.data.length && <p className="vacio">Nadie respondió esta pregunta.</p>}
          </div>
        </>
      )}
    </section>
  );
}
