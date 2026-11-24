/* vistas/seguimiento.js · Pantallas 18 (Pendientes por persona), 19 (Minutas) y 24 (Historial), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, q, COD, PROY, quien, esGerencia, enlace, raiz, cabeceraProyecto, pintarIconos, dialogo } = GRU.vista;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const corta = (iso) => { const [, m, d] = iso.split('-').map(Number); return d + ' ' + MES[m - 1]; };
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const iniciales = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const gente = () => db().usuariosActivos().map((u) => u.nombre);
  const opciones = (lista, sel) => lista.map((x) => `<option${x === sel ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const campo = (etq, ctl, err, id) => `<label class="campo"><span class="campo__etiqueta">${etq}</span>${ctl}${err ? `<span class="campo__error" role="alert" data-err="${id}" hidden>${err}</span>` : ''}</label>`;

  /* ======================= 18 · Pendientes por persona ======================= */
  function pendientes() {
    const r = raiz(), yo = quien(), todos = esGerencia();
    const f = { persona: todos ? 'Toda la oficina' : yo, proyecto: 'Todos', tipo: 'Todos', mostrar: 'Abiertos' };
    const base = db().pendientes().filter((x) => todos || x.persona === yo);
    const gente = [...new Set(base.map((x) => x.persona))].sort();
    const proys = [...new Set(base.map((x) => x.proyecto))].sort();
    const TIPOS = { 'Pasos de hito': 'paso', 'Puntos de minuta': 'minuta', 'Planos': 'plano' };
    r.innerHTML = `<div class="pagina__titulo"><h1 class="titulo-seccion">Pendientes por <em>persona</em></h1><button class="btn btn--primario" type="button" id="pdf">Exportar PDF (A4)</button></div>
      <div class="filtros-fila" style="grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))">
        <label class="campo"><span class="campo__etiqueta">Persona</span><select class="campo__entrada" id="f-persona"${todos ? '' : ' disabled'}>${todos ? '<option>Toda la oficina</option>' + opciones(gente) : `<option>${esc(yo)}</option>`}</select></label>
        <label class="campo"><span class="campo__etiqueta">Proyecto</span><select class="campo__entrada" id="f-proyecto"><option>Todos</option>${opciones(proys)}</select></label>
        <label class="campo"><span class="campo__etiqueta">Tipo</span><select class="campo__entrada" id="f-tipo"><option>Todos</option>${opciones(Object.keys(TIPOS))}</select></label>
        <label class="campo"><span class="campo__etiqueta">Mostrar</span><select class="campo__entrada" id="f-mostrar">${opciones(['Abiertos', 'Solo atrasados', 'Vencen esta semana'])}</select></label>
      </div><div id="lista"></div>`;
    const chip = (x) => x.atraso ? `<span class="chip chip--grave">ATRASADO ${plural(x.atraso, 'DÍA', 'DÍAS')}</span>` : x.fecha === null ? '<span class="chip">SIN FECHA</span>' : x.dias === 0 ? '<span class="chip chip--alerta">VENCE HOY</span>' : x.dias === 1 ? '<span class="chip chip--alerta">VENCE MAÑANA</span>' : x.dias <= 3 ? `<span class="chip chip--alerta">VENCE ${corta(x.fecha).toUpperCase()}</span>` : `<span class="chip">${corta(x.fecha).toUpperCase()}</span>`;
    function pintar() {
      let l = base.filter((x) => (f.persona === 'Toda la oficina' || x.persona === f.persona) && (f.proyecto === 'Todos' || x.proyecto === f.proyecto) && (f.tipo === 'Todos' || x.tipo === TIPOS[f.tipo]));
      if (f.mostrar === 'Solo atrasados') l = l.filter((x) => x.atraso); else if (f.mostrar === 'Vencen esta semana') l = l.filter((x) => x.fecha && !x.atraso && x.dias <= 7);
      const caja = document.getElementById('lista');
      if (!l.length) { caja.innerHTML = '<section class="tarjeta vacio"><h2>No hay pendientes abiertos con estos filtros</h2><button class="btn" type="button" id="quitar">Quitar filtros</button></section>'; document.getElementById('quitar').addEventListener('click', () => { f.persona = todos ? 'Toda la oficina' : yo; f.proyecto = f.tipo = 'Todos'; f.mostrar = 'Abiertos'; r.querySelector('#f-persona').value = f.persona; r.querySelector('#f-proyecto').value = r.querySelector('#f-tipo').value = 'Todos'; r.querySelector('#f-mostrar').value = 'Abiertos'; pintar(); }); return; }
      const personas = [...new Set(l.map((x) => x.persona))].sort((a, b) => l.filter((x) => x.atraso && x.persona === b).length - l.filter((x) => x.atraso && x.persona === a).length || a.localeCompare(b));
      const atr = l.filter((x) => x.atraso).length, np = new Set(l.map((x) => x.proyecto)).size;
      caja.innerHTML = `<p class="tenue">${plural(l.length, 'pendiente abierto', 'pendientes abiertos')} en ${plural(np, 'proyecto', 'proyectos')} · ${plural(atr, 'atrasado', 'atrasados')}.${todos && f.persona === 'Toda la oficina' ? ` Se muestran ${plural(personas.length, 'persona', 'personas')}.` : ''}</p>` + personas.map((n) => {
        const m = l.filter((x) => x.persona === n), a = m.filter((x) => x.atraso).length;
        return `<section class="tarjeta persona-bloque"><div class="persona-bloque__cab"><span class="marco__iniciales" aria-hidden="true">${iniciales(n)}</span><h2>${esc(n)}${(db().usuarioPorNombre(n) || {}).estado === 'desactivada' ? ' <span class="chip chip--grave">CUENTA DESACTIVADA</span>' : ''}</h2><span class="persona-bloque__cuenta">${plural(m.length, 'abierto', 'abiertos')}${a ? ' · ' + plural(a, 'atrasado', 'atrasados') : ''}</span></div><ul class="filas">${m.map((x) => { const h = `${x.pag}?p=${encodeURIComponent(x.proyecto)}${x.extra}`; return `<li class="fila">${chip(x)}<span class="fila__que"><a class="fila__titulo" href="${h}">${esc(x.titulo)}</a><span class="fila__detalle">${esc(x.detalle)} · <span class="mono">${esc(x.proyecto)}</span></span></span><span class="fila__quien">${x.fecha ? corta(x.fecha) : '—'}</span><a class="btn btn--chico" href="${h}">Abrir</a></li>`; }).join('')}</ul></section>`;
      }).join('');
      pintarIconos();
    }
    [['persona', '#f-persona'], ['proyecto', '#f-proyecto'], ['tipo', '#f-tipo'], ['mostrar', '#f-mostrar']].forEach(([k, s]) => r.querySelector(s).addEventListener('change', (e) => { f[k] = e.target.value; pintar(); }));
    document.getElementById('pdf').addEventListener('click', () => GRU.aviso('En el sistema real esto genera un PDF A4 con los pendientes que ves ahora.', 'ok'));
    pintar();
  }

  /* ======================= 19 · Minutas ======================= */
  function minutas() {
    const r = raiz(), p = PROY(), cerradoP = p.estado === 'terminado';
    let sel = q.get('m'), ocultar = false, nueva = q.get('nueva') === '1';
    const hitosP = () => db().hitos(p.codigo);
    const hitoOpc = (cat) => '<option value="">Ninguno</option>' + hitosP().map((h) => `<option value="${h.cat}"${h.cat === cat ? ' selected' : ''}>${h.cat} ${esc(h.nombre)}</option>`).join('');
    const comHtml = () => `<div class="grupo-com"><label class="campo"><span class="campo__etiqueta">Comentario</span><input class="campo__entrada" data-c="texto" autocomplete="off" placeholder="Qué hay que hacer"><span class="campo__error" role="alert" hidden>Escribe el comentario.</span></label>
      <div class="formulario__dos"><label class="campo"><span class="campo__etiqueta">Encargado</span><select class="campo__entrada" data-c="enc">${opciones(gente())}</select></label>
      <label class="campo"><span class="campo__etiqueta">Fecha</span><input class="campo__entrada" type="date" data-c="fecha"><span class="campo__error" role="alert" hidden>Elige la fecha.</span></label></div></div>`;
    const temaHtml = (n) => `<fieldset class="grupo" data-tema><legend class="etiqueta">Tema ${n}</legend>
      <div class="formulario__dos"><label class="campo"><span class="campo__etiqueta">Tema</span><input class="campo__entrada" data-t="nombre" autocomplete="off" placeholder="Ej. Impermeabilización"><span class="campo__error" role="alert" hidden>Escribe el tema.</span></label>
      <label class="campo"><span class="campo__etiqueta">Hito relacionado <span class="campo__opcional">opcional</span></span><select class="campo__entrada" data-t="hito">${hitoOpc('')}</select></label></div>
      <div data-comentarios>${comHtml()}</div><button class="btn btn--chico" type="button" data-mas-com>Agregar otro comentario</button></fieldset>`;
    function leer(raizEl) {
      let ok = true, primero = null;
      const marca = (el, bad) => { const e = el.closest('.campo').querySelector('.campo__error'); if (e) e.hidden = !bad; if (bad) { ok = false; primero = primero || el; } };
      const temas = [...raizEl.querySelectorAll('[data-tema]')].map((fs) => {
        const nombre = fs.querySelector('[data-t=nombre]'); marca(nombre, !nombre.value.trim());
        const comentarios = [...fs.querySelectorAll('.grupo-com')].map((g) => { const t = g.querySelector('[data-c=texto]'), d = g.querySelector('[data-c=fecha]'); marca(t, !t.value.trim()); marca(d, !d.value); return { texto: t.value.trim(), enc: g.querySelector('[data-c=enc]').value, fecha: d.value }; });
        return { nombre: nombre.value.trim(), hito: fs.querySelector('[data-t=hito]').value || null, comentarios };
      });
      return { ok, primero, temas };
    }
    function enlazarForm(cont) {
      cont.addEventListener('click', (e) => {
        const mc = e.target.closest('[data-mas-com]'); if (mc) { mc.closest('fieldset').querySelector('[data-comentarios]').insertAdjacentHTML('beforeend', comHtml()); }
      });
    }
    function pintar() {
      const ms = db().minutas(p.codigo), m = (sel && db().minuta(sel) && db().minuta(sel).proyecto === p.codigo) ? db().minuta(sel) : ms[0];
      let html = cabeceraProyecto('19-minutas.html');
      if (cerradoP) html += '<p class="bloqueo"><span data-icono="candado"></span> El proyecto está terminado: las minutas se pueden consultar, no cambiar.</p>';
      if (!ms.length && !nueva) {
        html += `<section class="tarjeta vacio"><h2>Este proyecto aún no tiene minutas</h2><p class="tenue">Registra la reunión por temas; cada comentario lleva encargado, fecha y estado.</p>${cerradoP ? '' : '<button class="btn btn--primario" type="button" id="nueva">Nueva minuta</button>'}</section>`;
        r.innerHTML = html; pintarIconos(); const b = document.getElementById('nueva'); if (b) b.addEventListener('click', () => { nueva = true; pintar(); }); return;
      }
      const aside = `<aside class="tarjeta seccion"><div class="seccion__cabecera"><h2>Minutas</h2>${cerradoP ? '' : '<button class="btn btn--chico btn--primario" type="button" id="nueva">Nueva</button>'}</div>
        <ul class="lista-minutas">${ms.map((x) => { const s = db().resumenMinuta(x); return `<li><a href="${enlace('19-minutas.html', '&m=' + x.id)}"${!nueva && m && x.id === m.id ? ' aria-current="true"' : ''}><strong>${esc(x.nombre)}</strong><span class="tenue pequeno">${corta(x.fecha)} ${x.fecha.slice(0, 4)} · ${plural(s.temas, 'tema', 'temas')} · ${s.abiertos ? plural(s.abiertos, 'abierto', 'abiertos') : 'cerrada'}</span></a></li>`; }).join('')}</ul>
        <p class="tenue pequeno" style="margin:.75rem 0 0">Las notas que se escriben dentro de un hito también aparecen aquí.</p>
        ${(() => { const ns = db().notasDeHitos(p.codigo).slice(0, 3); return ns.length ? `<h3 style="margin:1rem 0 .5rem;font-size:1rem">Notas desde hitos</h3><ul class="actividad">${ns.map(({ h, n }) => `<li><a href="${enlace('16-hito.html', '&h=' + h.cat)}">${esc(h.nombre)}</a>: ${esc(n.texto)}<time>${esc(n.por)} · ${corta(n.fecha)}</time></li>`).join('')}</ul>` : ''; })()}</aside>`;
      let main;
      if (nueva) {
        main = `<form class="tarjeta formulario" novalidate id="f-min"><h2>Nueva minuta</h2>
          <div class="formulario__dos">${campo('Reunión', '<input class="campo__entrada" id="m-nombre" autocomplete="off" placeholder="Ej. Reunión semanal de obra">', 'Escribe el nombre de la reunión.', 'nombre')}${campo('Fecha', `<input class="campo__entrada" id="m-fecha" type="date" value="${db().HOY}">`, 'Elige la fecha de la reunión.', 'fecha')}</div>
          <div id="temas">${temaHtml(1)}</div><button class="btn btn--chico" type="button" id="mas-tema">Agregar otro tema</button>
          <p class="campo__error" role="alert" id="m-error" hidden>Revisa los campos marcados.</p>
          <div class="acciones"><button class="btn" type="button" id="cancelar">Cancelar</button><button class="btn btn--primario" type="submit">Guardar minuta</button></div></form>`;
      } else {
        const s = db().resumenMinuta(m);
        main = `<div class="seccion__cabecera"><div><h2 style="margin:0">${esc(m.nombre)}</h2><p class="tenue pequeno" style="margin:0">${corta(m.fecha)} ${m.fecha.slice(0, 4)} · registró ${esc(m.por)}${m.asistentes ? ' · asistieron ' + m.asistentes : ''}</p></div>
          <div class="seccion__acciones seccion__acciones--dos"><label class="casilla casilla--texto" style="margin:0"><input type="checkbox" id="ocultar"${ocultar ? ' checked' : ''}><span class="casilla__marca"></span>Ocultar cerrados</label>${cerradoP ? '' : '<button class="btn btn--chico" type="button" id="mas-t">Agregar tema</button>'}</div></div>
          ${m.temas.map((t) => {
            const rs = db().resumenTema(t), cs = ocultar ? t.comentarios.filter((c) => c.estado !== 'cerrado') : t.comentarios;
            if (ocultar && !cs.length) return '';
            const hit = t.hito && db().hito(p.codigo, t.hito);
            const chipT = rs.cerrado ? '<span class="chip chip--ok">CERRADO</span>' : rs.atrasados ? `<span class="chip chip--grave">ABIERTO · ${plural(rs.atrasados, 'ATRASADO', 'ATRASADOS')}</span>` : `<span class="chip chip--alerta">ABIERTO · ${rs.abiertos} DE ${rs.n}</span>`;
            return `<article class="tema"><div class="tema__cab"><h3>${esc(t.nombre)}</h3>${hit ? `<a class="tag" href="${enlace('16-hito.html', '&h=' + hit.cat)}">Hito ${hit.cat}</a>` : ''}${chipT}</div>
              <div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Comentario</th><th>Encargado</th><th>Fecha</th><th>Estado</th>${cerradoP ? '' : '<th><span class="solo-lector">Acción</span></th>'}</tr></thead><tbody>${cs.map((c) => { const e = db().estadoComentario(c); return `<tr><td data-label="Comentario">${esc(c.texto)}</td><td data-label="Encargado">${esc(c.enc)}</td><td data-label="Fecha" class="nw">${corta(c.fecha)}</td><td data-label="Estado"><span class="chip ${e === 'CERRADO' ? 'chip--ok' : e === 'ATRASADO' ? 'chip--grave' : ''}">${e}</span></td>${cerradoP ? '' : `<td data-label="Acción"><button class="btn btn--chico" type="button" data-cambiar="${c.id}" data-a="${c.estado === 'cerrado' ? 'abrir' : 'cerrar'}" aria-label="${c.estado === 'cerrado' ? 'Reabrir' : 'Cerrar'}: ${esc(c.texto)}">${c.estado === 'cerrado' ? 'Reabrir' : 'Cerrar'}</button></td>`}</tr>`; }).join('')}</tbody></table></div></article>`;
          }).join('')}
          ${ocultar && s.abiertos === 0 ? '<p class="tenue">Todo está cerrado en esta minuta.</p>' : ''}
          <p class="bloqueo"><span data-icono="candado"></span> El estado de cada tema se calcula desde sus comentarios. Las minutas las ve toda la oficina; el cliente no.</p>`;
      }
      r.innerHTML = html + `<div class="rejilla"><div>${main}</div>${aside}</div>`;
      pintarIconos(); acciones(m);
    }
    function acciones(m) {
      const nb = document.getElementById('nueva'); if (nb) nb.addEventListener('click', () => { nueva = true; pintar(); window.scrollTo(0, 0); });
      const oc = document.getElementById('ocultar'); if (oc) oc.addEventListener('change', () => { ocultar = oc.checked; pintar(); const o = document.getElementById('ocultar'); if (o) o.focus(); });
      r.querySelectorAll('[data-cambiar]').forEach((b) => b.addEventListener('click', () => { const cerrar = b.dataset.a === 'cerrar'; db().cambiarComentario(b.dataset.cambiar, cerrar, quien()); GRU.aviso(cerrar ? 'Comentario cerrado.' : 'Comentario reabierto.', 'ok'); pintar(); }));
      const mt = document.getElementById('mas-t'); if (mt) mt.addEventListener('click', () => {
        const d = dialogo('Agregar tema', `<form id="f-tema" novalidate>${temaHtml(m.temas.length + 1).replace('<legend class="etiqueta">Tema ' + (m.temas.length + 1) + '</legend>', '')}<div class="acciones"><button class="btn" type="button" id="no-t">Cancelar</button><button class="btn btn--primario" type="submit">Agregar tema</button></div></form>`);
        enlazarForm(d.caja); d.caja.querySelector('#no-t').addEventListener('click', d.cerrar);
        d.caja.querySelector('#f-tema').addEventListener('submit', (e) => { e.preventDefault(); const L = leer(d.caja); if (!L.ok) { L.primero.focus(); return; } db().agregarTema(m.id, L.temas[0], quien()); d.cerrar(); GRU.aviso('Tema agregado.', 'ok'); pintar(); });
      });
      const f = document.getElementById('f-min'); if (!f) return;
      enlazarForm(f);
      document.getElementById('cancelar').addEventListener('click', () => { nueva = false; pintar(); });
      document.getElementById('mas-tema').addEventListener('click', () => { const n = f.querySelectorAll('[data-tema]').length + 1; document.getElementById('temas').insertAdjacentHTML('beforeend', temaHtml(n)); });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('m-nombre'), fecha = document.getElementById('m-fecha'); let ok = true, primero = null;
        [[nombre, !nombre.value.trim()], [fecha, !fecha.value]].forEach(([el, bad]) => { el.closest('.campo').querySelector('.campo__error').hidden = !bad; if (bad) { ok = false; primero = primero || el; } });
        const L = leer(f); ok = ok && L.ok; primero = primero || L.primero;
        document.getElementById('m-error').hidden = ok;
        if (!ok) { primero.focus(); return; }
        const nm = db().crearMinuta(p.codigo, { nombre: nombre.value.trim(), fecha: fecha.value, temas: L.temas }, quien());
        nueva = false; sel = nm.id; GRU.aviso('Minuta guardada.', 'ok'); pintar(); window.scrollTo(0, 0);
      });
    }
    pintar();
  }

  /* ======================= 24 · Historial ======================= */
  function historial() {
    const r = raiz(), todo = db().historialGlobal();
    const quienes = [...new Set(todo.map((x) => x.quien).filter(Boolean))].sort(), tipos = [...new Set(todo.map((x) => x.tipo))];
    r.innerHTML = `<p class="pagina__atras"><a class="enlace-flecha enlace-flecha--atras" href="00-mas.html"><span data-icono="atras"></span> Más</a></p>
      <div class="pagina__titulo"><h1 class="titulo-seccion">Historial</h1>${esGerencia() ? '<a class="btn" href="27-cronologia.html">Generar cronología</a>' : ''}</div>
      <div class="filtros-fila">
        <label class="campo"><span class="campo__etiqueta">Buscar</span><input class="campo__entrada" type="search" id="h-q" placeholder="CUP, hito o texto" autocomplete="off"></label>
        <label class="campo"><span class="campo__etiqueta">Proyecto</span><select class="campo__entrada" id="h-p"><option>Todos</option>${opciones(db().proyectos().map((x) => x.codigo))}</select></label>
        <label class="campo"><span class="campo__etiqueta">Persona</span><select class="campo__entrada" id="h-q2"><option>Todas</option>${opciones(quienes)}</select></label>
        <label class="campo"><span class="campo__etiqueta">Tipo</span><select class="campo__entrada" id="h-t"><option>Todo</option>${opciones(tipos)}</select></label>
        <label class="campo"><span class="campo__etiqueta">Desde</span><input class="campo__entrada" type="date" id="h-d"></label>
      </div><div id="h-lista"></div>
      <p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> Nadie puede editar ni borrar el historial, tampoco Soporte técnico. Guarda quién, qué y cuándo.</p>`;
    const g = (id) => document.getElementById(id);
    function pintar() {
      const t = g('h-q').value.trim().toLowerCase(), p = g('h-p').value, w = g('h-q2').value, ty = g('h-t').value, d = g('h-d').value;
      const l = todo.filter((x) => (!t || (x.txt + ' ' + x.cambio + ' ' + x.proy).toLowerCase().includes(t)) && (p === 'Todos' || x.proy === p) && (w === 'Todas' || x.quien === w) && (ty === 'Todo' || x.tipo === ty) && (!d || x.dia >= d));
      g('h-lista').innerHTML = l.length ? `<section class="tarjeta"><ul class="historial">${l.slice(0, 80).map((x) => `<li class="historial__fila"><span class="historial__cuando tenue">${esc(x.cuando)}</span><span>${x.quien && x.txt.startsWith(x.quien) ? `<strong>${esc(x.quien)}</strong>${esc(x.txt.slice(x.quien.length))}` : esc(x.txt)}${x.cambio ? `<br><span class="evento__cambio">${esc(x.cambio)}</span>` : ''}</span></li>`).join('')}</ul></section>${l.length > 80 ? `<p class="tenue pequeno">Se muestran los 80 más recientes de ${l.length}.</p>` : ''}`
        : '<section class="tarjeta vacio"><h2>Nada coincide con estos filtros</h2><button class="btn" type="button" id="h-quitar">Quitar filtros</button></section>';
      const qb = g('h-quitar'); if (qb) qb.addEventListener('click', () => { g('h-q').value = ''; g('h-p').value = 'Todos'; g('h-q2').value = 'Todas'; g('h-t').value = 'Todo'; g('h-d').value = ''; pintar(); });
    }
    ['h-q', 'h-p', 'h-q2', 'h-t', 'h-d'].forEach((id) => g(id).addEventListener(id === 'h-q' ? 'input' : 'change', pintar));
    const pp = q.get('persona'); if (pp && quienes.includes(pp)) g('h-q2').value = pp;
    pintar(); pintarIconos();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (v === 'pendientes') return pendientes();
    if (v === 'historial') return historial();
    if (v === 'minutas') {
      if (!db().proyectos().length) { raiz().innerHTML = '<section class="tarjeta vacio"><h1>No hay proyectos</h1></section>'; return; }
      minutas();
    }
  });
})();
