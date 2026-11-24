/* ds.js · Pinta en la página del design system los valores REALES de los tokens (siempre al día con el CSS). */
(function () {
  'use strict';
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + rgb(c).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  const COLORES = [
    ['Superficies y texto', [['--surface', 'Tarjetas y campos'], ['--surface-soft', 'Fondo de página'], ['--ink', 'Títulos'], ['--text', 'Párrafos'], ['--text-muted', 'Metadatos'], ['--line', 'Marco decorativo'], ['--line-campo', 'Borde de campos (3:1)']]],
    ['Acento y acciones', [['--accent', 'Texto y bordes de acento'], ['--btn-bg', 'Botón principal'], ['--btn-fg', 'Texto del botón principal'], ['--focus', 'Anillo de foco'], ['--tag-bg', 'Fondo de etiqueta'], ['--tag-fg', 'Texto de etiqueta']]],
    ['Estados (siempre con texto, nunca solo color)', [['--ok', 'Correcto, vigente'], ['--alerta', 'Por vencer, atención'], ['--grave', 'Atrasado, error, anulado'], ['--frio', 'En curso, avance real'], ['--ok-bg', 'Fondo ok'], ['--alerta-bg', 'Fondo alerta'], ['--grave-bg', 'Fondo grave'], ['--frio-bg', 'Fondo en curso']]],
  ];
  function colores() {
    const raiz = document.getElementById('ds-colores'); if (!raiz) return;
    raiz.innerHTML = COLORES.map(([t, l]) => `<h3>${t}</h3><div class="ds__rejilla">${l.map(([v, n]) =>
      `<div class="ds__color"><i style="background:var(${v})"></i><div><code>${v}</code><small>${n}</small><small>${hex(css(v))}</small></div></div>`).join('')}</div>`).join('');
  }
  function contrastes() {
    const raiz = document.getElementById('ds-contrastes'); if (!raiz) return;
    const pares = [['--text', '--surface', 'Párrafo sobre tarjeta', 4.5], ['--text-muted', '--surface', 'Metadato sobre tarjeta', 4.5], ['--text-muted', '--surface-soft', 'Metadato sobre fondo de página', 4.5],
      ['--accent', '--surface', 'Enlace y acento sobre tarjeta', 4.5], ['--btn-fg', '--btn-bg', 'Texto del botón principal', 4.5], ['--ok', '--ok-bg', 'Chip correcto', 4.5],
      ['--alerta', '--alerta-bg', 'Chip alerta', 4.5], ['--grave', '--grave-bg', 'Chip grave', 4.5], ['--frio', '--frio-bg', 'Chip en curso', 4.5], ['--on-estado', '--grave', 'Texto sobre aviso sólido grave', 4.5],
      ['--on-estado', '--ok', 'Texto sobre aviso sólido ok', 4.5], ['--line-campo', '--surface', 'Borde de campo (control)', 3]];
    raiz.innerHTML = pares.map(([a, b, n, min]) => { const r = ratio(css(a), css(b)); const ok = r >= min;
      return `<div class="ds__par"><span>${n} <code>${a}</code> / <code>${b}</code></span><b>${r.toFixed(2)}:1</b><span class="chip ${ok ? 'chip--ok' : 'chip--grave'}">${ok ? 'CUMPLE ' + min : 'NO CUMPLE ' + min}</span></div>`; }).join('');
  }
  function espaciado() {
    const raiz = document.getElementById('ds-espacio'); if (!raiz) return;
    raiz.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<div class="ds__espacio"><code>--space-${i}</code><i style="width:var(--space-${i})"></i><span>${css('--space-' + i)}</span></div>`).join('');
  }
  function repintar() { colores(); contrastes(); espaciado(); }
  repintar();
  new MutationObserver(repintar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repintar);
})();
