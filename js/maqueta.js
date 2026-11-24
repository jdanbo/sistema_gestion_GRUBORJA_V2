/* maqueta.js · Barra de revisión (Estado / Rol). Herramienta de la maqueta: NO es parte del diseño. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  GRU.maqueta = {
    dibujar() {
      const barra = document.getElementById('maq-barra');
      if (!barra) return;
      const E = GRU.estado;
      const grupo = (titulo, tipo, ops, activo) => ops.length < 2 ? '' :
        `<div class="maq-barra__grupo"><span>${titulo}</span>${ops.map((o) => `<button type="button" data-${tipo}="${o.id}" aria-pressed="${o.id === activo}">${o.nombre}</button>`).join('')}</div>`;
      const roles = E.roles.map((r) => ({ id: r, nombre: GRU.datos.nombreRol[r] }));
      const raiz = barra.dataset.raiz || '../';
      barra.innerHTML = `<span class="maq-barra__marca">PROTOTIPO V2</span><a href="${raiz}index.html">Índice</a><a href="${raiz}design-system.html">Design system</a><strong>${document.body.dataset.pantalla || ''}</strong>` +
        grupo('Estado:', 'estado', E.estados, E.estado) + grupo('Rol:', 'rol', roles, E.rol) +
        (GRU.db ? '<div class="maq-barra__grupo"><span>Datos:</span><button type="button" data-datos="restablecer">Restablecer ejemplo</button><button type="button" data-datos="vaciar">Vaciar</button></div>' : '');
    },
    iniciar() {
      this.dibujar();
      document.addEventListener('click', (e) => {
        const b = e.target.closest('#maq-barra button');
        if (!b) return;
        if (b.dataset.datos) { try { sessionStorage.removeItem('gru-persona'); } catch (e) { /* igual */ } GRU.db[b.dataset.datos](); location.reload(); return; }
        if (b.dataset.estado) GRU.estado.cambiar({ estado: b.dataset.estado });
        if (b.dataset.rol) { GRU.estado.cambiar({ rol: b.dataset.rol }); if (document.body.dataset.vista) { location.reload(); return; } }
        this.dibujar();
      });
    },
  };
})();
