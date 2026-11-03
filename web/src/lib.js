import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/* ---------- Paletas validadas con el script del skill de dataviz ----------
   Cada modo tiene sus propios tonos (no es una inversión automática),
   comprobados contra la superficie donde se dibujan: #ffffff y #15232a. */
export const PALETAS = {
  light: {
    cat: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'],
    ord: ['#86b6ef', '#2a78d6', '#104281'],
    agua: '#2a78d6', aguaSuave: '#b7d3f6', marca: '#eb6834',
    polo: ['#2a78d6', '#e34948'], base: '#c3c2b7', vacio: '#e7ebea', tinta: '#14212b', superficie: '#ffffff',
    tiles: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
  dark: {
    cat: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300'],
    ord: ['#1c5cab', '#3987e5', '#9ec5f4'],
    agua: '#3987e5', aguaSuave: '#184f95', marca: '#d95926',
    polo: ['#3987e5', '#e66767'], base: '#3a4a51', vacio: '#22323a', tinta: '#e8eef0', superficie: '#15232a',
    tiles: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  },
};

/* ---------- Tema: sistema, claro u oscuro ---------- */
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let elegido = (() => { try { return localStorage.getItem('aj-tema') || 'system'; } catch { return 'system'; } })();
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
mq?.addEventListener('change', avisar);
const resolver = () => (elegido === 'system' ? (mq?.matches ? 'dark' : 'light') : elegido);

export function setTema(t) {
  elegido = t;
  try { t === 'system' ? localStorage.removeItem('aj-tema') : localStorage.setItem('aj-tema', t); } catch { /* sin almacenamiento */ }
  if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  avisar();
}
export function useTema() {
  const modo = useSyncExternalStore((f) => { oyentes.add(f); return () => oyentes.delete(f); }, resolver);
  return { elegido, modo, pal: PALETAS[modo] };
}

/* ---------- Datos de la API, con caché y sin parpadeo al refrescar ---------- */
const cache = new Map();
export function useApi(path) {
  const [estado, setEstado] = useState(() => ({ data: path ? cache.get(path) : undefined, error: null, cargando: !!path && !cache.has(path) }));
  useEffect(() => {
    if (!path) return undefined;
    if (cache.has(path)) { setEstado({ data: cache.get(path), error: null, cargando: false }); return undefined; }
    const ctl = new AbortController();
    setEstado((s) => ({ ...s, cargando: true, error: null }));
    fetch(path, { signal: ctl.signal })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || `Error ${r.status}`); return j; })
      .then((data) => { cache.set(path, data); setEstado({ data, error: null, cargando: false }); })
      .catch((e) => { if (e.name !== 'AbortError') setEstado((s) => ({ ...s, error: e.message, cargando: false })); });
    return () => ctl.abort();
  }, [path]);
  return estado;
}
export const qs = (base, params) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') u.set(k, v); });
  const s = u.toString();
  return s ? `${base}?${s}` : base;
};

/* ---------- Ancho de un elemento ---------- */
export function useAncho(min = 0) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, Math.max(min, w)];
}

/* ---------- Texto y números ---------- */
const nfmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
export const num = (n) => nfmt.format(n);
export const plural = (n, uno, varios) => `${num(n)} ${Number(n) === 1 ? uno : varios}`;
export const monto = (v) => (v == null ? '' : `$${num(Number(v) / 1e6)} millones`);
export const fecha = (s) => (s ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(s)) : '');

let lienzo;
const FUENTE = '13px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
/** Mide el ancho de un texto con la fuente de los gráficos. */
export function medir(texto, font = FUENTE) {
  lienzo ??= document.createElement('canvas').getContext('2d');
  lienzo.font = font;
  return lienzo.measureText(texto).width;
}
/** Recorta un texto con "…" para que entre en un ancho. */
export function recortar(texto, max) {
  if (medir(texto) <= max) return texto;
  let s = texto;
  while (s.length > 1 && medir(`${s}…`) > max) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

/** Barra con el extremo de datos redondeado (4px) y la base recta. dir 1 = hacia la derecha. */
export function barra(x, y, w, h, dir = 1) {
  const r = Math.min(4, w / 2, h / 2);
  if (dir > 0) return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - r)}Z`;
  return `M${x},${y}h${-(w - r)}a${r},${r} 0 0 0 ${-r},${r}v${h - 2 * r}a${r},${r} 0 0 0 ${r},${r}h${w - r}Z`;
}

/** Props para que un elemento SVG o HTML se active con clic, Enter o espacio. */
export const activable = (fn, etiqueta, presionado) => ({
  role: 'button', tabIndex: 0, 'aria-label': etiqueta,
  ...(presionado != null ? { 'aria-pressed': presionado } : {}),
  onClick: fn,
  onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } },
});
