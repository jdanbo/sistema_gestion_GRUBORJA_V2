/* aviso.js · Aviso breve (toast). GRU.aviso('texto', 'ok' | 'error'). */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  GRU.aviso = function (texto, tipo) {
    let caja = document.querySelector('.toasts');
    if (!caja) { caja = document.createElement('div'); caja.className = 'toasts'; caja.setAttribute('role', 'status'); document.body.appendChild(caja); }
    const t = document.createElement('div');
    t.className = 'toast' + (tipo ? ' toast--' + tipo : '');
    t.textContent = texto;
    caja.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  };
})();
