/* app.js · Arranque: arma el marco, aplica estado y rol, y activa los componentes. Se carga al final. */
(function () {
  'use strict';
  const b = document.body;
  const slot = document.getElementById('marco-slot');
  if (slot && b.dataset.marco) {
    slot.outerHTML = GRU.marco(b.dataset.marco);
    b.classList.add('con-nav');
  } else if (slot) {
    slot.remove();
  }
  GRU.comportamientos.iniciar();
  GRU.estado.aplicar();
  GRU.maqueta.iniciar();
  GRU.tema.pintar();
  document.title = (b.dataset.pantalla || 'Pantalla').replace(/^[\d+ ·]+/, '') + ' · GRUBORJA (prototipo v2)';
  const ancla = GRU.estado.ancla && document.getElementById(GRU.estado.ancla);
  if (ancla) ancla.scrollIntoView();
})();
