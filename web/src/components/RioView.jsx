import MapaRio from './MapaRio.jsx';
import { Cita, Estado, Hallazgo } from './ui.jsx';
import { plural, qs, useApi, useTema } from '../lib.js';

const PRECISION = { centro_localidad: 'Centro de la localidad', zona_aproximada: 'Zona aproximada', sin_ubicar: 'Sin ubicar en el mapa' };

export default function RioView({ lugar, setLugar }) {
  const { pal } = useTema();
  const lugares = useApi('/api/lugares');
  const resp = useApi(lugar ? qs('/api/respuestas', { lugar }) : null);
  const docs = useApi(lugar ? qs('/api/hallazgos', { lugar }) : null);
  const elegido = lugares.data?.find((l) => l.lugar === lugar);

  return (
    <>
      <div className="grid-mapa">
        <section className="sec" aria-labelledby="t-mapa">
          <h2 id="t-mapa">Dónde se habla del río</h2>
          <p className="note">Mapa de OpenStreetMap con los lugares que aparecen en entrevistas y documentos. Las localidades van en su coordenada; los barrios y balnearios, como zona aproximada. Elegí un punto o un lugar de la lista.</p>
          <div className="leyenda">
            <span><span className="dot" style={{ background: pal.marca }} />Mencionado en entrevistas</span>
            <span><span className="dot ring" style={{ borderColor: pal.marca }} />Solo en documentos</span>
            <span><span className="zona" style={{ borderColor: pal.marca, background: `${pal.marca}22` }} />Zona aproximada</span>
            <span>Más grande, más menciones</span>
          </div>
          <Estado estado={lugares} alto="360px" />
          {lugares.data && <MapaRio lugares={lugares.data} elegido={lugar} alElegir={setLugar} />}
        </section>
        <section className="sec" aria-labelledby="t-lugares">
          <h2 id="t-lugares">Lugares mencionados</h2>
          <p className="note">Ordenados por cantidad de menciones.</p>
          {lugares.data && (
            <ul className="lugares">
              {lugares.data.map((l) => (
                <li key={l.id}>
                  <button type="button" className="lugar-btn" aria-pressed={l.lugar === lugar} onClick={() => setLugar(l.lugar === lugar ? null : l.lugar)}>
                    {l.ubicacion === 'sin_ubicar'
                      ? <span className="dot ring" style={{ borderColor: 'var(--muted)' }} aria-hidden="true" />
                      : <span className={`dot${l.entrevistas ? '' : ' ring'}`} style={{ background: pal.marca, borderColor: pal.marca }} aria-hidden="true" />}
                    <span>{l.lugar}<small>{PRECISION[l.ubicacion]}{l.localidad && l.localidad !== l.lugar ? `, ${l.localidad}` : ''}</small></span>
                    <span className="lugar-cifra">{plural(l.entrevistas, 'entrevista', 'entrevistas')}<br />{plural(l.hallazgos, 'hallazgo', 'hallazgos')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="sec" aria-labelledby="t-lugar" aria-live="polite">
        <h2 id="t-lugar">{lugar ? `Qué se dijo de ${lugar}` : 'Qué se dijo de cada lugar'}</h2>
        {!lugar && <p className="note">Todavía no elegiste ningún lugar.</p>}
        {lugar && (
          <>
            <div className="fila"><button type="button" className="limpiar" onClick={() => setLugar(null)}>Quitar {lugar} ✕</button></div>
            {elegido && <p className="note">{[elegido.referencia, elegido.nota].filter(Boolean).join(' ')}</p>}
            <Estado estado={resp} /><Estado estado={docs} />
            <div className={`citas${resp.cargando || docs.cargando ? ' refrescando' : ''}`}>
              {resp.data?.map((r) => <Cita key={r.id} r={r} />)}
              {docs.data?.map((h) => <Hallazgo key={h.id} h={h} />)}
              {resp.data && docs.data && !resp.data.length && !docs.data.length && <p className="vacio">No hay menciones codificadas para este lugar.</p>}
            </div>
          </>
        )}
      </section>
    </>
  );
}
