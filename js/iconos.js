/* iconos.js · Capa de íconos (SVG de línea, 24×24). Se pintan en [data-icono] y [data-nav]. */
(function () {
  'use strict';
const svg = (t) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t}</svg>`;
const ICONOS = {
  flecha: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  atras: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  luna: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  candado: svg('<rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  ok: svg('<path d="M5 12l5 5 9-10"/>'),
  punto: svg('<circle cx="12" cy="12" r="3"/>'),
  hoy: svg('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  proyectos: svg('<path d="M3 6h7l2 2h9v11H3z"/>'),
  pendientes: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  mas: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  usuarios: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 6.5M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  catalogos: svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 10h16M10 4v16"/>'),
  historial: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  cuenta: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  enlace: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  copiar: svg('<rect x="9" y="9" width="11" height="11"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>'),
  cruz: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  correo: svg('<rect x="3" y="5" width="18" height="14"/><path d="M3 7l9 6 9-6"/>'),
};
  window.GRU = window.GRU || {};
  GRU.iconos = ICONOS;
})();
