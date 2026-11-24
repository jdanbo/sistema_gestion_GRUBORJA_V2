/* vistas/planos.js · Pantallas 10 (INDEX), 11 (nuevo plano), 12 (plano) y 13 (nueva emisión), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, q, COD, PROY, quien, esGerencia, enlace, fechaLarga, hoyIso, raiz, corto, huella, elegirArchivo, copiar, cabeceraProyecto, volverA, pintarIconos } = GRU.vista;
  /* Enlaces antiguos (#estado=sin, #estado=anulado…) y pantallas que aún no mandan ?c=: caen en un plano de ejemplo que sí existe. */
  const hashEstado = new URLSearchParams(location.hash.replace(/^#/, '')).get('estado');
  const cupPedido = () => q.get('c') || ({ sin: 'DEMOPX-MUNES-004', vacia: 'DEMOPX-MUNES-004', anulado: 'DEMOPX-MUNAR-003' }[hashEstado]) || 'DEMOPX-CONAR-001';
  const chipEstado = (e) => `<span class="chip ${{ RECIBIDO: 'chip--acento', APROBADO: 'chip--ok', VIGENTE: 'chip--ok', ANULADO: 'chip--grave', 'SIN EMISIÓN': 'chip--alerta' }[e] || ''}">${e}</span>`;
  const instNombre = (p) => p.inst === 'EXT' ? 'Externo' : db().INST[p.inst][0];
  const discNombre = (p) => p.disc === 'EXT' ? (p.externo ? p.externo.disc : 'Externo') : db().DISC[p.disc][0];

  /* ======================= 10 · INDEX ======================= */
  function indice() {
    const r = raiz();
    const planos = () => db().planos(COD);
    r.innerHTML = cabeceraProyecto('10-planos.html') + `
    <div class="seccion__cabecera"><h2>INDEX de planos</h2><div class="seccion__acciones">
      <button class="btn btn--chico" type="button" id="exportar">Exportar PDF</button><button class="btn btn--chico" type="button" id="csv">Exportar CSV</button><a class="btn btn--primario" href="${enlace('11-plano-nuevo.html')}">Nuevo plano</a></div></div>
    <section class="tarjeta vacio" id="sin-planos" hidden><h2>Este proyecto aún no tiene planos</h2><p class="tenue">Crea uno a uno, o arranca rápido marcando varios de la lista de referencia.</p>
      <div class="acciones" style="justify-content:center"><a class="btn" href="${enlace('11-plano-nuevo.html', '#estado=referencia')}">Desde la lista de referencia</a><a class="btn btn--primario" href="${enlace('11-plano-nuevo.html')}">Nuevo plano</a></div></section>
    <div id="con-planos">
      <section class="tarjeta seccion resumen-planos" id="resumen"></section>
      <div class="filtros-fila">
        <label class="campo"><span class="campo__etiqueta">Buscar</span><input class="campo__entrada" type="search" id="f-q" placeholder="CUP o título"></label>
        <label class="campo"><span class="campo__etiqueta">Institución</span><select class="campo__entrada" id="f-inst"><option value="">Todas</option>${Object.entries(db().INST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}<option value="EXT">Externo</option></select></label>
        <label class="campo"><span class="campo__etiqueta">Disciplina</span><select class="campo__entrada" id="f-disc"><option value="">Todas</option>${Object.entries(db().DISC).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Estado</span><select class="campo__entrada" id="f-est"><option value="">Todos</option><option>SIN EMISIÓN</option>${db().ESTADOS.map((e) => `<option>${e}</option>`).join('')}<option>ANULADO</option></select></label>
        <label class="campo"><span class="campo__etiqueta">Uso</span><select class="campo__entrada" id="f-uso"><option value="">Todos</option>${db().USOS.map((u) => `<option>${u}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Agrupar por</span><select class="campo__entrada" id="f-grupo"><option value="">Sin agrupar</option><option value="inst">Institución</option><option value="disc">Disciplina</option></select></label>
      </div>
      <div class="aviso" id="aviso-filtro" hidden></div>
      <div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>CUP</th><th>Título</th><th>Institución</th><th>Disciplina</th><th>Versión</th><th>Última emisión</th><th>Estado</th><th>Uso</th><th>Terminado</th></tr></thead><tbody id="filas"></tbody></table></div>
      <p class="tenue pequeno" id="cuenta"></p>
      <section class="tarjeta vacio" id="sin-resultados" hidden><h2>Ningún plano coincide</h2><p><button class="enlace" type="button" id="limpiar">Quitar filtros</button></p></section>
    </div>`;
    const $ = (id) => document.getElementById(id);
    function resumen() {
      const a = db().avance(COD);
      $('resumen').innerHTML = `<div><span class="resumen-planos__total">${a.hechos} de ${a.total}</span><br><span class="tenue">planos terminados (${a.total ? Math.round(a.hechos * 100 / a.total) : 0}%). No cuentan los ${a.anulados} anulados.</span></div>
        <div class="mini-barras">${Object.entries(a.porDisciplina).map(([k, [h, t]]) => `<div class="doble__linea"><span class="tenue">${k}</span><div class="avance"><span class="avance__barra avance__barra--real" style="width:${Math.round(h * 100 / t)}%"></span></div><span class="doble__num">${h}/${t}</span></div>`).join('')}</div>`;
    }
    let ultimaLista = [];
    function filtrar() {
      const f = { q: $('f-q').value.trim().toLowerCase(), inst: $('f-inst').value, disc: $('f-disc').value, est: $('f-est').value, uso: $('f-uso').value };
      const todos = planos();
      const lista = todos.filter((p) => {
        const u = db().ultima(p);
        return (!f.q || (p.cup + ' ' + p.titulo).toLowerCase().includes(f.q)) && (!f.inst || p.inst === f.inst) && (!f.disc || p.disc === f.disc)
          && (!f.est || db().estadoPlano(p) === f.est) && (!f.uso || (u && u.uso === f.uso));
      });
      ultimaLista = lista;
      const g = $('f-grupo').value, nombreG = (p) => g === 'inst' ? instNombre(p) : discNombre(p);
      if (g) lista.sort((a, b) => nombreG(a).localeCompare(nombreG(b), 'es') || a.cup.localeCompare(b.cup));
      let grupoActual = null;
      $('filas').innerHTML = lista.map((p) => {
        let cab = '';
        if (g && nombreG(p) !== grupoActual) { grupoActual = nombreG(p); const n = lista.filter((x) => nombreG(x) === grupoActual).length; cab = `<tr class="fila-grupo"><th colspan="9" scope="colgroup">${esc(grupoActual)} · ${n} plano${n === 1 ? '' : 's'}</th></tr>`; }
        const u = db().ultima(p), est = db().estadoPlano(p);
        return cab + `<tr>
          <td data-label="CUP"><a class="cup" href="${enlace('12-plano.html', '&c=' + p.cup)}"${p.anulado ? ' style="text-decoration:line-through"' : ''}>${p.cup}</a></td>
          <td data-label="Título">${esc(p.titulo)}</td><td data-label="Institución">${instNombre(p)}</td><td data-label="Disciplina">${discNombre(p)}</td>
          <td data-label="Versión" class="mono">${u ? 'V' + String(u.v).padStart(2, '0') : '—'}</td>
          <td data-label="Última emisión">${u ? fechaLarga(u.fecha) : '—'}</td><td data-label="Estado">${chipEstado(est)}</td>
          <td data-label="Uso"><span class="pequeno">${u ? esc(u.uso) : '—'}</span></td>
          <td data-label="Terminado"><label class="casilla"><input type="checkbox" data-cup="${p.cup}"${p.terminado ? ' checked' : ''}${p.anulado ? ' disabled' : ''} aria-label="Terminado: ${p.cup}"><span class="casilla__marca"></span></label></td></tr>`;
      }).join('');
      $('sin-resultados').hidden = !!lista.length && true; $('sin-resultados').hidden = lista.length > 0;
      $('cuenta').textContent = lista.length === todos.length ? `${todos.length} planos.` : `Se muestran ${lista.length} de ${todos.length} planos.`;
      const av = $('aviso-filtro');
      if (f.inst && f.inst !== 'EXT') {
        const entregados = lista.filter((p) => p.emisiones.length);
        const fechas = entregados.flatMap((p) => p.emisiones.map((e) => e.fecha)).sort();
        av.hidden = false;
        av.innerHTML = `<h2>${entregados.length} plano${entregados.length === 1 ? '' : 's'} entregado${entregados.length === 1 ? '' : 's'} a ${db().INST[f.inst][0]}</h2>` + (fechas.length ? `<p>${fechas.length} emisiones entre el ${fechaLarga(fechas[0])} y el ${fechaLarga(fechas[fechas.length - 1])}.</p>` : '<p>Todavía no se ha entregado ninguno.</p>');
      } else av.hidden = true;
      pintarIconos();
    }
    function pintar() {
      const hay = planos().length > 0;
      $('sin-planos').hidden = hay; $('con-planos').hidden = !hay;
      if (hay) { resumen(); filtrar(); }
    }
    ['f-q', 'f-inst', 'f-disc', 'f-est', 'f-uso', 'f-grupo'].forEach((id) => $(id).addEventListener('input', filtrar));
    $('csv').addEventListener('click', () => {
      const c = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const filas = [['CUP', 'Título', 'Institución', 'Disciplina', 'Versión', 'Última emisión', 'Estado', 'Uso', 'Terminado']].concat(ultimaLista.map((p) => { const u = db().ultima(p); return [p.cup, p.titulo, instNombre(p), discNombre(p), u ? 'V' + String(u.v).padStart(2, '0') : '', u ? u.fecha : '', db().estadoPlano(p), u ? u.uso : '', p.terminado ? 'Sí' : 'No']; }));
      const blob = new Blob(['\ufeff' + filas.map((f) => f.map(c).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'INDEX-' + COD + '.csv'; document.body.appendChild(a); a.click(); a.remove(); GRU.aviso('INDEX exportado a CSV (' + ultimaLista.length + ' planos).', 'ok');
    });
    $('limpiar').addEventListener('click', () => { ['f-q', 'f-inst', 'f-disc', 'f-est', 'f-uso', 'f-grupo'].forEach((id) => { $(id).value = ''; }); filtrar(); });
    $('exportar').addEventListener('click', () => GRU.aviso('En el sistema real esto descarga el INDEX en PDF con los planos filtrados.'));
    $('filas').addEventListener('change', (e) => { const c = e.target.closest('input[data-cup]'); if (!c) return; db().marcarTerminado(db().plano(c.dataset.cup), c.checked); resumen(); });
    pintar();
  }

  /* ======================= 11 · Nuevo plano ======================= */
  function nuevo() {
    const r = raiz();
    const hash = new URLSearchParams(location.hash.replace(/^#/, '')).get('estado');
    let modo = ['uno', 'referencia', 'copia', 'externo'].includes(hash) ? hash : 'uno';
    const origenPre = q.get('c');
    const opInst = (sel) => Object.entries(Object.assign({}, db().instActivas(), sel && db().INST[sel] ? { [sel]: db().INST[sel] } : {})).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${v[0]} (${k})</option>`).join('');
    const opDisc = Object.entries(db().discActivas()).map(([k, v]) => `<option value="${k}">${v[0]} (${k})</option>`).join('');
    const modos = [['uno', 'Un plano'], ['referencia', 'Desde la lista de referencia'], ['copia', 'Copiar un plano'], ['externo', 'De consultor externo']];
    const errorCampo = (id, msg) => `<span class="campo__error" role="alert" id="${id}" hidden>${msg}</span>`;
    function formulario() {
      if (modo === 'uno') return `<form class="tarjeta formulario" id="f" novalidate><p class="tenue">Se crea un plano por cada entrega a una institución.</p>
        <div class="formulario__dos"><label class="campo"><span class="campo__etiqueta">Institución</span><select class="campo__entrada" name="inst">${opInst()}</select></label>
        <label class="campo"><span class="campo__etiqueta">Disciplina</span><select class="campo__entrada" name="disc">${opDisc}</select></label></div>
        <label class="campo"><span class="campo__etiqueta">Título</span><input class="campo__entrada" name="titulo" autocomplete="off" placeholder="Ej. Planta de rutas de evacuación nivel 2">${errorCampo('e-titulo', 'Escribe el título del plano.')}<span class="campo__ayuda">Se puede corregir mientras el plano no tenga emisiones.</span></label>
        <div class="vista-previa"><span class="etiqueta">CUP que recibirá</span><span class="vista-previa__valor mono" id="cup">—</span><p class="bloqueo"><span data-icono="candado"></span> El CUP es permanente. La institución y la disciplina no se pueden cambiar después: si te equivocas, se crea otro plano y Gerencia anula este.</p></div>
        <div class="acciones"><a class="btn" href="${enlace('10-planos.html')}">Cancelar</a><button class="btn btn--primario" type="submit">Crear plano</button></div></form>`;
      if (modo === 'referencia') {
        const hay = (d, t) => db().planos(COD).some((p) => p.disc === d && !p.anulado && p.titulo === t);
        return `<form class="tarjeta formulario" id="f" novalidate><p class="tenue">Marca los planos tipo que necesita este proyecto. Cada uno recibe su CUP al crearse.</p>
        <label class="campo"><span class="campo__etiqueta">Institución para todos</span><select class="campo__entrada" name="inst">${opInst('MUN')}</select></label>
        <div class="lista-ref">${Object.entries(db().REFERENCIA).map(([d, ts]) => `<h3>${db().DISC[d][0]}</h3>` + ts.map((t) => hay(d, t)
          ? `<label class="casilla casilla--texto ya-esta"><input type="checkbox" checked disabled><span class="casilla__marca"></span>${esc(t)} · ya está</label>`
          : `<label class="casilla casilla--texto"><input type="checkbox" name="ref" value="${d}|${esc(t)}"><span class="casilla__marca"></span>${esc(t)}</label>`).join('')).join('')}</div>
        <div class="vista-previa"><span class="etiqueta" id="n-nuevos">Marca al menos uno</span><span class="vista-previa__valor mono" id="cups"></span></div>
        <div class="acciones"><a class="btn" href="${enlace('10-planos.html')}">Cancelar</a><button class="btn btn--primario" type="submit" id="crear" disabled>Crear planos</button></div></form>`;
      }
      if (modo === 'copia') {
        const base = db().planos(COD).filter((p) => !p.anulado && !p.externo);
        return `<form class="tarjeta formulario" id="f" novalidate><p class="tenue">Sirve para cambiar el nivel o el nombre sin escribir todo de nuevo. La copia es un plano distinto, con su propio CUP y sin emisiones.</p>
        <label class="campo"><span class="campo__etiqueta">Plano de origen</span><select class="campo__entrada" name="origen">${base.map((p) => `<option value="${p.cup}"${p.cup === origenPre ? ' selected' : ''}>${p.cup} · ${esc(p.titulo)}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Título de la copia</span><input class="campo__entrada" name="titulo" autocomplete="off">${errorCampo('e-titulo', 'Escribe el título de la copia.')}</label>
        <dl class="datos"><div><dt class="etiqueta">Institución</dt><dd id="d-inst"></dd></div><div><dt class="etiqueta">Disciplina</dt><dd id="d-disc"></dd></div></dl>
        <div class="vista-previa" style="margin-top:1rem"><span class="etiqueta">CUP que recibirá</span><span class="vista-previa__valor mono" id="cup">—</span></div>
        <div class="acciones"><a class="btn" href="${enlace('10-planos.html')}">Cancelar</a><button class="btn btn--primario" type="submit">Crear copia</button></div></form>`;
      }
      return `<form class="tarjeta formulario" id="f" novalidate><p class="tenue">Los planos de consultores conservan su nombre original: no se renombran. Se catalogan con un CUP aparte.</p>
        <label class="campo"><span class="campo__etiqueta">Nombre original del archivo</span><input class="campo__entrada mono" name="archivo" autocomplete="off" placeholder="LEVANTAMIENTO_TOPO_final_v3">${errorCampo('e-archivo', 'Escribe el nombre tal como lo entregó el consultor.')}<span class="campo__ayuda">Tal como lo entregó el consultor.</span></label>
        <div class="formulario__dos"><label class="campo"><span class="campo__etiqueta">Consultor</span><input class="campo__entrada" name="consultor" autocomplete="off">${errorCampo('e-consultor', 'Escribe quién lo entregó.')}</label>
        <label class="campo"><span class="campo__etiqueta">Disciplina</span><select class="campo__entrada" name="disc"><option>Topografía</option><option>Estructura</option><option>Eléctrica</option></select></label></div>
        <div class="vista-previa"><span class="etiqueta">CUP que recibirá</span><span class="vista-previa__valor mono">${db().siguienteCupExterno(COD)}</span><span class="tenue pequeno">Formato propuesto, pendiente de confirmar con la oficina.</span></div>
        <div class="acciones"><a class="btn" href="${enlace('10-planos.html')}">Cancelar</a><button class="btn btn--primario" type="submit">Registrar plano externo</button></div></form>`;
    }
    function pintar() {
      r.innerHTML = volverA(COD + ' · Planos', enlace('10-planos.html')) + `<div class="pagina__titulo"><h1 class="titulo-seccion">Nuevo <em>plano</em></h1></div>
      <div class="pills" role="group" aria-label="Cómo crear el plano">${modos.map(([k, t]) => `<button class="pill" type="button" data-modo="${k}" aria-pressed="${k === modo}">${t}</button>`).join('')}</div>` + formulario();
      r.className = 'pagina pagina--angosta';
      r.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; pintar(); }));
      enlazar(); pintarIconos();
    }
    function enlazar() {
      const f = document.getElementById('f'), el = f.elements;
      const mostrar = (id, ok) => { const e = document.getElementById(id); if (e) e.hidden = ok; return ok; };
      const por = quien();
      if (modo === 'uno') {
        const cup = () => { document.getElementById('cup').textContent = db().siguienteCup(COD, el.inst.value, el.disc.value); };
        el.inst.addEventListener('change', cup); el.disc.addEventListener('change', cup); cup();
        f.addEventListener('submit', (e) => { e.preventDefault(); if (!mostrar('e-titulo', el.titulo.value.trim().length > 0)) return;
          const p = db().crearPlano({ proyecto: COD, inst: el.inst.value, disc: el.disc.value, titulo: el.titulo.value.trim(), por }); location.href = enlace('12-plano.html', '&c=' + p.cup); });
      } else if (modo === 'referencia') {
        const marcados = () => [...f.querySelectorAll('input[name=ref]:checked')].map((i) => i.value.split('|'));
        const vista = () => {
          const m = marcados(), n = {}; const cups = m.map(([d]) => { const k = el.inst.value + d; n[k] = (n[k] || 0) + 1; return COD + '-' + k + '-' + String(+db().siguienteCup(COD, el.inst.value, d).slice(-3) + n[k] - 1).padStart(3, '0'); });
          document.getElementById('n-nuevos').textContent = m.length ? m.length + ' plano' + (m.length > 1 ? 's' : '') + ' nuevo' + (m.length > 1 ? 's' : '') : 'Marca al menos uno';
          document.getElementById('cups').textContent = cups.join(' · '); const b = document.getElementById('crear'); b.disabled = !m.length; b.textContent = m.length ? 'Crear ' + m.length + ' plano' + (m.length > 1 ? 's' : '') : 'Crear planos';
        };
        f.addEventListener('change', vista); vista();
        f.addEventListener('submit', (e) => { e.preventDefault(); const m = marcados(); if (!m.length) return; m.forEach(([d, t]) => db().crearPlano({ proyecto: COD, inst: el.inst.value, disc: d, titulo: t, por })); GRU.aviso(m.length + ' planos creados.', 'ok'); location.href = enlace('10-planos.html'); });
      } else if (modo === 'copia') {
        const dato = () => { const o = db().plano(el.origen.value); if (!o) return; document.getElementById('d-inst').textContent = instNombre(o); document.getElementById('d-disc').textContent = discNombre(o); document.getElementById('cup').textContent = db().siguienteCup(COD, o.inst, o.disc); };
        el.origen.addEventListener('change', dato); dato();
        f.addEventListener('submit', (e) => { e.preventDefault(); if (!mostrar('e-titulo', el.titulo.value.trim().length > 0)) return; const o = db().plano(el.origen.value);
          const p = db().crearPlano({ proyecto: COD, inst: o.inst, disc: o.disc, titulo: el.titulo.value.trim(), por }); location.href = enlace('12-plano.html', '&c=' + p.cup); });
      } else {
        f.addEventListener('submit', (e) => { e.preventDefault(); const a = mostrar('e-archivo', el.archivo.value.trim().length > 0), c = mostrar('e-consultor', el.consultor.value.trim().length > 0); if (!a || !c) return;
          const p = db().crearPlanoExterno({ proyecto: COD, archivo: el.archivo.value.trim(), consultor: el.consultor.value.trim(), disc: el.disc.value, por }); location.href = enlace('12-plano.html', '&c=' + p.cup); });
      }
    }
    pintar();
  }

  /* ======================= 12 · Plano ======================= */
  function plano() {
    const r = raiz();
    const p = db().plano(cupPedido());
    const atras = volverA(COD + ' · Planos', enlace('10-planos.html'));
    if (!p) { r.innerHTML = atras + '<section class="tarjeta vacio"><h1>No encontramos ese plano</h1><p><a class="btn" href="' + enlace('10-planos.html') + '">Volver al INDEX</a></p></section>'; return; }
    let verV = null, resultado = null, anulando = false;
    const meta = () => `${instNombre(p)} · ${discNombre(p)} · creado por ${esc(p.creadoPor)} el ${fechaLarga(p.creado)}`;
    const cupCab = (extra) => `<p class="plano-cab__cup"${extra || ''}>${p.cup} <button class="btn-icono" type="button" data-copiar="${p.cup}" aria-label="Copiar CUP"><span data-icono="copiar"></span></button></p>`;
    function pintar() {
      if (p.anulado) return anulado();
      const vivas = p.emisiones;
      if (!vivas.length) return sinEmisiones();
      conEmisiones();
    }
    function anulado() {
      const e = p.emisiones[p.emisiones.length - 1];
      r.innerHTML = atras + `<div class="proyecto-cab"><div><p class="plano-cab__cup" style="text-decoration:line-through">${p.cup}</p><h1 class="plano-cab__titulo">${esc(p.titulo)}</h1><p class="proyecto-cab__meta tenue">${meta()}</p></div><span class="chip chip--grave">ANULADO</span></div>
      <div class="aviso aviso--grave"><h2>Plano anulado el ${fechaLarga(p.anulado.fecha)}</h2><p>Lo anuló ${esc(p.anulado.quien)}. Motivo: «${esc(p.anulado.motivo)}».</p></div>
      <section class="tarjeta seccion"><p class="bloqueo"><span data-icono="candado"></span> Un plano anulado no se reactiva ni se borra, y su CUP no se reutiliza.${e ? ' Su emisión V' + String(e.v).padStart(2, '0') + ' se conserva como evidencia.' : ''}</p>
      ${e ? `<div class="archivo"><span class="etiqueta">V${String(e.v).padStart(2, '0')} · PDF</span><span><span class="archivo__nombre">${db().nombreArchivo(p, e.v, e.fecha, 'ANULADO')}</span><br><span class="hash mono">Huella SHA-256: ${corto(e.hashPdf)}</span></span></div>` : ''}</section>`;
      enlazar();
    }
    function sinEmisiones() {
      r.innerHTML = atras + `<div class="proyecto-cab"><div>${cupCab()}<h1 class="plano-cab__titulo">${esc(p.titulo)}</h1><p class="proyecto-cab__meta tenue">${meta()}</p></div><a class="btn btn--primario" href="${enlace('13-emision-nueva.html', '&c=' + p.cup)}">Nueva emisión</a></div>
      <div class="rejilla"><section class="tarjeta vacio"><h2>Este plano aún no ha salido de la oficina</h2><p class="tenue">Cuando lo envíes, registra la emisión el mismo día: quedará sellada con su huella y su nombre de archivo.</p><a class="btn btn--primario" href="${enlace('13-emision-nueva.html', '&c=' + p.cup)}">Registrar la primera emisión</a></section>
      <aside class="tarjeta seccion"><h2>Ficha del plano</h2>
        <label class="campo"><span class="campo__etiqueta">Título</span><input class="campo__entrada" id="titulo" value="${esc(p.titulo)}"><span class="campo__ayuda">Editable mientras no haya emisiones.</span></label>
        <dl class="ficha"><div><dt class="etiqueta">Institución</dt><dd>${instNombre(p)}</dd></div><div><dt class="etiqueta">Disciplina</dt><dd>${discNombre(p)}</dd></div></dl>
        <p class="bloqueo" style="margin-top:.75rem"><span data-icono="candado"></span> Institución y disciplina no se cambian: forman parte del CUP.</p>
        <div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="guardar-titulo">Guardar título</button><a class="btn btn--chico" href="${enlace('11-plano-nuevo.html', '&c=' + p.cup + '#estado=copia')}">Copiar plano</a></div></aside></div>`;
      enlazar();
    }
    function conEmisiones() {
      const e = verV || db().ultima(p) || p.emisiones[p.emisiones.length - 1];
      const num = (x) => 'V' + String(x.v).padStart(2, '0');
      const sigs = db().ESTADOS.slice(db().ESTADOS.indexOf(e.estado) + 1);
      const ext = p.externo;
      r.innerHTML = atras + `<div class="proyecto-cab"><div>${cupCab()}<h1 class="plano-cab__titulo">${esc(p.titulo)}</h1><p class="proyecto-cab__meta tenue">${meta()}</p></div><a class="btn btn--primario" href="${enlace('13-emision-nueva.html', '&c=' + p.cup)}">Nueva emisión</a></div>
      <div class="rejilla"><div><section class="tarjeta seccion">
        <div class="seccion__cabecera"><h2>Emisiones</h2><span class="tenue pequeno">${p.emisiones.length} versión${p.emisiones.length > 1 ? 'es' : ''} · se muestra la ${num(e)}</span></div>
        <ol class="versiones">${p.emisiones.map((x) => `<li class="version${x.anulada ? ' version--anulada' : ''}"${x === e ? ' aria-current="true"' : ''}><button class="enlace" type="button" data-v="${x.v}" style="all:unset;display:contents;cursor:pointer"><span class="version__num">${num(x)}</span><span class="version__fecha">${db().ddmmmyy(x.fecha)}</span>${chipEstado(x.estado)}</button></li>`).join('')}</ol>
        ${resultado === 'ok' ? `<div class="aviso aviso--ok" role="status"><div class="resultado"><span data-icono="ok"></span><div><h3>COINCIDE</h3><p>El archivo que elegiste es exactamente el PDF que se registró en la ${num(e)} el ${fechaLarga(e.fecha)}.</p></div></div></div>` : ''}
        ${resultado === 'no' ? `<div class="aviso aviso--grave" role="alert"><div class="resultado"><span data-icono="cruz"></span><div><h3>NO COINCIDE</h3><p>El archivo que elegiste no es el que se registró en la ${num(e)}: fue modificado o es otro. Avisa a Gerencia antes de enviarlo.</p></div></div></div>` : ''}
        <div class="emision__cabecera"><h3 class="emision__version">${num(e)}</h3>${chipEstado(e.estado)}<span class="emision__fecha">${fechaLarga(e.fecha)} · registró ${esc(e.quien)}</span></div>
        <dl class="emision__datos"><div><dt class="etiqueta">Uso</dt><dd>${esc(e.uso)}</dd></div><div><dt class="etiqueta">Motivo del cambio</dt><dd>${esc(e.motivo)}</dd></div></dl>
        <div class="archivo"><span class="etiqueta">PDF</span><span><span class="archivo__nombre">${ext ? esc(ext.archivo) + '.pdf' : db().nombreArchivo(p, e.v, e.fecha, e.estado)}</span><br><span class="hash mono">Huella SHA-256: ${corto(e.hashPdf)}</span></span>
          <span class="seccion__acciones"><button class="btn-icono" type="button" data-copiar="${ext ? esc(ext.archivo) + '.pdf' : db().nombreArchivo(p, e.v, e.fecha, e.estado)}" aria-label="Copiar nombre del PDF"><span data-icono="copiar"></span></button><button class="btn btn--chico" type="button" data-abrir>Abrir</button></span></div>
        ${e.hashEd ? `<div class="archivo"><span class="etiqueta">Editable</span><span><span class="archivo__nombre">${db().nombreArchivo(p, e.v, e.fecha, e.estado, 'dwg')}</span><br><span class="hash mono">Huella SHA-256: ${corto(e.hashEd)}</span></span><span class="seccion__acciones"><button class="btn btn--chico" type="button" data-abrir>Abrir</button></span></div>` : ''}
        ${e.final ? '<p class="tenue pequeno">Marcada como versión final del plano.</p>' : ''}
        <p class="bloqueo" style="margin-top:.75rem"><span data-icono="candado"></span> Emisión sellada: no se edita ni se borra. Solo puede avanzar su estado.</p>
        ${e.anulada ? '' : `<div class="emision__acciones">${sigs.length ? `<label class="emision__estado"><span class="etiqueta">Avanzar a</span><select class="campo__entrada campo__entrada--chico" id="sig">${sigs.map((s) => `<option>${s}</option>`).join('')}</select></label><button class="btn btn--chico" type="button" id="guardar-estado">Guardar estado</button>` : '<span class="tenue pequeno">Ya está en el último estado.</span>'}<button class="btn btn--chico" type="button" id="verificar">Verificar archivo</button></div>`}
        ${e.anulada ? '' : esGerencia() ? `<div class="acciones-peligro"><p class="tenue pequeno" style="margin:0 0 var(--space-3)">Si algo salió mal, se anula y se registra otra versión. No se borra.</p>${anulando ? `<label class="campo"><span class="campo__etiqueta">Motivo de la anulación</span><textarea class="campo__entrada" id="motivo" rows="2" maxlength="300"></textarea><span class="campo__error" id="e-motivo" role="alert" hidden>Escribe el motivo.</span></label><div class="acciones"><button class="btn" type="button" id="cancelar-anular">Cancelar</button><button class="btn btn--grave" type="button" id="confirmar-anular">Anular ${num(e)}</button></div>` : `<button class="btn btn--grave" type="button" id="anular">Anular emisión</button>`}</div>` : `<p class="bloqueo" style="margin-top:.75rem"><span data-icono="candado"></span> Puedes avanzar el estado porque tú creaste este plano. Anular solo lo hace Gerencia.</p>`}
      </section></div>
      <aside><section class="tarjeta seccion"><h2>Ficha del plano</h2><dl class="ficha">
        <div><dt class="etiqueta">Proyecto</dt><dd><a href="${enlace('08-proyecto.html')}">${esc(COD)} · ${esc(PROY().nombre)}</a></dd></div>
        <div><dt class="etiqueta">Institución</dt><dd>${instNombre(p)}</dd></div><div><dt class="etiqueta">Disciplina</dt><dd>${discNombre(p)}</dd></div>
        ${ext ? `<div><dt class="etiqueta">Consultor</dt><dd>${esc(ext.consultor)}</dd></div>` : ''}
        <div><dt class="etiqueta">Versión final</dt><dd class="${p.emisiones.some((x) => x.final) ? '' : 'tenue'}">${p.emisiones.some((x) => x.final) ? 'V' + String(p.emisiones.find((x) => x.final).v).padStart(2, '0') : 'Aún no se marca'}</dd></div></dl>
        <label class="casilla casilla--texto"><input type="checkbox" id="terminado"${p.terminado ? ' checked' : ''}><span class="casilla__marca"></span>Plano terminado</label>
        <p class="campo__ayuda">Es lo único que cuenta para el avance de planos.</p>
        <p class="bloqueo" style="margin-top:.75rem"><span data-icono="candado"></span> Con emisiones, el título queda sellado.</p>
        ${ext ? '' : `<div class="acciones acciones--izq"><a class="btn btn--chico" href="${enlace('11-plano-nuevo.html', '&c=' + p.cup + '#estado=copia')}">Copiar plano</a></div>`}</section>
      <section class="tarjeta seccion"><h2>Historial del plano</h2><ul class="actividad">${p.historial.length ? p.historial.slice(0, 6).map(([t, h]) => `<li>${esc(t)}<time>${esc(h)}</time></li>`).join('') : '<li>Sin movimientos todavía</li>'}</ul>
        <p style="margin:.5rem 0 0"><a class="enlace-flecha" href="24-historial.html">Ver todo <span data-icono="flecha"></span></a></p></section></aside></div>`;
      const $ = (id) => document.getElementById(id);
      r.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { verV = p.emisiones.find((x) => x.v === +b.dataset.v); resultado = null; anulando = false; pintar(); }));
      if ($('guardar-estado')) $('guardar-estado').addEventListener('click', () => { db().avanzarEstado(p, e, $('sig').value, quien()); GRU.aviso('Estado avanzado a ' + e.estado + '.', 'ok'); pintar(); });
      if ($('verificar')) $('verificar').addEventListener('click', () => elegirArchivo('.pdf', (f, h) => { resultado = h && h === e.hashPdf ? 'ok' : 'no'; pintar(); }));
      if ($('anular')) $('anular').addEventListener('click', () => { anulando = true; pintar(); $('motivo').focus(); });
      if ($('cancelar-anular')) $('cancelar-anular').addEventListener('click', () => { anulando = false; pintar(); });
      if ($('confirmar-anular')) $('confirmar-anular').addEventListener('click', () => { const m = $('motivo').value.trim(); if (!m) { $('e-motivo').hidden = false; return; } db().anularEmision(p, e, m, quien()); anulando = false; GRU.aviso('Emisión anulada. Se conserva como evidencia.', 'ok'); pintar(); });
      if ($('terminado')) $('terminado').addEventListener('change', () => db().marcarTerminado(p, $('terminado').checked));
      enlazar();
    }
    function enlazar() {
      r.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => copiar(b.dataset.copiar)));
      r.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => GRU.aviso('En el sistema real abre el archivo guardado en Drive.')));
      const g = document.getElementById('guardar-titulo');
      if (g) g.addEventListener('click', () => { const t = document.getElementById('titulo').value.trim(); if (!t) return; db().guardarTitulo(p, t); GRU.aviso('Título guardado.', 'ok'); pintar(); });
      pintarIconos();
    }
    pintar();
  }

  /* ======================= 13 · Nueva emisión ======================= */
  function emision() {
    const r = raiz();
    const p = db().plano(cupPedido());
    const atras = volverA(p ? p.cup + ' · ' + p.titulo : 'Planos', p ? enlace('12-plano.html', '&c=' + p.cup) : enlace('10-planos.html'));
    if (!p || p.anulado) { r.innerHTML = atras + '<section class="tarjeta vacio"><h1>No se puede registrar una emisión aquí</h1></section>'; return; }
    const v = p.emisiones.length + 1, num = 'V' + String(v).padStart(2, '0');
    const est = { fecha: hoyIso(), uso: 'Entrega a institución', motivo: '', pdf: null, drive: '', ed: null, final: false };
    let tocado = false;
    function faltan() {
      const f = [];
      if (!est.motivo.trim()) f.push('Motivo del cambio'); if (!est.pdf) f.push('Elegir el PDF'); if (!est.drive.trim()) f.push('Enlace de Drive del PDF');
      if (est.final && !est.ed) f.push('Elegir el editable (es versión final)');
      return f;
    }
    function lateral() {
      const nombre = db().nombreArchivo(p, v, est.fecha, 'ENVIADO'), falta = faltan();
      return `<section class="tarjeta seccion"><h2>Lo que se va a sellar</h2><dl class="ficha"><div><dt class="etiqueta">Plano</dt><dd class="mono">${p.cup}</dd></div><div><dt class="etiqueta">Versión y estado</dt><dd>${num} · ENVIADO</dd></div>
          <div><dt class="etiqueta">Nombre que debe llevar el PDF</dt><dd><span class="archivo__nombre">${nombre}</span></dd></div></dl>
          <div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="copiar-nombre"><span data-icono="copiar"></span> Copiar nombre</button></div>
          <p class="tenue pequeno" style="margin-top:.75rem">El nombre lo genera el sistema según el Manual de Nomenclatura. El CUP no va en el nombre.</p>
          <p class="bloqueo"><span data-icono="candado"></span> Al registrar, la emisión queda sellada: no se edita ni se borra. Si algo sale mal, Gerencia la anula y se registra otra versión.</p></section>
          ${falta.length ? `<section class="tarjeta seccion"><h2>Te falta</h2><ul>${falta.map((x) => `<li>${x}</li>`).join('')}</ul></section>` : ''}`;
    }
    function enlazarLateral() { const c = document.getElementById('copiar-nombre'); if (c) c.addEventListener('click', () => copiar(db().nombreArchivo(p, v, est.fecha, 'ENVIADO'))); pintarIconos(); }
    function pintar() {
      const falta = faltan();
      const arch = (a, tipo) => `<div class="archivo" style="border-top:0;padding-top:0"><span class="etiqueta">Elegido</span><span><span class="archivo__nombre">${esc(a.nombre)}</span> <span class="tenue pequeno">· ${a.mb}</span><br><span class="hash mono">Huella SHA-256: ${corto(a.hash)}</span></span><button class="btn btn--chico" type="button" data-elegir="${tipo}">Cambiar</button></div>`;
      r.className = 'pagina';
      r.innerHTML = atras + `<div class="pagina__titulo"><h1 class="titulo-seccion">Nueva <em>emisión</em></h1><span class="chip chip--acento">SERÁ LA ${num}</span></div>
      <div class="rejilla"><form class="tarjeta formulario numerado" id="f" novalidate>
        <fieldset class="grupo"><legend class="etiqueta">Cuándo y para qué sale</legend><div class="formulario__dos">
          <label class="campo"><span class="campo__etiqueta">Fecha de la emisión</span><input class="campo__entrada" type="date" name="fecha" value="${est.fecha}"></label>
          <label class="campo"><span class="campo__etiqueta">Uso</span><select class="campo__entrada" name="uso">${db().USOS.map((u) => `<option${u === est.uso ? ' selected' : ''}>${u}</option>`).join('')}</select></label></div>
          <label class="campo"><span class="campo__etiqueta">Motivo del cambio</span><textarea class="campo__entrada" name="motivo" rows="3" maxlength="300" placeholder="Qué cambió respecto a la versión anterior">${esc(est.motivo)}</textarea>${tocado && !est.motivo.trim() ? '<span class="campo__error" role="alert">Escribe el motivo.</span>' : ''}</label></fieldset>
        <fieldset class="grupo"><legend class="etiqueta">Archivo PDF</legend><p class="tenue pequeno">El archivo no se sube: tu navegador solo calcula su huella.</p>
          ${est.pdf ? arch(est.pdf, 'pdf') : '<div><button class="btn" type="button" data-elegir="pdf">Elegir PDF</button></div>'}
          <label class="campo" style="margin-top:1rem"><span class="campo__etiqueta">Enlace de Drive del PDF</span><input class="campo__entrada" type="url" name="drive" value="${esc(est.drive)}" placeholder="https://drive.google.com/…"></label></fieldset>
        <fieldset class="grupo"><legend class="etiqueta">Editable (DWG) <span class="campo__opcional">si se entrega</span></legend>
          ${est.ed ? arch(est.ed, 'ed') : '<div><button class="btn" type="button" data-elegir="ed">Elegir editable</button></div>'}
          <label class="casilla casilla--texto"><input type="checkbox" name="final"${est.final ? ' checked' : ''}><span class="casilla__marca"></span>Esta es la versión final del plano</label>
          ${est.final && !est.ed ? '<p class="campo__error" role="alert">La versión final exige el editable. Elige el DWG para continuar.</p>' : ''}</fieldset>
        <div class="acciones"><a class="btn" href="${enlace('12-plano.html', '&c=' + p.cup)}">Cancelar</a><button class="btn btn--primario" type="submit"${falta.length ? ' disabled' : ''}>Registrar emisión</button></div></form>
        <aside class="pegajoso" id="lateral">${lateral()}</aside></div>`;
      const f = document.getElementById('f');
      const leer = () => { est.fecha = f.elements.fecha.value || est.fecha; est.uso = f.elements.uso.value; est.motivo = f.elements.motivo.value; est.drive = f.elements.drive.value; est.final = f.elements.final.checked; };
      f.addEventListener('change', (e) => { if (['fecha', 'uso', 'final'].includes(e.target.name)) { leer(); tocado = true; pintar(); } });
      f.addEventListener('input', (e) => { if (e.target.name === 'motivo' || e.target.name === 'drive') { leer(); document.getElementById('lateral').innerHTML = lateral(); enlazarLateral(); actualizarSoloEstado(); } });
      r.querySelectorAll('[data-elegir]').forEach((b) => b.addEventListener('click', () => { leer(); const t = b.dataset.elegir; elegirArchivo(t === 'pdf' ? '.pdf' : '.dwg', (a, h) => { est[t] = { nombre: a.name, mb: (a.size / 1048576).toFixed(1) + ' MB', hash: h || 'sin-huella'.padEnd(64, '0') }; tocado = true; pintar(); }); }));
      enlazarLateral();
      f.addEventListener('submit', (e) => { e.preventDefault(); leer(); tocado = true; if (faltan().length) { pintar(); return; }
        const em = db().registrarEmision(p, { fecha: est.fecha, uso: est.uso, motivo: est.motivo.trim(), final: est.final, hashPdf: est.pdf.hash, hashEd: est.ed ? est.ed.hash : '', por: quien() });
        sellada(em); });
      pintarIconos();
    }
    function actualizarSoloEstado() { const btn = document.querySelector('#f button[type=submit]'); if (btn) btn.disabled = faltan().length > 0; }
    function sellada(em) {
      const nombre = db().nombreArchivo(p, em.v, em.fecha, 'ENVIADO');
      r.className = 'pagina pagina--angosta';
      r.innerHTML = atras + `<div class="pagina__titulo"><h1 class="titulo-seccion">Emisión <em>registrada</em></h1></div><section class="tarjeta"><div class="aviso aviso--ok" role="status"><div class="resultado"><span data-icono="ok"></span><div><h2>${num} quedó sellada</h2><p>Registrada hoy a tu nombre. Ya no se puede editar ni borrar.</p></div></div></div>
        <p><strong>Falta un paso tuyo:</strong> guarda el archivo en Drive con este nombre exacto.</p>
        <div class="vista-previa"><span class="etiqueta">Nombre del PDF</span><span class="vista-previa__valor mono">${nombre}</span><button class="btn btn--chico" type="button" id="cp"><span data-icono="copiar"></span> Copiar nombre</button></div>
        <div class="acciones"><a class="btn" href="${enlace('10-planos.html')}">Volver al INDEX</a><a class="btn btn--primario" href="${enlace('12-plano.html', '&c=' + p.cup)}">Ver el plano</a></div></section>`;
      document.getElementById('cp').addEventListener('click', () => copiar(nombre)); pintarIconos();
    }
    pintar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (!db().proyecto(COD) && db().proyectos().length === 0) { const rr = raiz(); if (rr) rr.innerHTML = '<section class="tarjeta vacio"><h1>No hay proyectos</h1><p><a class="btn" href="06-proyectos.html">Ir a Proyectos</a></p></section>'; return; }
    ({ planos: indice, 'plano-nuevo': nuevo, plano, 'emision-nueva': emision }[v] || (() => {}))();
  });
})();
