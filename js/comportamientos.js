/* comportamientos.js · Comportamiento de los componentes (sin lógica de negocio).
   Cada función "mejora" el HTML que ya está en la página; si el JS falla, el HTML sigue siendo usable. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};

  /* Contraseña con botón "Mostrar" (componente .campo__clave) */
  function clave() {
    document.querySelectorAll('input[type="password"]').forEach((input, i) => {
      if (input.closest('.campo__clave')) return;
      const caja = document.createElement('div');
      caja.className = 'campo__clave';
      input.parentNode.insertBefore(caja, input);
      caja.appendChild(input);
      if (!input.id) input.id = 'clave-' + i;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'campo__mostrar'; b.textContent = 'Mostrar';
      b.setAttribute('aria-controls', input.id); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const ver = input.type === 'password';
        input.type = ver ? 'text' : 'password';
        b.textContent = ver ? 'Ocultar' : 'Mostrar';
        b.setAttribute('aria-pressed', String(ver));
      });
      caja.appendChild(b);
    });
  }

  /* Pestañas del proyecto -> selector desplegable en celular (se genera desde el mismo <nav class="tabs">) */
  function secciones() {
    document.querySelectorAll('nav.tabs').forEach((nav, i) => {
      if (nav.nextElementSibling && nav.nextElementSibling.classList.contains('tabs-select')) return;
      const links = [...nav.querySelectorAll('a.tab')];
      const caja = document.createElement('div');
      caja.className = 'tabs-select';
      const id = 'secciones-' + i;
      caja.innerHTML = `<div class="campo"><label class="campo__etiqueta" for="${id}">Sección del proyecto</label>
        <select class="campo__entrada" id="${id}">${links.map((a) => {
          const nombre = a.childNodes[0].textContent.trim();
          const cuenta = a.querySelector('.tab__cuenta');
          return `<option value="${a.getAttribute('href')}"${a.getAttribute('aria-current') === 'page' ? ' selected' : ''}>${nombre.charAt(0) + nombre.slice(1).toLowerCase()}${cuenta ? ' (' + cuenta.textContent.trim() + ' por atender)' : ''}</option>`;
        }).join('')}</select></div>`;
      caja.querySelector('select').addEventListener('change', (e) => { location.href = e.target.value; });
      nav.after(caja);
    });
  }

  /* Zonas que se desplazan a los lados: degradado mientras haya más contenido a la derecha */
  function desplazables() {
    const marcar = () => document.querySelectorAll('.versiones, .gantt, .tabla-caja').forEach((el) => {
      const hay = el.scrollWidth > el.clientWidth + 2;
      el.classList.toggle('desplazable', hay);
      el.classList.toggle('desplazable--fin', hay && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
      if (!el.dataset.desp) { el.dataset.desp = '1'; el.addEventListener('scroll', marcar, { passive: true }); }
    });
    marcar();
    addEventListener('resize', marcar);
    new MutationObserver(marcar).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }

  function iconos() {
    const I = GRU.iconos;
    document.querySelectorAll('[data-icono]').forEach((el) => { if (!el.firstChild) el.innerHTML = I[el.dataset.icono] || ''; });
    document.querySelectorAll('[data-nav]').forEach((el) => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', I[el.dataset.nav] || ''); });
  }

  /* Proyecto en curso: viaja en la dirección (?p=CODIGO) y se recuerda para las pantallas que aún no lo reciben. */
  function proyectoActual() {
    const p = new URLSearchParams(location.search).get('p');
    try { if (p) sessionStorage.setItem('gru-proyecto', p); else return sessionStorage.getItem('gru-proyecto') || 'DEMOPX'; } catch (e) { /* igual */ }
    return p || 'DEMOPX';
  }
  function propagar() {
    const cod = proyectoActual();
    document.querySelectorAll('a[href]').forEach((a) => {
      const h = a.getAttribute('href');
      if (!/^(08|10|11|12|13|14|15|16|17|19|20|25|27)-[\w-]+\.html(#.*)?$/.test(h)) return;
      a.setAttribute('href', h.replace('.html', '.html?p=' + encodeURIComponent(cod)));
    });
  }

  GRU.proyectoActual = proyectoActual;
  GRU.comportamientos = {
    iconos, secciones, desplazables, propagar,
    iniciar() {
      propagar(); iconos(); clave(); secciones(); desplazables();
      document.addEventListener('click', (e) => { if (e.target.closest('.tema-btn')) GRU.tema.cambiar(); });
      document.addEventListener('submit', (e) => e.preventDefault());   /* la maqueta no envía ni guarda nada */
    },
  };
})();
