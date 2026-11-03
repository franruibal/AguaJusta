import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import { plural, useTema } from '../lib.js';

const TRAMO = [[-31.505, -64.585], [-31.405, -64.485]];
/* Dirección de la etiqueta para que no se pisen los lugares cercanos. */
const LADO = { 'Mayu Sumaj': 'left', 'Barrio El Dorado 2': 'left', 'Balneario público de Carlos Paz': 'left', 'Campamentos río arriba': 'left' };

function Zoom({ alCambiar }) {
  useMapEvents({ zoomend: (e) => alCambiar(e.target.getZoom()) });
  return null;
}

/** Mapa real (OpenStreetMap, teselas de CARTO) con los lugares mencionados en el relevamiento. */
export default function MapaRio({ lugares, elegido, alElegir }) {
  const { modo, pal } = useTema();
  const [mapa, setMapa] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [vista, setVista] = useState('tramo');
  const ubicados = useMemo(() => lugares.filter((l) => l.lat != null), [lugares]);
  const cuenca = useMemo(() => {
    if (!ubicados.length) return TRAMO;
    const lats = ubicados.map((l) => l.lat), lngs = ubicados.map((l) => l.lng);
    return [[Math.min(...lats) - 0.02, Math.min(...lngs) - 0.03], [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.03]];
  }, [ubicados]);

  const ir = (v) => { setVista(v); mapa?.flyToBounds(v === 'tramo' ? TRAMO : cuenca, { duration: 0.6 }); };

  useEffect(() => {
    const l = ubicados.find((x) => x.lugar === elegido);
    if (mapa && l) mapa.flyTo([l.lat, l.lng], Math.max(mapa.getZoom(), 13), { duration: 0.6 });
  }, [elegido, mapa, ubicados]);

  return (
    <div className={`mapa-wrap modo-${modo}`}>
      <div className="mapa-vistas" role="group" aria-label="Encuadre del mapa">
        <button type="button" aria-pressed={vista === 'tramo'} onClick={() => ir('tramo')}>Tramo San Antonio–Carlos Paz</button>
        <button type="button" aria-pressed={vista === 'cuenca'} onClick={() => ir('cuenca')}>Toda la cuenca</button>
      </div>
      <MapContainer ref={setMapa} bounds={TRAMO} className="mapa" scrollWheelZoom={false}
        aria-label="Mapa de la zona del río San Antonio con los lugares mencionados. La lista de lugares de al lado tiene la misma información.">
        <Zoom alCambiar={setZoom} />
        <TileLayer key={modo} url={pal.tiles} subdomains="abcd" maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' />
        {ubicados.filter((l) => l.ubicacion === 'zona_aproximada').map((l) => (
          <Circle key={`z-${l.id}`} center={[l.lat, l.lng]} radius={l.radio_m} interactive={false}
            pathOptions={{ color: pal.marca, weight: 1.5, opacity: 0.7, fillColor: pal.marca, fillOpacity: 0.05 }} />
        ))}
        {ubicados.map((l) => {
          const r = 6 + 2.4 * Math.sqrt(l.entrevistas + l.hallazgos);
          const lleno = l.entrevistas > 0;
          const on = l.lugar === elegido;
          const etiquetaFija = l.ubicacion === 'centro_localidad' || zoom >= 13 || on;
          return (
            <CircleMarker key={`${l.id}-${modo}-${on}-${etiquetaFija}`} center={[l.lat, l.lng]} radius={r}
              pathOptions={{ color: on ? pal.tinta : (lleno ? pal.superficie : pal.marca), weight: on ? 3 : (lleno ? 2 : 2.5), fillColor: lleno ? pal.marca : pal.superficie, fillOpacity: 1 }}
              eventHandlers={{ click: () => alElegir(on ? null : l.lugar) }}>
              {etiquetaFija
                ? <Tooltip permanent direction={LADO[l.lugar] ?? 'right'} offset={[(LADO[l.lugar] ? -1 : 1) * (r + 2), 0]} className="aj-etiqueta">{l.lugar}</Tooltip>
                : <Tooltip direction="top" offset={[0, -r]} className="aj-tip">{l.lugar}</Tooltip>}
            </CircleMarker>
          );
        })}
      </MapContainer>
      <span className="visually-hidden">{plural(ubicados.length, 'lugar ubicado', 'lugares ubicados')} en el mapa.</span>
    </div>
  );
}
