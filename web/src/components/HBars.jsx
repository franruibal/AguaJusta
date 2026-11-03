import { useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { activable, barra, num, recortar, useAncho } from '../lib.js';
import { useTip } from './ui.jsx';

/** Barras horizontales con la etiqueta arriba de cada barra: se leen bien aun en pantallas angostas. */
export default function HBars({ filas, etiqueta, valor, color, tip, alElegir, nombre }) {
  const [ref, W] = useAncho(220);
  const caja = useRef(null);
  const { nodo, handlers } = useTip(caja);
  const filaH = 34, H = filas.length * filaH;
  const x = scaleLinear([0, max(filas, valor) || 1], [0, W - 40]);
  return (
    <div className="chart" ref={(n) => { ref.current = n; caja.current = n; }} style={{ minHeight: H }}>
      {W > 0 && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="list" aria-label={nombre}>
          <line x1={0.5} x2={0.5} y1={16} y2={H} stroke="var(--line)" />
          {filas.map((d, i) => {
            const w = Math.max(3, x(valor(d)));
            const props = alElegir ? activable(() => alElegir(d), tip(d).join('. ')) : {};
            return (
              <g key={etiqueta(d)} transform={`translate(0,${i * filaH})`} className={alElegir ? 'hit' : undefined}
                role={alElegir ? 'button' : 'listitem'} {...props} {...handlers(tip(d))}>
                <rect width={W} height={filaH} fill="transparent" />
                <rect className="foco" x={-2} y={1} width={W + 4} height={filaH - 2} rx={3} fill="none" />
                <text className="lbl" x={0} y={13}>{recortar(etiqueta(d), W)}</text>
                <path d={barra(1, 18, w, 10)} fill={color(d)} />
                <text className="val" x={w + 7} y={27}>{num(valor(d))}</text>
              </g>
            );
          })}
        </svg>
      )}
      {nodo}
    </div>
  );
}
