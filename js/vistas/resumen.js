/* vistas/resumen.js · Pantallas 8 (resumen del proyecto) y 5 (Hoy), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, COD, PROY, quien, esGerencia, enlace, fechaLarga, raiz, cabeceraProyecto, pintarIconos, dialogo } = GRU.vista;
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const corta = (iso) => { const [, m, d] = iso.split('-').map(Number); return d + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]; };
  const abrirHito = (h) => enlace('16-hito.html', '&h=' + h.cat);
  const barra = (pct, real) => `<div class="avance"><span class="avance__barra${real ? ' avance__barra--real' : ''}" style="width:${pct}%"></span></div>`;
  const linea = (txt, pct, real, num) => `<div class="doble__linea"><span class="tenue">${txt}</span>${barra(pct, real)}<span class="doble__num">${num}</span></div>`;
  const rango = (ev) => (/^Hoy/.test(ev[1]) ? 0 : /^Ayer/.test(ev[1]) ? 1 : 2);
  const eventos = (proy) => {
    const todos = db().hitos(proy).flatMap((h) => h.historial).concat(db().planos(proy).flatMap((x) => x.historial));
    return todos.map((e, i) => [e, i]).sort((a, b) => rango(a[0]) - rango(b[0]) || (rango(a[0]) === 0 ? b[0][1].localeCompare(a[0][1]) : a[1] - b[1])).map((x) => x[0]);
  };
  const chipAtraso = (txt, cls) => `<span class="chip ${cls}">${txt}</span>`;

  /* ======================= 8 · Resumen del proyecto ======================= */
  function resumen() {
    const r = raiz();
    function pintar() {
      const p = PROY(), res = db().resumenHitos(p.codigo), hs = db().hitos(p.codigo), terminado = p.estado === 'terminado', recien = !hs.length && !terminado;
      const gestor = esGerencia();
      const ficha = `<dl class="ficha"><div><dt class="etiqueta">Cliente</dt><dd>${esc(p.cliente)}</dd></div><div><dt class="etiqueta">Ubicación</dt><dd>${esc(p.municipio)}, ${esc(p.depto)}, Guatemala</dd></div>
        ${p.direccion ? `<div><dt class="etiqueta">Dirección</dt><dd>${esc(p.direccion)}</dd></div>` : ''}
        <div><dt class="etiqueta">Carpeta de Drive</dt><dd>${p.drive ? `<a class="enlace-flecha" href="${esc(p.drive)}" target="_blank" rel="noopener noreferrer"><span data-icono="enlace"></span> Abrir carpeta</a>` : '<span class="tenue">Sin enlace todavía</span>'}</dd></div>
        <div><dt class="etiqueta">Creado</dt><dd>${fechaLarga(p.creado)} · ${esc(p.creadoPor || 'Mariana Solís')}</dd></div></dl>`;
      let html = cabeceraProyecto('08-proyecto.html');
      if (recien) {
        const pl = db().planos(p.codigo).length || (p.planosBase ? p.planosBase[1] : 0);
        html += `<div class="aviso aviso--ok" role="status"><h2>Proyecto creado</h2><p>${esc(p.creadoPor || 'Mariana Solís')} creó ${esc(p.codigo)} el ${fechaLarga(p.creado)}. Ya quedó en el historial.</p></div>
        <div class="rejilla"><section class="tarjeta seccion"><h2>Primeros pasos</h2><ol class="pasos-inicio">
          <li><span><strong>Pega el enlace de la carpeta de Drive</strong><br><span class="tenue pequeno">Para que todos lleguen a los archivos de trabajo.</span></span>${p.drive ? '<span class="chip chip--ok">LISTO</span>' : '<button class="btn btn--chico" type="button" data-drive>Agregar enlace</button>'}</li>
          <li><span><strong>Elige los hitos del proyecto</strong><br><span class="tenue pequeno">Del catálogo base, uno por uno. Puedes empezar a mitad del camino.</span></span><a class="btn btn--chico" href="${enlace('15-hitos-agregar.html')}">Agregar hitos</a></li>
          <li><span><strong>Crea los primeros planos</strong><br><span class="tenue pequeno">Uno a uno o varios desde la lista de referencia.${pl ? ' Ya hay ' + pl + '.' : ''}</span></span><a class="btn btn--chico" href="${enlace('10-planos.html')}">Ir a Planos</a></li></ol></section>
        <aside class="tarjeta seccion"><h2>Ficha</h2>${ficha}</aside></div>`;
      } else {
        const falt = db().faltasProyecto(p.codigo);
        if (terminado) html += `<div class="aviso"><h2>Proyecto terminado el ${fechaLarga(p.terminadoFecha || db().HOY)}</h2><p>Lo dio por terminado ${esc(p.terminadoPor || 'Mariana Solís')}. Ya no admite hitos ni planos nuevos; todo se puede consultar.</p>
          ${gestor ? '<p><button class="btn btn--chico" type="button" id="reabrir">Reabrir proyecto</button></p>' : '<p class="bloqueo"><span data-icono="candado"></span> Solo Gerencia puede reabrirlo.</p>'}</div>`;
        const [ph, pt] = p.planos, ppct = pt ? Math.round(ph / pt * 100) : 0;
        const atencion = [];
        hs.forEach((h) => {
          const a = db().alerta(h);
          if (a === 'ATRASADO') { const x = db().pasoAtrasado(h); atencion.push({ o: 0, html: `<li class="fila">${chipAtraso('ATRASADO ' + plural(x.dias, 'DÍA', 'DÍAS'), 'chip--grave')}<span class="fila__que"><a class="fila__titulo" href="${abrirHito(h)}">${esc(h.nombre)}: ${esc(x.paso.nombre.toLowerCase())}</a><span class="fila__detalle">Hito · ${esc(h.estado)} · venció el ${corta(x.paso.fin)}</span></span><span class="fila__quien">${esc(x.paso.enc)}</span><a class="btn btn--chico" href="${abrirHito(h)}">Abrir</a></li>` }); }
          else if (a === 'POR VENCER') atencion.push({ o: 1, html: `<li class="fila">${chipAtraso('CONTRATAR ' + corta(db().fechaContratada(h)).toUpperCase(), 'chip--alerta')}<span class="fila__que"><a class="fila__titulo" href="${abrirHito(h)}">${esc(h.nombre)}</a><span class="fila__detalle">Hito · ${esc(h.estado)} · fecha contratada próxima</span></span><span class="fila__quien">${esc(h.resp)}</span><a class="btn btn--chico" href="${abrirHito(h)}">Abrir</a></li>` });
        });
        db().pendientesDef(p.codigo).forEach((d) => { const n = db().diasDef(d); if (n <= 7) atencion.push({ o: n < 0 ? 0 : 1, html: `<li class="fila">${chipAtraso(n < 0 ? 'VENCIDA ' + plural(-n, 'DÍA', 'DÍAS') : 'VENCE ' + corta(d.limite).toUpperCase(), n < 0 ? 'chip--grave' : 'chip--alerta')}<span class="fila__que"><a class="fila__titulo" href="${enlace('20-definiciones.html')}">${esc(d.titulo)}</a><span class="fila__detalle">Definición del cliente${d.afecta.length ? ' · afecta ' + plural(d.afecta.length, 'hito', 'hitos') : ''}</span></span><span class="fila__quien">Decide: ${esc(d.decide)}</span><a class="btn btn--chico" href="${enlace('20-definiciones.html')}">Abrir</a></li>` }); });
        db().planos(p.codigo).filter((x) => !x.anulado && !x.emisiones.length).slice(0, 2).forEach((x) => atencion.push({ o: 2, html: `<li class="fila"><span class="chip">SIN EMISIÓN</span><span class="fila__que"><a class="fila__titulo" href="${enlace('12-plano.html', '&c=' + x.cup)}">${esc(x.titulo)}</a><span class="fila__detalle">Plano · <span class="mono">${esc(x.cup)}</span></span></span><span class="fila__quien">${esc(x.creadoPor)}</span><a class="btn btn--chico" href="${enlace('12-plano.html', '&c=' + x.cup)}">Abrir</a></li>` }));
        atencion.sort((a, b) => a.o - b.o);
        const fases = [...new Set(hs.map((h) => h.fase))].sort((a, b) => a - b).map((f) => {
          const de = hs.filter((h) => h.fase === f), pc = Math.round(de.reduce((a, h) => a + db().avanceHito(h), 0) / de.length), atr = de.filter((h) => db().alerta(h) === 'ATRASADO').length;
          const chip = de.every((h) => db().cerrado(h)) ? '<span class="chip chip--ok">TERMINADA</span>' : atr ? `<span class="chip chip--grave">${plural(atr, 'ATRASADO', 'ATRASADOS')}</span>` : pc ? '<span class="chip">EN CURSO</span>' : '<span class="chip">SIN INICIAR</span>';
          return `<tr><td data-label="Fase">${f}. ${esc(db().FASES[f - 1])}</td><td data-label="Hitos">${de.length}</td><td data-label="Avance"><div class="doble__linea" style="grid-template-columns:1fr 3rem">${barra(pc, true)}<span class="doble__num">${pc}%</span></div></td><td data-label="Estado">${chip}</td></tr>`;
        }).join('');
        const dif = res.prog - res.real;
        const act = eventos(p.codigo).slice(0, 4);
        html += `<div class="rejilla"><div>
          <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Avance</h2><a class="enlace-flecha" href="${enlace('17-cronograma.html')}">Ver cronograma <span data-icono="flecha"></span></a></div>
            <div class="doble">${linea(terminado ? 'Programado' : 'Programado a hoy', res.prog, false, res.prog + '%')}${linea('Avance real', res.real, true, res.real + '%')}${linea('Planos', ppct, true, ph + '/' + pt)}</div>
            <p class="tenue pequeno" style="margin:1rem 0 0">${terminado ? `${res.n} hitos terminados o liquidados.` : `El avance se calcula desde los pasos hechos: ${res.n} hitos, todos pesan igual. ${dif > 0 ? 'Va ' + plural(dif, 'punto', 'puntos') + ' por debajo de lo programado.' : dif < 0 ? 'Va ' + plural(-dif, 'punto', 'puntos') + ' por encima de lo programado.' : 'Va según lo programado.'}`}</p></section>
          ${terminado ? '' : `<section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Requiere atención</h2><span class="tenue pequeno">${plural(atencion.length, 'asunto', 'asuntos')}</span></div>${atencion.length ? `<ul class="filas">${atencion.slice(0, 6).map((a) => a.html).join('')}</ul>` : '<p class="tenue">Nada urgente por ahora.</p>'}</section>`}
          <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Hitos por fase</h2><a class="enlace-flecha" href="${enlace('14-hitos.html')}">Ver hitos <span data-icono="flecha"></span></a></div>
            <div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Fase</th><th>Hitos</th><th style="width:40%">Avance real</th><th>Estado</th></tr></thead><tbody>${fases}</tbody></table></div>
            <p class="tenue pequeno" style="margin:.75rem 0 0">Se muestran las ${plural([...new Set(hs.map((h) => h.fase))].length, 'fase', 'fases')} que ya tienen hitos.</p></section>
        </div><aside>
          <section class="tarjeta seccion"><h2>Ficha</h2>${ficha}${terminado ? '' : '<div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="editar">Editar ficha</button>' + (p.drive ? '' : '<button class="btn btn--chico" type="button" data-drive>Agregar enlace</button>') + '</div>'}
            <p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> El código ${esc(p.codigo)} no se puede cambiar.</p></section>
          <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Actividad reciente</h2></div>${act.length ? `<ul class="actividad">${act.map((e) => `<li>${esc(e[0])}<time>${esc(e[1])}</time></li>`).join('')}</ul>` : '<p class="tenue">Todavía no hay actividad.</p>'}
            <p style="margin:.5rem 0 0"><a class="enlace-flecha" href="24-historial.html">Ver historial completo <span data-icono="flecha"></span></a>${gestor ? `<br><a class="enlace-flecha" href="27-cronologia.html">Generar cronología <span data-icono="flecha"></span></a>` : ''}</p></section>
          ${!terminado && gestor ? `<section class="tarjeta seccion"><h2>Cerrar el proyecto</h2><p class="tenue pequeno">Al darlo por terminado ya no admite hitos ni planos nuevos. Se puede reabrir.</p>
            ${falt.hitos || falt.planos ? `<p class="bloqueo"><span data-icono="candado"></span> Faltan ${plural(falt.hitos, 'hito', 'hitos')} por terminar y ${plural(falt.planos, 'plano', 'planos')} sin versión final.</p>` : ''}
            <div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="terminar" ${falt.hitos || falt.planos ? 'disabled' : ''}>Dar por terminado</button></div></section>` : ''}
        </aside></div>`;
      }
      r.innerHTML = html; enlazar(p); pintarIconos();
    }
    function enlazar(p) {
      r.querySelectorAll('[data-drive]').forEach((b) => b.addEventListener('click', () => {
        const d = dialogo('Enlace de la carpeta de Drive', `<form id="f-drive"><label class="campo"><span class="campo__etiqueta">Dirección de la carpeta</span><input class="campo__entrada" id="url-drive" type="url" placeholder="https://drive.google.com/…" autocomplete="off"><span class="campo__error" role="alert" id="e-drive" hidden>Pega una dirección que empiece con https://</span></label><div class="acciones"><button class="btn" type="button" id="no-drive">Cancelar</button><button class="btn btn--primario" type="submit">Guardar enlace</button></div></form>`);
        d.caja.querySelector('#no-drive').addEventListener('click', d.cerrar);
        d.caja.querySelector('#f-drive').addEventListener('submit', (e) => { e.preventDefault(); const u = d.caja.querySelector('#url-drive').value.trim(); if (!/^https:\/\//i.test(u)) { d.caja.querySelector('#e-drive').hidden = false; d.caja.querySelector('#url-drive').focus(); return; } db().guardarDrive(p.codigo, u); d.cerrar(); GRU.aviso('Enlace guardado.', 'ok'); pintar(); });
      }));
      const ed = document.getElementById('editar');
      if (ed) ed.addEventListener('click', () => {
        const d = dialogo('Editar ficha', `<form id="f-ficha"><label class="campo"><span class="campo__etiqueta">Nombre del proyecto</span><input class="campo__entrada" id="n-nombre" value="${esc(p.nombre)}" autocomplete="off"><span class="campo__error" role="alert" id="e-nombre" hidden>El proyecto necesita un nombre.</span></label>
          <label class="campo"><span class="campo__etiqueta">Dirección <span class="campo__opcional">opcional</span></span><input class="campo__entrada" id="n-dir" value="${esc(p.direccion || '')}" autocomplete="off"></label><p class="tenue pequeno">El código ${esc(p.codigo)} no se puede cambiar.</p>
          <div class="acciones"><button class="btn" type="button" id="no-f">Cancelar</button><button class="btn btn--primario" type="submit">Guardar</button></div></form>`);
        d.caja.querySelector('#no-f').addEventListener('click', d.cerrar);
        d.caja.querySelector('#f-ficha').addEventListener('submit', (e) => { e.preventDefault(); const n = d.caja.querySelector('#n-nombre').value.trim(); if (!n) { d.caja.querySelector('#e-nombre').hidden = false; d.caja.querySelector('#n-nombre').focus(); return; } db().editarFicha(p.codigo, { nombre: n, direccion: d.caja.querySelector('#n-dir').value.trim() }); d.cerrar(); GRU.aviso('Ficha guardada.', 'ok'); pintar(); });
      });
      const te = document.getElementById('terminar');
      if (te) te.addEventListener('click', () => {
        const d = dialogo('Dar por terminado', `<p>«${esc(p.nombre)}» ya no admitirá hitos ni planos nuevos. Todo se podrá consultar y Gerencia puede reabrirlo.</p><div class="acciones"><button class="btn" type="button" id="no-t">Cancelar</button><button class="btn btn--primario" type="button" id="si-t">Dar por terminado</button></div>`);
        d.caja.querySelector('#no-t').addEventListener('click', d.cerrar);
        d.caja.querySelector('#si-t').addEventListener('click', () => { db().terminarProyecto(p.codigo, quien()); d.cerrar(); GRU.aviso('Proyecto terminado.', 'ok'); pintar(); });
      });
      const re = document.getElementById('reabrir');
      if (re) re.addEventListener('click', () => { db().reabrirProyecto(p.codigo); GRU.aviso('Proyecto reabierto.', 'ok'); pintar(); });
    }
    pintar();
  }

  /* ======================= 5 · Hoy ======================= */
  function hoy() {
    const r = raiz(), gestor = esGerencia(), yo = quien();
    const activos = db().proyectos().filter((p) => p.estado === 'activo');
    const hoyTxt = (() => { const [y, m, d] = db().HOY.split('-').map(Number); const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']; const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][m - 1]; const s = dias[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; return s[0].toUpperCase() + s.slice(1) + ' ' + d + ' de ' + mes + ' de ' + y; })();
    const titulo = `<div class="pagina__titulo"><div><p class="etiqueta saludo__fecha">${hoyTxt}</p><h1 class="titulo-seccion">Hola, <em>${esc(yo)}</em></h1></div>
      ${gestor ? `<span class="seccion__acciones"><a class="btn" href="28-tablero.html">Tablero de oficina</a><a class="btn btn--primario" href="07-proyecto-nuevo.html">Nuevo proyecto</a></span>` : '<a class="btn btn--primario" href="18-pendientes.html">Ver todos mis pendientes</a>'}</div>`;
    const emisiones = (filtro) => activos.concat(db().proyectos().filter((p) => p.estado !== 'activo')).flatMap((p) => db().planos(p.codigo)).flatMap((x) => x.emisiones.filter((e) => !e.anulada && filtro(e)).map((e) => ({ x, e }))).sort((a, b) => b.e.fecha.localeCompare(a.e.fecha) || b.e.v - a.e.v).slice(0, 3);
    const chipEm = (s) => `<span class="chip ${{ RECIBIDO: 'chip--acento', APROBADO: 'chip--ok', VIGENTE: 'chip--ok' }[s] || ''}">${s}</span>`;
    const listaEm = (l, conQuien) => l.length ? `<ul class="actividad">${l.map(({ x, e }) => `<li><a class="mono" href="${enlace('12-plano.html', '&c=' + x.cup).replace('?p=' + encodeURIComponent(COD), '?p=' + x.proyecto)}">${esc(x.cup)}</a> V${String(e.v).padStart(2, '0')} ${chipEm(e.estado)}<time>${corta(e.fecha)}${conQuien ? ' · ' + esc(e.quien) : ''}</time></li>`).join('')}</ul>` : '<p class="tenue">Todavía no hay emisiones.</p>';
    const lp = (p, pag, extra) => pag + '?p=' + encodeURIComponent(p) + (extra || '');
    if (gestor) {
      const hs = activos.flatMap((p) => db().hitos(p.codigo));
      const atras = hs.filter((h) => db().alerta(h) === 'ATRASADO'), porV = hs.filter((h) => db().alerta(h) === 'POR VENCER');
      const defs = activos.flatMap((p) => db().pendientesDef(p.codigo).map((d) => ({ d, p }))), defVenc = defs.filter(({ d }) => db().diasDef(d) < 0);
      const sem = [];
      atras.forEach((h) => { const x = db().pasoAtrasado(h); sem.push({ o: 0, html: `<li class="fila">${chipAtraso('ATRASADO ' + plural(x.dias, 'DÍA', 'DÍAS'), 'chip--grave')}<span class="fila__que"><a class="fila__titulo" href="${lp(h.proyecto, '16-hito.html', '&h=' + h.cat)}">${esc(h.nombre)}: ${esc(x.paso.nombre.toLowerCase())}</a><span class="fila__detalle">Hito · <span class="mono">${h.proyecto}</span> · venció el ${corta(x.paso.fin)}</span></span><span class="fila__quien">${esc(x.paso.enc)}</span><a class="btn btn--chico" href="${lp(h.proyecto, '16-hito.html', '&h=' + h.cat)}">Abrir</a></li>` }); });
      porV.forEach((h) => sem.push({ o: 1, html: `<li class="fila">${chipAtraso('CONTRATAR ' + corta(db().fechaContratada(h)).toUpperCase(), 'chip--alerta')}<span class="fila__que"><a class="fila__titulo" href="${lp(h.proyecto, '16-hito.html', '&h=' + h.cat)}">${esc(h.nombre)}</a><span class="fila__detalle">Hito · <span class="mono">${h.proyecto}</span> · ${esc(h.estado)}</span></span><span class="fila__quien">${esc(h.resp)}</span><a class="btn btn--chico" href="${lp(h.proyecto, '16-hito.html', '&h=' + h.cat)}">Abrir</a></li>` }));
      defs.filter(({ d }) => db().diasDef(d) <= 7).forEach(({ d, p }) => { const n = db().diasDef(d); sem.push({ o: n < 0 ? 0 : 1, html: `<li class="fila">${chipAtraso(n < 0 ? 'VENCIDA ' + plural(-n, 'DÍA', 'DÍAS') : 'VENCE ' + corta(d.limite).toUpperCase(), n < 0 ? 'chip--grave' : 'chip--alerta')}<span class="fila__que"><a class="fila__titulo" href="${lp(p.codigo, '20-definiciones.html')}">${esc(d.titulo)}</a><span class="fila__detalle">Definición del cliente · <span class="mono">${p.codigo}</span></span></span><span class="fila__quien">Decide: ${esc(d.decide)}</span><a class="btn btn--chico" href="${lp(p.codigo, '20-definiciones.html')}">Abrir</a></li>` }); });
      sem.sort((a, b) => a.o - b.o);
      const prox = hs.filter((h) => !db().cerrado(h) && db().fechaContratada(h) && ['Pendiente de cotizar', 'Cotizando', 'En comparación', 'Adjudicado'].includes(h.estado) && db().fechaContratada(h) >= db().HOY).sort((a, b) => db().fechaContratada(a).localeCompare(db().fechaContratada(b))).slice(0, 4);
      const filas = activos.map((p) => { const s = db().resumenHitos(p.codigo); return `<tr><td data-label="Proyecto"><a class="fila__titulo" href="${lp(p.codigo, '08-proyecto.html')}">${esc(p.nombre)}</a><br><span class="mono pequeno tenue">${p.codigo}</span></td>
        <td data-label="Avance">${s.n ? `<div class="doble doble--compacta"><div class="doble__linea">${barra(s.prog, false)}<span class="doble__num">${s.prog}%</span></div><div class="doble__linea">${barra(s.real, true)}<span class="doble__num">${s.real}%</span></div></div>` : '<span class="tenue pequeno">Aún sin hitos</span>'}</td>
        <td data-label="Planos">${p.planos[0]} de ${p.planos[1]}</td><td data-label="Alerta">${!s.n ? '<span class="chip">NUEVO</span>' : s.atrasados ? `<span class="chip chip--grave">${plural(s.atrasados, 'ATRASADO', 'ATRASADOS')}</span>` : '<span class="chip chip--ok">AL DÍA</span>'}</td></tr>`; }).join('');
      const c = (cls, n, txt, href) => `<a class="cifra ${n ? cls : ''}" href="${href}"><span class="cifra__numero">${n}</span><span class="cifra__texto">${txt}</span><span class="cifra__ir" data-icono="flecha"></span></a>`;
      r.innerHTML = titulo + `<div class="cifras cifras--cuatro">${c('', activos.length, activos.length === 1 ? 'proyecto activo' : 'proyectos activos', '06-proyectos.html')}${c('cifra--grave', atras.length, atras.length === 1 ? 'hito atrasado' : 'hitos atrasados', '14-hitos.html')}${c('cifra--alerta', porV.length, 'por contratar en los próximos 15 días', '14-hitos.html')}${c('cifra--alerta', defVenc.length, defVenc.length === 1 ? 'definición del cliente vencida' : 'definiciones del cliente vencidas', '20-definiciones.html')}</div>
      <div class="rejilla"><div>
        <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Requiere atención esta semana</h2><span class="tenue pequeno">${plural(sem.length, 'asunto', 'asuntos')}</span></div>
          ${sem.length ? `<ul class="filas">${sem.slice(0, 6).map((s) => s.html).join('')}</ul>` : '<div class="vacio"><p><strong>Nada vence esta semana.</strong></p></div>'}</section>
        <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Proyectos activos</h2><a class="enlace-flecha" href="06-proyectos.html">Ver todos <span data-icono="flecha"></span></a></div><p class="leyenda"><span>Programado a hoy</span><span class="leyenda--real">Avance real</span></p>
          ${activos.length ? `<div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Proyecto</th><th style="width:38%">Avance de hitos</th><th>Planos</th><th>Alerta</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<p class="tenue">No hay proyectos activos.</p>'}</section>
      </div><aside>
        <section class="tarjeta seccion"><h2>Próximas contrataciones</h2>${prox.length ? `<ul class="actividad">${prox.map((h) => `<li><strong>${esc(h.nombre)}</strong> · <span class="mono">${h.proyecto}</span><time>Fecha contratada: ${corta(db().fechaContratada(h))} · ${esc(h.estado)}</time></li>`).join('')}</ul>` : '<p class="tenue">Nada por contratar pronto.</p>'}</section>
        <section class="tarjeta seccion"><h2>Últimas emisiones</h2>${listaEm(emisiones(() => true), true)}</section>
      </aside></div>`;
    } else {
      const mios = db().pendientes().filter((x) => x.persona === yo);
      const chipM = (x) => x.atraso ? '<span class="chip chip--grave">ATRASADO</span>' : x.fecha ? `<span class="chip">${corta(x.fecha).toUpperCase()}</span>` : '<span class="chip">SIN FECHA</span>';
      const items = mios.slice(0, 6).map((x) => { const h = `${x.pag}?p=${encodeURIComponent(x.proyecto)}${x.extra}`; return `<li class="fila">${chipM(x)}<span class="fila__que"><a class="fila__titulo" href="${h}">${esc(x.titulo)}</a><span class="fila__detalle">${esc(x.detalle)} · <span class="mono">${x.proyecto}</span></span></span><span class="fila__quien">${x.fecha ? corta(x.fecha) : '—'}</span><a class="btn btn--chico" href="${h}">Abrir</a></li>`; });
      const proy = activos.filter((p) => mios.some((a) => a.proyecto === p.codigo));
      const pasos = mios, planosMios = [];
      r.innerHTML = titulo + `<div class="rejilla"><div>
        <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Mis pendientes</h2><span class="tenue pequeno">${plural(mios.length, 'abierto', 'abiertos')}</span></div>
          ${items.length ? `<ul class="filas">${items.join('')}</ul>` : '<div class="vacio"><p><strong>No tienes pendientes abiertos.</strong></p><p class="tenue">Cuando te asignen un paso o un plano, aparecerá aquí.</p></div>'}</section>
        <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Proyectos donde trabajo</h2><a class="enlace-flecha" href="06-proyectos.html">Ver todos <span data-icono="flecha"></span></a></div>
          ${proy.length ? `<ul class="filas">${proy.map((p) => `<li class="fila"><span class="mono">${p.codigo}</span><span class="fila__que"><a class="fila__titulo" href="${lp(p.codigo, '08-proyecto.html')}">${esc(p.nombre)}</a><span class="fila__detalle">${plural(mios.filter((a) => a.proyecto === p.codigo).length, 'pendiente mío', 'pendientes míos')} · ${p.planos[0]} de ${p.planos[1]} planos terminados</span></span><span></span></li>`).join('')}</ul>` : '<p class="tenue">Todavía no tienes proyectos asignados.</p>'}</section>
      </div><aside><section class="tarjeta seccion"><h2>Mis últimas emisiones</h2>${listaEm(emisiones((e) => e.quien === yo), false)}</section></aside></div>`;
    }
    pintarIconos();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (v === 'hoy') return hoy();
    if (!db().proyecto(COD) && db().proyectos().length === 0) { const rr = raiz(); if (rr) rr.innerHTML = '<section class="tarjeta vacio"><h1>No hay proyectos</h1><p><a class="btn" href="06-proyectos.html">Ir a Proyectos</a></p></section>'; return; }
    if (v === 'proyecto') resumen();
  });
})();
