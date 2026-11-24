/* vistas/reportes.js · Pantallas 27 (Documento cronológico) y 28 (Tablero de oficina), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, PROY, quien, esGerencia, raiz, pintarIconos, fechaLarga } = GRU.vista;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const corta = (iso) => { const [, m, d] = iso.split('-').map(Number); return d + ' ' + MES[m - 1]; };
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

  /* ======================= 27 · Documento cronológico ======================= */
  function cronologia() {
    const r = raiz(), p = PROY();
    if (!esGerencia()) {
      r.innerHTML = `<section class="tarjeta vacio"><h1 class="titulo-bloque">Documento cronológico</h1><p class="bloqueo" style="justify-content:center"><span data-icono="candado"></span> Solo Gerencia genera la cronología del proyecto.</p><p style="margin-top:1rem"><a class="btn" href="08-proyecto.html?p=${encodeURIComponent(p.codigo)}">Volver al proyecto</a></p></section>`; pintarIconos(); return;
    }
    const o = { desde: p.creado > '2026-10-12' ? p.creado : '2026-10-12', hasta: db().HOY, entregas: true, hitos: true, decisiones: true, reuniones: false, quien: false };
    const casilla = (k, t) => `<label class="casilla casilla--texto"><input type="checkbox" data-k="${k}"${o[k] ? ' checked' : ''}><span class="casilla__marca"></span>${t}</label>`;
    r.innerHTML = `<p class="pagina__atras"><a class="enlace-flecha enlace-flecha--atras" href="08-proyecto.html?p=${encodeURIComponent(p.codigo)}"><span data-icono="atras"></span> ${esc(p.codigo)} · ${esc(p.nombre)}</a></p>
      <div class="pagina__titulo"><h1 class="titulo-seccion">Documento <em>cronológico</em></h1><button class="btn btn--primario" type="button" id="pdf">Generar PDF</button></div>
      <div class="rejilla rejilla--cron"><aside class="tarjeta seccion"><h2>Qué incluir</h2>
        <div class="formulario__dos"><label class="campo"><span class="campo__etiqueta">Desde</span><input class="campo__entrada" type="date" id="desde" value="${o.desde}"></label><label class="campo"><span class="campo__etiqueta">Hasta</span><input class="campo__entrada" type="date" id="hasta" value="${o.hasta}"></label></div>
        <p class="campo__error" role="alert" id="e-rango" hidden>La fecha de inicio no puede ser posterior a la final.</p>
        ${casilla('entregas', 'Entregas de planos a instituciones')}${casilla('hitos', 'Contrataciones y cierres de hitos')}${casilla('decisiones', 'Decisiones del cliente')}${casilla('reuniones', 'Reuniones (solo fecha y temas)')}${casilla('quien', 'Nombre de quien registró')}
        <p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> Sale del historial tal como quedó registrado: no se puede escribir ni corregir a mano.</p></aside>
        <article class="papel" aria-label="Vista previa del documento" id="papel"></article></div>`;
    const papel = document.getElementById('papel'), pdf = document.getElementById('pdf');
    function pintar() {
      const bad = o.desde > o.hasta; document.getElementById('e-rango').hidden = !bad;
      const ev = bad ? [] : db().cronologia(p.codigo, o), meses = [];
      ev.forEach((e) => { const k = e.fecha.slice(0, 7); let g = meses.find((m) => m.k === k); if (!g) meses.push(g = { k, l: [] }); g.l.push(e); });
      pdf.disabled = !ev.length;
      const cuerpo = ev.length ? meses.map((m) => { const [y, mm] = m.k.split('-').map(Number); return `<h3>${MESL[mm - 1]} ${y}</h3><table><tbody>${m.l.map((e) => `<tr><td>${corta(e.fecha)}</td><td>${esc(e.txt)}</td></tr>`).join('')}</tbody></table>`; }).join('')
        : `<p style="margin:1.5rem 0;color:#6B6D7A">${bad ? 'Corrige las fechas para ver la cronología.' : 'No hay hechos registrados con estas opciones. Prueba con otro periodo o marca más casillas.'}</p>`;
      papel.innerHTML = `<p class="etiqueta" style="color:#5F107A">GRUBORJA · Arquitectura e ingeniería</p><h2>Cronología del proyecto<br>${esc(p.nombre)} (${esc(p.codigo)})</h2><p style="color:#6B6D7A;font-size:.875rem">${esc(p.cliente)} · del ${corta(o.desde)} ${o.desde.slice(0, 4)} al ${corta(o.hasta)} ${o.hasta.slice(0, 4)} · ${plural(ev.length, 'hecho registrado', 'hechos registrados')}</p>${cuerpo}<p class="papel__pie">Generado el ${fechaLarga(db().HOY)} desde el sistema de gestión. Cada hecho corresponde a un registro con fecha y autor que no puede modificarse.${ev.length ? ' Página 1 de ' + Math.max(1, Math.ceil(ev.length / 14)) + '.' : ''}</p>`;
    }
    r.querySelectorAll('[data-k]').forEach((c) => c.addEventListener('change', () => { o[c.dataset.k] = c.checked; pintar(); }));
    document.getElementById('desde').addEventListener('change', (e) => { if (e.target.value) o.desde = e.target.value; pintar(); });
    document.getElementById('hasta').addEventListener('change', (e) => { if (e.target.value) o.hasta = e.target.value; pintar(); });
    pdf.addEventListener('click', () => GRU.aviso('En el sistema real se descarga este documento como PDF, con las mismas opciones.', 'ok'));
    pintar(); pintarIconos();
  }

  /* ======================= 28 · Tablero de oficina ======================= */
  function tablero() {
    const r = raiz(), gestor = esGerencia(), hoy = (() => { const [y, m, d] = db().HOY.split('-').map(Number); const s = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; return s[0].toUpperCase() + s.slice(1) + ' ' + d + ' de ' + MESL[m - 1].toLowerCase() + ' de ' + y; })();
    const filas = db().tablero(), carga = db().cargaPorPersona().slice(0, 6), max = Math.max(1, ...carga.map((c) => c.n)), sem = db().planosSemana();
    const num = (n, cls, href, etq) => `<td data-label="${etq}" class="num-celda ${n ? cls : ''}">${n ? `<a href="${href}" aria-label="${n} ${etq.toLowerCase()}">${n}</a>` : n}</td>`;
    const lp = (pag, c) => `${pag}?p=${encodeURIComponent(c)}`;
    r.innerHTML = `<div class="pagina__titulo"><div><p class="etiqueta saludo__fecha">${hoy}</p><h1 class="titulo-seccion">Tablero de <em>oficina</em></h1></div><a class="btn" href="18-pendientes.html">Ver pendientes por persona</a></div>
      <div class="rejilla"><div>
        <section class="tarjeta seccion"><h2>Dónde hay que mirar</h2>${filas.length ? `<div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Proyecto</th><th class="centro">Hitos atrasados</th><th class="centro">Vencen en 15 días</th><th class="centro">Pendientes de cotizar</th><th class="centro">Planos sin emisión</th><th class="centro">Definiciones vencidas</th></tr></thead><tbody>${filas.map((f) => `<tr><td data-label="Proyecto"><a class="fila__titulo" href="${lp('08-proyecto.html', f.p.codigo)}">${esc(f.p.nombre)}</a><br><span class="mono pequeno tenue">${f.p.codigo}</span></td>${num(f.atrasados, 'num-celda--grave', lp('14-hitos.html', f.p.codigo), 'Atrasados')}${num(f.porVencer, 'num-celda--alerta', lp('14-hitos.html', f.p.codigo), 'Por vencer')}${num(f.sinCotizar, '', lp('14-hitos.html', f.p.codigo), 'Pend. de cotizar')}${num(f.sinEmision, '', lp('10-planos.html', f.p.codigo), 'Sin emisión')}${num(f.defsVencidas, 'num-celda--grave', lp('20-definiciones.html', f.p.codigo), 'Def. vencidas')}</tr>`).join('')}</tbody></table></div><p class="tenue pequeno" style="margin:.75rem 0 0">Ordenado por lo más urgente. Cada número abre la lista correspondiente.</p>` : '<p class="tenue">No hay proyectos activos.</p>'}</section>
        <section class="tarjeta seccion"><h2>Avisos automáticos</h2><div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Cuándo avisa</th><th>A quién</th><th>Cómo</th><th>Activo</th></tr></thead><tbody>${db().avisos().map((a) => `<tr><td class="celda-titulo" data-label="Cuándo avisa">${esc(a.cuando)}</td><td data-label="A quién">${esc(a.quien)}</td><td data-label="Cómo">${esc(a.como)}</td><td data-label="Activo"><label class="interruptor"><input type="checkbox" role="switch" data-aviso="${a.id}"${a.activo ? ' checked' : ''}${gestor ? '' : ' disabled'} aria-label="Aviso activo: ${esc(a.cuando)}"><span class="interruptor__pista" aria-hidden="true"></span></label></td></tr>`).join('')}</tbody></table></div>
          ${gestor ? '<p class="tenue pequeno" style="margin:.75rem 0 0">Los cambios quedan en el historial. En el sistema real, los avisos llegan en Hoy y por correo.</p>' : '<p class="bloqueo" style="margin-top:.75rem"><span data-icono="candado"></span> Los avisos los configura Gerencia.</p>'}</section>
      </div><aside>
        <section class="tarjeta seccion"><h2>Carga por persona</h2><p class="tenue pequeno">Pendientes abiertos; en rojo, quien tiene atrasados.</p><div class="doble">${carga.length ? carga.map((c) => `<div class="doble__linea"><span>${esc(c.persona)}</span><div class="avance"><span class="avance__barra${c.atrasados ? '' : ' avance__barra--real'}" style="width:${Math.round(c.n / max * 100)}%${c.atrasados ? ';background:var(--grave)' : ''}"></span></div><span class="doble__num">${c.n}</span></div>`).join('') : '<p class="tenue">Nadie tiene pendientes abiertos.</p>'}</div><p style="margin:.75rem 0 0"><a class="enlace-flecha" href="18-pendientes.html">Ver detalle <span data-icono="flecha"></span></a></p></section>
        <section class="tarjeta seccion"><h2>Planos esta semana</h2><ul class="actividad"><li><strong>${sem.emisiones}</strong> ${sem.emisiones === 1 ? 'emisión registrada' : 'emisiones registradas'}</li><li><strong>${sem.porResponder}</strong> ${sem.porResponder === 1 ? 'entrega espera respuesta de la institución' : 'entregas esperan respuesta de la institución'}</li><li><strong>${sem.anulados}</strong> ${sem.anulados === 1 ? 'plano anulado' : 'planos anulados'}</li></ul></section>
      </aside></div>`;
    r.querySelectorAll('[data-aviso]').forEach((c) => c.addEventListener('change', () => { db().alternarAviso(c.dataset.aviso, c.checked, quien()); GRU.aviso(c.checked ? 'Aviso activado.' : 'Aviso desactivado.', 'ok'); }));
    pintarIconos();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (v === 'tablero') return tablero();
    if (v === 'cronologia' && db().proyectos().length) cronologia();
  });
})();
