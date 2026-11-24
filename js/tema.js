/* tema.js · Tema claro / marino. Sigue al sistema; el botón lo fuerza y se recuerda. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const I = () => GRU.iconos;
  function actual() {
    return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'marino' : 'claro');
  }
  function pintar() {
    const marino = actual() === 'marino';
    document.querySelectorAll('.tema-btn').forEach((b) => {
      b.innerHTML = marino ? I().sol : I().luna;
      b.setAttribute('aria-label', marino ? 'Cambiar a tema claro' : 'Cambiar a tema marino');
    });
  }
  function cambiar() {
    const nuevo = actual() === 'marino' ? 'claro' : 'marino';
    document.documentElement.dataset.theme = nuevo;
    try { localStorage.setItem('gru-tema', nuevo); } catch (e) { /* sin almacenamiento */ }
    pintar();
  }
  try { const g = localStorage.getItem('gru-tema'); if (g) document.documentElement.dataset.theme = g; } catch (e) { /* igual */ }
  /* modo: 'sistema' | 'claro' | 'marino' */
  function fijar(modo) {
    try { if (modo === 'sistema') localStorage.removeItem('gru-tema'); else localStorage.setItem('gru-tema', modo); } catch (e) { /* igual */ }
    if (modo === 'sistema') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = modo;
    pintar();
  }
  function modo() { try { return localStorage.getItem('gru-tema') || 'sistema'; } catch (e) { return 'sistema'; } }
  GRU.tema = { actual, pintar, cambiar, fijar, modo };
})();
