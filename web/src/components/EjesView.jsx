import { Cita, Estado, Hallazgo } from './ui.jsx';
import { plural, useApi } from '../lib.js';

export default function EjesView() {
  const ejes = useApi('/api/ejes');
  return (
    <section className="sec" aria-labelledby="t-ejes">
      <h2 id="t-ejes">Lo que dicen las entrevistas y lo que dicen los documentos</h2>
      <p className="note">Para cada eje del módulo municipal: los hallazgos del relevamiento documental con su estado, y las respuestas de las entrevistas sobre los mismos temas. El cruce entre ejes y temas es un criterio propuesto y se puede ajustar en la tabla eje_tema.</p>
      <Estado estado={ejes} alto="20rem" />
      {ejes.data?.map((e) => (
        <article key={e.eje} className="bloque" style={{ marginTop: 24 }}>
          <div className="bloque-head"><span className="codigo">{e.eje}</span><h3>{e.texto}</h3></div>
          {e.temas.length > 0 && <p className="extra">Temas cruzados: {e.temas.join(', ')}.</p>}
          <div className="cols">
            <div>
              <p className="coltit">En los documentos: {plural(e.hallazgos.length, 'hallazgo', 'hallazgos')}</p>
              <div className="citas">
                {e.hallazgos.length ? e.hallazgos.map((h) => <Hallazgo key={h.id} h={h} />) : <p className="vacio">Sin hallazgos documentales para este eje.</p>}
              </div>
            </div>
            <div>
              <p className="coltit">En las entrevistas: {plural(e.voces.length, 'respuesta', 'respuestas')}</p>
              <div className="citas">{e.voces.slice(0, 3).map((v) => <Cita key={v.id} r={v} extra={`${v.via}.`} />)}</div>
              {e.voces.length > 3 && (
                <details>
                  <summary>Ver {plural(e.voces.length - 3, 'respuesta más', 'respuestas más')}</summary>
                  <div className="citas">{e.voces.slice(3).map((v) => <Cita key={v.id} r={v} extra={`${v.via}.`} />)}</div>
                </details>
              )}
              {!e.voces.length && <p className="vacio">Ninguna entrevista toca este eje.</p>}
            </div>
          </div>
          {e.pendientes.length > 0 && (
            <div className="caja"><b>Falta averiguar</b><ul>{e.pendientes.map((p) => <li key={p.id}>{p.pendiente}</li>)}</ul></div>
          )}
        </article>
      ))}
    </section>
  );
}
