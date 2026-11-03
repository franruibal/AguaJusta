import { useEffect, useRef, useState } from 'react';
import RioView from './components/RioView.jsx';
import TemasView from './components/TemasView.jsx';
import MatrizView from './components/MatrizView.jsx';
import TensionesView from './components/TensionesView.jsx';
import PreguntasView from './components/PreguntasView.jsx';
import EjesView from './components/EjesView.jsx';
import PendientesView from './components/PendientesView.jsx';
import { num, setTema, useApi, useTema } from './lib.js';

const PESTANAS = [
  ['rio', 'El río'], ['temas', 'Temas'], ['voces', 'Quién dice qué'], ['tensiones', 'Tensiones'],
  ['preguntas', 'Por pregunta'], ['ejes', 'Dicho y documentado'], ['pendientes', 'Qué falta'],
];
const desdeHash = () => { const h = window.location.hash.slice(1); return PESTANAS.some(([id]) => id === h) ? h : 'rio'; };

function Cifra({ valor, etiqueta }) {
  return <div><dd>{valor == null ? '—' : num(valor)}</dd><dt>{etiqueta}</dt></div>;
}

export default function App() {
  const [tab, setTab] = useState(desdeHash);
  const [sel, setSel] = useState({ tema: null, ent: null });
  const [lugar, setLugar] = useState(null);
  const { elegido } = useTema();
  const resumen = useApi('/api/resumen');
  const temas = useApi('/api/temas');
  const tabsRef = useRef(null);
  const top = temas.data?.temas[0];
  const r = resumen.data;

  useEffect(() => {
    const f = () => setTab(desdeHash());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const ir = (id, foco) => {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
    if (foco) tabsRef.current?.querySelector(`#tab-${id}`)?.focus();
  };
  const teclas = (e) => {
    const i = PESTANAS.findIndex(([id]) => id === tab);
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: PESTANAS.length - 1 }[e.key];
    if (j == null) return;
    e.preventDefault();
    ir(PESTANAS[(j + PESTANAS.length) % PESTANAS.length][0], true);
  };

  return (
    <div className="app">
      <a className="skip" href="#contenido">Ir al contenido</a>
      <header className="head">
        <div>
          <h1>Aguas Justas</h1>
          <p className="sub">Relevamiento del río San Antonio entre San Antonio de Arredondo y Villa Carlos Paz</p>
          <p className="lede">
            Lo que dicen vecinos, trabajadores y documentos sobre el estado del río.
            {top && r && <> El tema que más se repite es <b>{top.tema}</b>: aparece en <b>{num(top.entrevistas)}</b> de las <b>{num(r.entrevistas)}</b> entrevistas.</>}
          </p>
        </div>
        <div className="tema-sel" role="group" aria-label="Tema de color">
          {[['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={elegido === v} onClick={() => setTema(v)}>{t}</button>
          ))}
        </div>
      </header>

      <dl className="figs" aria-label="Resumen del relevamiento">
        <Cifra valor={r?.entrevistas} etiqueta="Entrevistas" />
        <Cifra valor={r?.personas} etiqueta="Personas escuchadas" />
        <Cifra valor={r?.respuestas} etiqueta="Respuestas codificadas" />
        <Cifra valor={r?.hallazgos} etiqueta="Hallazgos documentales y de campo" />
        <Cifra valor={r?.pendientes} etiqueta="Datos por averiguar" />
      </dl>
      {resumen.error && <p className="error" role="alert">No se pudo conectar con la API. Probá recargar la página en un momento.</p>}

      <nav className="tabs" role="tablist" aria-label="Secciones del tablero" ref={tabsRef} onKeyDown={teclas}>
        {PESTANAS.map(([id, t]) => (
          <button key={id} id={`tab-${id}`} type="button" role="tab" className="tab" aria-selected={tab === id} aria-controls="contenido"
            tabIndex={tab === id ? 0 : -1} onClick={() => ir(id)}>{t}</button>
        ))}
      </nav>

      <main id="contenido" className="panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'rio' && <RioView lugar={lugar} setLugar={setLugar} />}
        {tab === 'temas' && <TemasView elegirTema={(t) => { setSel({ tema: t, ent: null }); ir('voces'); }} elegirEnt={(e) => { setSel({ tema: null, ent: e }); ir('voces'); }} />}
        {tab === 'voces' && <MatrizView sel={sel} setSel={setSel} />}
        {tab === 'tensiones' && <TensionesView />}
        {tab === 'preguntas' && <PreguntasView />}
        {tab === 'ejes' && <EjesView />}
        {tab === 'pendientes' && <PendientesView />}
      </main>

      <footer className="pie">
        Fuente: base Aguas Justas (salidas de campo 1, 2 y 3 del Grupo 1). La ubicación de los lugares, el cruce entre ejes y temas y las tensiones son lecturas propuestas que se pueden corregir en la base. Mapa: © OpenStreetMap y CARTO.
      </footer>
    </div>
  );
}
