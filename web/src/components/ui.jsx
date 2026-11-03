import { useCallback, useState } from 'react';
import { fecha, monto } from '../lib.js';

const ESTADO_CLASE = { 'Anunciado': 'warn', 'En ejecución': 'warn', 'Inaugurado': 'ok', 'Vigente': 'ok', 'Realizado': 'ok', 'Sin dato': 'bad', 'Sin verificar': 'bad', 'Observado en campo': 'muted' };

export function Cita({ r, extra }) {
  const detalle = extra ?? [
    r.temas?.length ? `Temas: ${r.temas.join(', ')}.` : '',
    r.lugares?.length ? `Lugares: ${r.lugares.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
  return (
    <article className="cita">
      <div className="meta">
        <span><b>{r.entrevistado}</b> {r.perfil}</span>
        <span>Pregunta {r.pregunta}</span>
        <span>{r.origen}</span>
      </div>
      <p>{r.texto}</p>
      {detalle && <div className="extra">{detalle}</div>}
    </article>
  );
}

export function Hallazgo({ h }) {
  return (
    <article className="doc">
      <div className="doc-t">{h.titulo}<span className={`estado ${ESTADO_CLASE[h.estado] ?? 'muted'}`}>{h.estado}</span></div>
      <p>{h.descripcion}</p>
      <div className="meta">
        {[h.fuente, h.medio, fecha(h.fecha), monto(h.monto), h.lugar].filter(Boolean).map((b) => <span key={b}>{b}</span>)}
      </div>
    </article>
  );
}

/** Estado de carga o error de una fuente de datos. Devuelve null cuando hay datos. */
export function Estado({ estado, alto = '6rem' }) {
  if (estado.error) return <p className="error" role="alert">No se pudieron cargar estos datos. {estado.error}</p>;
  if (estado.data === undefined) return <div style={{ minHeight: alto }} aria-busy="true"><div className="skel" /></div>;
  return null;
}

/** Tooltip de los gráficos: el valor primero, después las etiquetas. Sirve con mouse y con foco. */
export function useTip(cajaRef) {
  const [tip, setTip] = useState(null);
  const mostrar = useCallback((ev, lineas) => {
    const caja = cajaRef.current;
    if (!caja) return;
    const b = caja.getBoundingClientRect();
    let x, y;
    if (ev.type === 'focus') { const r = ev.currentTarget.getBoundingClientRect(); x = r.right - b.left; y = r.top - b.top; }
    else { x = ev.clientX - b.left; y = ev.clientY - b.top; }
    setTip({ x: Math.min(x + 12, b.width - 200), y: y + 14, lineas: lineas.filter(Boolean) });
  }, [cajaRef]);
  const ocultar = useCallback(() => setTip(null), []);
  const nodo = tip && (
    <div className="tip" style={{ left: Math.max(0, tip.x), top: tip.y }}>
      {tip.lineas.map((l, i) => (i ? <span key={i}>{l}</span> : <b key={i}>{l}</b>))}
    </div>
  );
  const handlers = (lineas) => ({ onMouseMove: (e) => mostrar(e, lineas), onMouseLeave: ocultar, onFocus: (e) => mostrar(e, lineas), onBlur: ocultar });
  return { nodo, handlers };
}
