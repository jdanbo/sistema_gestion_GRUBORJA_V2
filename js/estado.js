/* estado.js · Capa de estado de la maqueta: qué ESTADO y qué ROL se están viendo.
   El estado viaja en la dirección (#estado=vacio&rol=equipo); el rol además se recuerda entre pantallas.
   Los bloques se muestran u ocultan con data-si-estado / data-si-rol. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const lista = (t) => (t ? t.split('|').map((x) => x.trim()).filter(Boolean) : []);
  const cuerpo = document.body;

  function leerHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return {};
    return h.includes('=') ? Object.fromEntries(new URLSearchParams(h)) : { ancla: h };
  }
  const estados = lista(cuerpo.dataset.estados).map((x) => { const [id, nombre] = x.split(':'); return { id, nombre: nombre || id }; });
  const roles = lista(cuerpo.dataset.roles);
  const pedido = leerHash();
  let rolGuardado = null;
  try { rolGuardado = sessionStorage.getItem('gru-rol'); } catch (e) { /* igual */ }

  const E = {
    estados, roles,
    estado: estados.some((e) => e.id === pedido.estado) ? pedido.estado : (estados[0] && estados[0].id),
    rol: roles.includes(pedido.rol) ? pedido.rol : (roles.includes(rolGuardado) ? rolGuardado : (roles[0] || rolGuardado || 'gerencia')),
    ancla: pedido.ancla,
    cambiar(cambio) {
      Object.assign(E, cambio);
      try { sessionStorage.setItem('gru-rol', E.rol); } catch (e) { /* igual */ }
      if (E.estados.length || E.roles.length > 1) {
        const p = new URLSearchParams();
        if (E.estado) p.set('estado', E.estado);
        if (E.roles.length > 1) p.set('rol', E.rol);
        history.replaceState(null, '', '#' + p.toString());
      }
      E.aplicar();
    },
    aplicar() {
      document.querySelectorAll('[data-si-estado], [data-si-rol]').forEach((el) => {
        const e = !el.dataset.siEstado || el.dataset.siEstado.split(' ').includes(E.estado);
        const r = !el.dataset.siRol || el.dataset.siRol.split(' ').includes(E.rol);
        el.hidden = !(e && r);
      });
      document.querySelectorAll('[data-invalido-si]').forEach((el) => {
        if (el.dataset.invalidoSi.split(' ').includes(E.estado)) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      });
      document.querySelectorAll('[data-apagado-si]').forEach((el) => { el.disabled = el.dataset.apagadoSi.split(' ').includes(E.estado); });
      const p = GRU.datos.personas[E.rol] || GRU.datos.personas.gerencia;
      const caja = document.getElementById('marco-cuenta');
      if (caja) {
        caja.setAttribute('aria-label', 'Mi cuenta: ' + p.nombre);
        caja.innerHTML = `<span class="marco__usuario"><span class="marco__nombre">${p.nombre}</span><span class="marco__cargo tenue">${p.puesto}</span></span><span class="marco__iniciales" aria-hidden="true">${p.iniciales}</span>`;
      }
      document.querySelectorAll('[data-persona]').forEach((el) => { el.textContent = p[el.dataset.persona] || ''; });
      document.querySelectorAll('[data-rol-nombre]').forEach((el) => { el.textContent = GRU.datos.nombreRol[E.rol] || ''; });
    },
  };
  GRU.estado = E;
})();
