import { useEffect, useState } from 'react';
import { Estado } from './ui.jsx';
import { plural, qs, useApi } from '../lib.js';

export default function PendientesView() {
  const [texto, setTexto] = useState('');
  const [buscar, setBuscar] = useState('');
  useEffect(() => { const t = setTimeout(() => setBuscar(texto.trim()), 250); return () => clearTimeout(t); }, [texto]);
  const pend = useApi(qs('/api/pendientes', { buscar }));
  return (
    <section className="sec" aria-labelledby="t-pend">
      <h2 id="t-pend">Qué falta averiguar</h2>
      <p className="note">Información a conseguir o verificar, ordenada por eje: la hoja de ruta para la próxima salida.</p>
      <label className="visually-hidden" htmlFor="buscar-pend">Buscar en lo pendiente</label>
      <input id="buscar-pend" className="buscar" type="search" placeholder="Buscar en lo pendiente" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <Estado estado={pend} />
      {pend.data && (
        <>
          <div className="resumen" aria-live="polite">{plural(pend.data.length, 'dato pendiente', 'datos pendientes')}</div>
          <div className={`tabla-wrap${pend.cargando ? ' refrescando' : ''}`}>
            <table>
              <thead><tr><th scope="col">Eje</th><th scope="col">Hallazgo</th><th scope="col">Qué falta</th></tr></thead>
              <tbody>{pend.data.map((r) => <tr key={r.id}><td>{r.eje}</td><td>{r.hallazgo}</td><td>{r.pendiente}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
