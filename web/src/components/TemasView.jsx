import HBars from './HBars.jsx';
import { Estado } from './ui.jsx';
import { num, plural, useApi, useTema } from '../lib.js';

export const colorCategoria = (categorias, pal) => (c) => pal.cat[Math.max(0, categorias.indexOf(c)) % pal.cat.length];

export default function TemasView({ elegirTema, elegirEnt }) {
  const { pal } = useTema();
  const temas = useApi('/api/temas');
  const cats = useApi('/api/categorias');
  const ents = useApi('/api/entrevistados');
  const color = temas.data ? colorCategoria(temas.data.categorias, pal) : () => pal.cat[0];

  return (
    <div className="grid">
      <section className="sec" aria-labelledby="t-temas">
        <h2 id="t-temas">De qué se habla</h2>
        <p className="note">Entrevistas en las que aparece cada uno de los 27 temas codificados. Elegí un tema para leer las citas.</p>
        <Estado estado={temas} alto="40rem" />
        {temas.data && (
          <>
            <div className="leyenda">
              {temas.data.categorias.map((c) => <span key={c}><span className="sw" style={{ background: color(c) }} />{c}</span>)}
            </div>
            <HBars nombre="Temas por cantidad de entrevistas" filas={temas.data.temas} etiqueta={(d) => d.tema} valor={(d) => d.entrevistas}
              color={(d) => color(d.categoria)} alElegir={(d) => elegirTema(d.tema)}
              tip={(d) => [plural(d.entrevistas, 'entrevista', 'entrevistas'), d.tema, d.categoria, `${plural(d.respuestas, 'respuesta', 'respuestas')}, ${plural(d.hallazgos, 'hallazgo documental', 'hallazgos documentales')}`]} />
            <details className="twin">
              <summary>Ver como tabla</summary>
              <div className="tabla-wrap">
                <table>
                  <thead><tr><th scope="col">Tema</th><th scope="col">Categoría</th><th scope="col" className="num">Entrevistas</th><th scope="col" className="num">Respuestas</th><th scope="col" className="num">Hallazgos</th></tr></thead>
                  <tbody>{temas.data.temas.map((t) => <tr key={t.tema}><td>{t.tema}</td><td>{t.categoria}</td><td className="num">{num(t.entrevistas)}</td><td className="num">{num(t.respuestas)}</td><td className="num">{num(t.hallazgos)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>

      <div className="stack">
        <section className="sec" aria-labelledby="t-cats">
          <h2 id="t-cats">Por categoría</h2>
          <p className="note">Entrevistas que tocan al menos un tema de cada categoría.</p>
          <Estado estado={cats} alto="12rem" />
          {cats.data && temas.data && (
            <HBars nombre="Entrevistas por categoría" filas={cats.data} etiqueta={(d) => d.categoria} valor={(d) => d.entrevistas}
              color={(d) => color(d.categoria)} tip={(d) => [plural(d.entrevistas, 'entrevista', 'entrevistas'), d.categoria]} />
          )}
        </section>

        <section className="sec" aria-labelledby="t-ents">
          <h2 id="t-ents">Quiénes hablaron</h2>
          <p className="note">Elegí una fila para ver todo lo que dijo esa persona o grupo.</p>
          <Estado estado={ents} />
          {ents.data && (
            <div className="tabla-wrap">
              <table>
                <thead><tr><th scope="col">Código</th><th scope="col">Perfil</th><th scope="col">Condición</th><th scope="col">Vive en</th><th scope="col" className="num">Salida</th></tr></thead>
                <tbody>
                  {ents.data.map((e) => (
                    <tr key={e.entrevistado} className="clic" tabIndex={0} onClick={() => elegirEnt(e.entrevistado)}
                      onKeyDown={(ev) => { if (ev.key === 'Enter') elegirEnt(e.entrevistado); }}>
                      <td>{e.entrevistado}</td><td>{e.perfil}</td><td>{e.condicion}</td><td>{e.localidad}</td><td className="num">{e.salida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sec metodo" aria-labelledby="t-metodo">
          <h2 id="t-metodo">Cómo leer estos datos</h2>
          <ul>
            <li>Los números cuentan <b>entrevistas que mencionan</b> algo, no cuánta gente piensa así. Son pocas entrevistas: muestran patrones, no permiten generalizar.</li>
            <li>En la Salida 1 las entrevistas fueron relatos libres y las respuestas se <b>reconstruyeron</b> asignando fragmentos a cada pregunta. En la Salida 2 se respondió al cuestionario.</li>
            <li>E4 trabaja para el municipio de Carlos Paz: su relato puede favorecer la gestión de esa jurisdicción.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
