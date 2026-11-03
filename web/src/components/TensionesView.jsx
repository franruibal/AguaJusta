import { useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { Cita, Estado, Hallazgo, useTip } from './ui.jsx';
import { barra, plural, useAncho, useApi, useTema } from '../lib.js';

function Divergente({ t, total }) {
  const { pal } = useTema();
  const [ref, W] = useAncho(240);
  const caja = useRef(null);
  const { nodo, handlers } = useTip(caja);
  const [a, b] = t.polos;
  const H = 26, cx = W / 2;
  const s = scaleLinear([0, Math.max(1, total)], [0, cx - 6]);
  return (
    <div className="chart" ref={(el) => { ref.current = el; caja.current = el; }} style={{ minHeight: H, margin: '4px 0' }}>
      {W > 0 && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`${a.texto}: ${plural(a.entrevistas, 'entrevista', 'entrevistas')}. ${b.texto}: ${plural(b.entrevistas, 'entrevista', 'entrevistas')}. Sobre ${total}.`}>
          <rect x={0} y={9} width={W} height={8} rx={4} fill={pal.vacio} />
          <path d={barra(cx - 1, 6, Math.max(3, s(a.entrevistas)), 14, -1)} fill={pal.polo[0]} {...handlers([plural(a.entrevistas, 'entrevista', 'entrevistas'), a.texto, a.quienes.join(', ')])} />
          <path d={barra(cx + 1, 6, Math.max(3, s(b.entrevistas)), 14, 1)} fill={pal.polo[1]} {...handlers([plural(b.entrevistas, 'entrevista', 'entrevistas'), b.texto, b.quienes.join(', ')])} />
          <line x1={cx} x2={cx} y1={0} y2={H} stroke={pal.base} />
        </svg>
      )}
      {nodo}
    </div>
  );
}

function Columna({ polo, color }) {
  const [primeras, resto] = [polo.citas.slice(0, 2), polo.citas.slice(2)];
  return (
    <div>
      <p className="coltit"><span className="sw" style={{ background: color }} />{polo.texto}</p>
      <div className="citas">{primeras.map((r) => <Cita key={r.id} r={r} extra="" />)}</div>
      {resto.length > 0 && (
        <details>
          <summary>Ver {plural(resto.length, 'cita más', 'citas más')}</summary>
          <div className="citas">{resto.map((r) => <Cita key={r.id} r={r} extra="" />)}</div>
        </details>
      )}
    </div>
  );
}

export default function TensionesView() {
  const { pal } = useTema();
  const datos = useApi('/api/tensiones');
  const ents = useApi('/api/entrevistados');
  const perfil = new Map((ents.data ?? []).map((e) => [e.entrevistado, e.perfil]));
  return (
    <section className="sec" aria-labelledby="t-ten">
      <h2 id="t-ten">Dónde no hay acuerdo</h2>
      <p className="note">Preguntas en las que las entrevistas se contradicen. La barra muestra cuántas entrevistas sostienen cada postura sobre el total; una misma entrevista puede aparecer en los dos lados. Las tensiones y la asignación de cada cita a una postura son una lectura propuesta para discutir en el grupo.</p>
      <Estado estado={datos} alto="20rem" />
      {datos.data?.tensiones.map((t) => {
        const ambas = new Set(t.en_ambas);
        return (
          <article key={t.codigo} className="bloque" id={`tension-${t.codigo}`} style={{ marginTop: 24 }}>
            <h3>{t.titulo}</h3>
            <div className="polos">
              {t.polos.map((p, i) => (
                <div key={p.polo} className={`polo ${i ? 'b' : 'a'}`}>
                  <span className="sw" style={{ background: pal.polo[i] }} /><span>{p.texto}</span><b>{plural(p.entrevistas, 'entrevista', 'entrevistas')}</b>
                </div>
              ))}
            </div>
            <Divergente t={t} total={datos.data.total_entrevistas} />
            <div className="quienes">
              {t.polos.map((p) => (
                <div key={p.polo} className="chips">
                  {p.quienes.map((e) => <span key={e} className={`chip${ambas.has(e) ? ' fuerte' : ''}`} title={perfil.get(e)}>{e}</span>)}
                </div>
              ))}
            </div>
            {t.en_ambas.length > 0 && <p className="extra">En los dos lados: {t.en_ambas.map((e) => `${e} (${perfil.get(e) ?? ''})`).join(', ')}.</p>}
            <div className="cols">{t.polos.map((p, i) => <Columna key={p.polo} polo={p} color={pal.polo[i]} />)}</div>
            {t.documentos.length > 0 && (
              <div className="caja">
                <b>Qué muestran los documentos</b>
                <div className="citas" style={{ marginTop: 8 }}>{t.documentos.map((h) => <Hallazgo key={h.id} h={h} />)}</div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
