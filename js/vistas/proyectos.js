/* vistas/proyectos.js · Pantallas 6 (lista), 7 (nuevo) , alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fecha = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1] + ' ' + y; };

  /* ---------- 6 · Lista ---------- */
  function lista() {
    const ul = document.querySelector('.proyecto-lista');
    const vacio = document.getElementById('lista-vacia');
    const buscar = document.querySelector('input[type=search]');
    const pills = [...document.querySelectorAll('.pills .pill')];
    let filtro = 'activo';
    const tarjeta = (p) => {
      const tieneHitos = p.hitos > 0;
      const barras = tieneHitos
        ? `<div class="doble proyecto-card__barras">
          <div class="doble__linea"><span class="tenue">Programado</span><div class="avance"><span class="avance__barra" style="width:${p.prog}%"></span></div><span class="doble__num">${p.prog}%</span></div>
          <div class="doble__linea"><span class="tenue">Avance real</span><div class="avance"><span class="avance__barra avance__barra--real" style="width:${p.real}%"></span></div><span class="doble__num">${p.real}%</span></div>
        </div>`
        : `<p class="tenue pequeno proyecto-card__barras" style="margin-bottom:0">Aún sin hitos. Creado el ${fecha(p.creado)}.</p>`;
      const chip = p.estado === 'terminado' ? '<span class="chip chip--acento">TERMINADO</span>'
        : !tieneHitos ? '<span class="chip">NUEVO</span>'
        : p.atrasados ? `<span class="chip chip--grave">${p.atrasados} ATRASADO${p.atrasados > 1 ? 'S' : ''}</span>` : '<span class="chip chip--ok">AL DÍA</span>';
      const destino = '08-proyecto.html?p=' + encodeURIComponent(p.codigo);
      return `<li><a class="tarjeta tarjeta--enlace proyecto-card" href="${destino}">
        <span class="proyecto-card__codigo mono">${esc(p.codigo)}</span>
        <span class="proyecto-card__nombre">${esc(p.nombre)}</span>
        <span class="proyecto-card__meta tenue">${esc(p.cliente)} · ${esc(p.municipio)}, ${esc(p.depto)}</span>
        ${barras}
        <span class="proyecto-card__pie"><span>Planos: ${p.planos[0]} de ${p.planos[1]}</span>${chip}</span>
      </a></li>`;
    };
    function pintar() {
      const todos = GRU.db.proyectos();
      const q = (buscar.value || '').trim().toLowerCase();
      const cuenta = { activo: todos.filter((p) => p.estado === 'activo').length, terminado: todos.filter((p) => p.estado === 'terminado').length, todos: todos.length };
      pills.forEach((b) => { b.querySelector('.pill__cuenta').textContent = cuenta[b.dataset.filtro]; b.setAttribute('aria-pressed', b.dataset.filtro === filtro); });
      const visibles = todos.filter((p) => (filtro === 'todos' || p.estado === filtro) && (!q || (p.codigo + ' ' + p.nombre + ' ' + p.cliente).toLowerCase().includes(q)));
      ul.innerHTML = visibles.map(tarjeta).join('');
      ul.hidden = !visibles.length;
      const sinNada = !todos.length;
      vacio.hidden = !!visibles.length;
      vacio.querySelector('[data-caso="nada"]').hidden = !sinNada;
      vacio.querySelector('[data-caso="filtro"]').hidden = sinNada;
    }
    pills.forEach((b) => b.addEventListener('click', () => { filtro = b.dataset.filtro; pintar(); }));
    buscar.addEventListener('input', pintar);
    window.addEventListener('gru:datos', pintar);
    pintar();
  }

  /* ---------- 7 · Nuevo proyecto ---------- */
  function nuevo() {
    const f = document.getElementById('form-proyecto');
    const nombre = f.elements.nombre, codigo = f.elements.codigo, cliente = f.elements.cliente;
    const err = document.getElementById('error-codigo'), prev = document.getElementById('cup-previo'), errNombre = document.getElementById('error-nombre');
    let tocado = false;
    cliente.innerHTML = GRU.db.clientes().map((c) => `<option>${esc(c)}</option>`).join('');
    codigo.addEventListener('input', () => { tocado = true; codigo.value = codigo.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); revisar(); });
    nombre.addEventListener('input', () => { if (!tocado) codigo.value = GRU.db.proponerCodigo(nombre.value); revisar(); });
    function revisar(mostrar) {
      const c = codigo.value;
      let msg = '';
      if (c && GRU.db.codigoExiste(c)) msg = `Ya existe un proyecto con el código ${c}. Prueba ${c.slice(0, 7)}2 u otro.`;
      else if (c && !GRU.db.codigoValido(c)) msg = 'Usa de 2 a 8 letras mayúsculas o números.';
      else if (mostrar && !c) msg = 'Escribe un código.';
      err.textContent = msg; err.hidden = !msg; codigo.toggleAttribute('aria-invalid', !!msg);
      prev.textContent = (c || 'CODIGO') + '-CONAR-001';
      return !msg && !!c;
    }
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const okNombre = nombre.value.trim().length > 0;
      errNombre.hidden = okNombre; nombre.toggleAttribute('aria-invalid', !okNombre);
      const okCod = revisar(true);
      if (!okNombre || !okCod) return;
      const p = GRU.db.crearProyecto({ nombre: nombre.value.trim(), codigo: codigo.value, cliente: cliente.value, depto: f.elements.depto.value, municipio: f.elements.municipio.value, direccion: f.elements.direccion.value.trim() });
      location.href = '08-proyecto.html?p=' + encodeURIComponent(p.codigo);
    });
    revisar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (v === 'proyectos') lista(); else if (v === 'proyecto-nuevo') nuevo();
  });
})();
