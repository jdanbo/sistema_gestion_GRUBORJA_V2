/* vistas/comun.js · Piezas que comparten las pantallas con datos (planos, hitos…): proyecto en curso, cabecera con pestañas, avisos de copia, huella de archivos. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const db = () => GRU.db;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const q = new URLSearchParams(location.search);
  const COD = GRU.proyectoActual();
  const PROY = () => db().proyecto(COD) || db().proyectos()[0];
  const quien = () => GRU.datos.personas[GRU.estado.rol].nombre;
  const esGerencia = () => GRU.estado.rol !== 'equipo';
  const enlace = (pag, extra) => pag + '?p=' + encodeURIComponent(COD) + (extra || '');
  const fechaLarga = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1] + ' ' + y; };
  const hoyIso = () => new Date().toISOString().slice(0, 10);
  const raiz = () => document.getElementById('raiz');
  const corto = (h) => h ? h.slice(0, 6) + '…' + h.slice(-6) : '';

  async function huella(archivo) {
    try { const b = await crypto.subtle.digest('SHA-256', await archivo.arrayBuffer()); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return ''; }
  }
  function elegirArchivo(accept, alElegir) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.addEventListener('change', async () => { const f = i.files[0]; if (f) alElegir(f, await huella(f)); });
    i.click();
  }
  const copiar = (txt) => { try { navigator.clipboard.writeText(txt); } catch (e) { /* igual */ } GRU.aviso('Copiado: ' + txt, 'ok'); };

  function cabeceraProyecto(activo) {
    const p = PROY();
    const alertas = db().resumenHitos(p.codigo).atrasados;   /* el número junto a «Hitos» son los atrasados */
    const defs = db().pendientesDef(p.codigo).length;
    const tabs = [['08-proyecto.html', 'Resumen'], ['14-hitos.html', 'Hitos'], ['10-planos.html', 'Planos'], ['19-minutas.html', 'Minutas'], ['20-definiciones.html', 'Cliente']];
    return `<p class="pagina__atras"><a class="enlace-flecha enlace-flecha--atras" href="06-proyectos.html"><span data-icono="atras"></span> Proyectos</a></p>
    <div class="proyecto-cab"><div><span class="proyecto-cab__codigo">${esc(p.codigo)}</span><h1>${esc(p.nombre)}</h1><p class="proyecto-cab__meta tenue">${esc(p.cliente)} · ${esc(p.municipio)}, ${esc(p.depto)}</p></div>
      <div class="proyecto-cab__lado"><button class="btn btn--chico" type="button" data-imprimir-todo>Imprimir todo en PDF</button>${p.estado === 'terminado' ? '<span class="chip chip--acento">TERMINADO</span>' : !p.hitos ? '<span class="chip">NUEVO</span>' : '<span class="chip chip--ok">ACTIVO</span>'}</div></div>
    <nav class="tabs" aria-label="Secciones del proyecto">${tabs.map(([h, t]) => `<a class="tab" href="${enlace(h)}"${h === activo ? ' aria-current="page"' : ''}>${t}${h === '14-hitos.html' && alertas ? ` <span class="tab__cuenta">${alertas}</span>` : ''}${h === '20-definiciones.html' && defs ? ` <span class="tab__cuenta">${defs}</span>` : ''}</a>`).join('')}</nav>`;
  }
  /* Arma un documento con todo el proyecto y abre la impresión del navegador (ahí se elige «Guardar como PDF»). */
  function imprimirTodo() {
    const p = PROY(), d = db(), c = p.codigo;
    const hs = d.hitos(c), pl = d.planos(c), mi = d.minutas(c), pe = d.pendientes().filter((x) => x.proyecto === c);
    const tabla = (cab, filas) => `<table><thead><tr>${cab.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cab.length}">Sin registros.</td></tr>`}</tbody></table>`;
    const el = document.createElement('div'); el.id = 'imprimible';
    el.innerHTML = `<h1>${esc(p.codigo)} · ${esc(p.nombre)}</h1><p>${esc(p.cliente)} · ${esc(p.municipio)}, ${esc(p.depto)} · Al ${fechaLarga(d.HOY)}</p>
      <h2>Hitos (${hs.length})</h2>${tabla(['N.º', 'Hito', 'Estado', 'Responsable', 'Fin previsto', 'Avance'], hs.map((h) => [h.cat, h.nombre, h.estado, h.resp, d.finPrevisto(h) ? fechaLarga(d.finPrevisto(h)) : '—', d.avanceHito(h) + '%']))}
      <h2>INDEX de planos (${pl.length})</h2>${tabla(['CUP', 'Título', 'Versión', 'Estado'], pl.map((x) => { const u = d.ultima(x); return [x.cup, x.titulo, u ? 'V' + String(u.v).padStart(2, '0') : '—', d.estadoPlano(x)]; }))}
      <h2>Minutas (${mi.length})</h2>${tabla(['Fecha', 'Minuta', 'Temas', 'Comentarios abiertos'], mi.map((m) => { const r = d.resumenMinuta(m); return [fechaLarga(m.fecha), m.nombre, r.temas, r.abiertos]; }))}
      <h2>Pendientes abiertos (${pe.length})</h2>${tabla(['Qué', 'Quién', 'Fecha'], pe.map((x) => [x.titulo, x.persona, x.fecha ? fechaLarga(x.fecha) : '—']))}`;
    document.body.appendChild(el); document.body.classList.add('imprimiendo');
    const fin = () => { el.remove(); document.body.classList.remove('imprimiendo'); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin); window.print(); setTimeout(() => { if (document.getElementById('imprimible')) fin(); }, 1500);
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-imprimir-todo]')) imprimirTodo(); });
  const volverA = (txt, href) => `<p class="pagina__atras"><a class="enlace-flecha enlace-flecha--atras" href="${href}"><span data-icono="atras"></span> ${esc(txt)}</a></p>`;
  function pintarIconos() { const C = GRU.comportamientos; if (!C) return; C.iconos(); C.propagar(); if (document.querySelector('nav.tabs') && !document.querySelector('.tabs-select')) C.secciones(); }


  /* Cuadro de diálogo sencillo (usa el velo de la maqueta). Devuelve { caja, cerrar }. */
  function dialogo(titulo, cuerpo) {
    const velo = document.createElement('div');
    velo.className = 'maq-velo';
    velo.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="dlg-titulo"><div class="dialogo__caja"><h2 class="dialogo__titulo" id="dlg-titulo">${titulo}</h2>${cuerpo}</div></div>`;
    const previo = document.activeElement;
    const cerrar = () => { velo.remove(); document.removeEventListener('keydown', tecla); if (previo && previo.focus) previo.focus(); };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', tecla);
    velo.addEventListener('click', (e) => { if (e.target === velo) cerrar(); });
    document.body.appendChild(velo);
    const primero = velo.querySelector('input, select, textarea, button');
    if (primero) primero.focus();
    return { caja: velo.querySelector('.dialogo__caja'), cerrar };
  }

  GRU.vista = { dialogo, db, esc, q, COD, PROY, quien, esGerencia, enlace, fechaLarga, hoyIso, raiz, corto, huella, elegirArchivo, copiar, cabeceraProyecto, volverA, pintarIconos };
})();
