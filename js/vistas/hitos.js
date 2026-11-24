/* vistas/hitos.js · Pantallas 14 (lista de hitos), 15 (agregar hitos), 16 (hito: pasos, notas, ficha y cierre) y 17 (cronograma), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, q, COD, PROY, quien, esGerencia, enlace, fechaLarga, raiz, cabeceraProyecto, volverA, pintarIconos, huella, elegirArchivo, dialogo } = GRU.vista;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const partes = (iso) => iso.split('-').map(Number);
  const corta = (iso) => { if (!iso) return '—'; const [, m, d] = partes(iso); return d + ' ' + MES[m - 1]; };
  const rango = (a, b) => {
    if (!a || !b) return '—';
    if (a === b) return corta(a);
    const [, ma, da] = partes(a), [, mb, db2] = partes(b);
    return ma === mb ? da + ' – ' + db2 + ' ' + MES[ma - 1] : corta(a) + ' – ' + corta(b);
  };
  const puedeVerificar = () => GRU.estado.rol !== 'equipo';
  const nombreFase = (n) => n + '. ' + db().FASES[n - 1];
  const hitoPedido = () => db().hito(COD, q.get('h') || '04.02') || db().hitos(COD)[0];
  const abrir = (h) => enlace('16-hito.html', '&h=' + encodeURIComponent(h.cat));
  const chipEstado = (e) => `<span class="chip ${{ Terminado: 'chip--ok', Liquidado: 'chip--ok', Contratado: 'chip--acento', Adjudicado: 'chip--acento', 'Pendiente de cotizar': 'chip--alerta' }[e] || ''}">${esc(e.toUpperCase())}</span>`;
  const chipAlerta = (a) => a ? `<span class="chip ${a === 'ATRASADO' ? 'chip--grave' : 'chip--alerta'}">${a}</span>` : '<span class="tenue">—</span>';
  const barra = (pct) => `<span class="avance-celda"><span class="avance"><span class="avance__barra avance__barra--real" style="width:${pct}%"></span></span><span class="doble__num">${pct}%</span></span>`;
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

  /* ======================= 14 · Lista de hitos ======================= */
  function lista() {
    const r = raiz(), p = PROY();
    const f = { q: '', fase: '', estado: '', resp: '', mostrar: 'todos' };
    const terminado = p.estado === 'terminado';
    r.innerHTML = cabeceraProyecto('14-hitos.html') + `
    <div class="seccion__cabecera">
      <div class="vista-cambio" role="group" aria-label="Vista"><a class="pill" aria-current="true" href="${enlace('14-hitos.html')}">Lista</a><a class="pill" href="${enlace('17-cronograma.html')}">Cronograma</a></div>
      <div class="seccion__acciones">${terminado ? '' : `<a class="btn btn--primario" href="${enlace('15-hitos-agregar.html')}">Agregar hitos</a>`}</div>
    </div>
    <section class="tarjeta vacio" id="sin-hitos" hidden><h2>Este proyecto aún no tiene hitos</h2><p class="tenue">Elige del catálogo base los que apliquen, uno por uno. Un proyecto puede empezar a mitad del camino.</p><a class="btn btn--primario" href="${enlace('15-hitos-agregar.html')}">Agregar hitos</a></section>
    <div id="con-hitos">
      <div class="cifras cifras--cuatro" id="cifras"></div>
      <div class="filtros-fila">
        <label class="campo"><span class="campo__etiqueta">Buscar</span><input class="campo__entrada" type="search" id="f-q" placeholder="Hito o contratista"></label>
        <label class="campo"><span class="campo__etiqueta">Fase</span><select class="campo__entrada" id="f-fase"><option value="">Todas</option>${db().FASES.map((n, i) => `<option value="${i + 1}">${i + 1}. ${esc(n)}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Estado</span><select class="campo__entrada" id="f-estado"><option value="">Todos</option>${db().ESTADOS_HITO.map((e) => `<option>${e}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Responsable</span><select class="campo__entrada" id="f-resp"><option value="">Todos</option>${db().responsables().concat(['Sin asignar']).map((e) => `<option>${e}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Mostrar</span><select class="campo__entrada" id="f-mostrar"><option value="todos">Todos los hitos</option><option value="alerta">Solo con alerta</option><option value="activos">Ocultar terminados</option></select></label>
      </div>
      <div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>N.º</th><th>Hito</th><th>Estado</th><th>Contratista</th><th>Responsable</th><th>Fecha contratada</th><th>Fin previsto</th><th>Avance</th><th>Alerta</th></tr></thead><tbody id="filas"></tbody></table></div>
      <p class="tenue pequeno" id="pie-tabla"></p>
    </div>`;
    const avisoPrevio = sessionStorage.getItem('gru-aviso-hitos');
    if (avisoPrevio) { sessionStorage.removeItem('gru-aviso-hitos'); GRU.aviso(avisoPrevio, 'ok'); }

    function cifras() {
      const s = db().resumenHitos(COD), hs = db().hitos(COD);
      const pend = hs.filter((h) => db().alerta(h) === 'POR VENCER').length;
      document.getElementById('cifras').innerHTML = `
        <div class="cifra"><span class="cifra__numero">${s.real}%</span><span class="cifra__texto">avance real · programado ${s.prog}%</span></div>
        <div class="cifra"><span class="cifra__numero">${s.n}</span><span class="cifra__texto">hitos · ${s.terminados} terminados</span></div>
        <div class="cifra ${s.atrasados ? 'cifra--grave' : ''}"><span class="cifra__numero">${s.atrasados}</span><span class="cifra__texto">${s.atrasados === 1 ? 'atrasado' : 'atrasados'}</span></div>
        <div class="cifra ${pend ? 'cifra--alerta' : ''}"><span class="cifra__numero">${pend}</span><span class="cifra__texto">por contratar en los próximos 15 días</span></div>`;
    }
    function filtrados() {
      const t = f.q.trim().toLowerCase();
      return db().hitos(COD).filter((h) => (!t || (h.nombre + ' ' + h.contratista + ' ' + h.cat).toLowerCase().includes(t))
        && (!f.fase || h.fase === +f.fase) && (!f.estado || h.estado === f.estado) && (!f.resp || h.resp === f.resp)
        && (f.mostrar === 'todos' || (f.mostrar === 'alerta' ? !!db().alerta(h) : !db().cerrado(h))));
    }
    function pintar() {
      const todos = db().hitos(COD);
      document.getElementById('sin-hitos').hidden = todos.length > 0;
      document.getElementById('con-hitos').hidden = todos.length === 0;
      if (!todos.length) return;
      cifras();
      const vis = filtrados(), filas = [];
      let fase = 0;
      vis.forEach((h) => {
        if (h.fase !== fase) {
          fase = h.fase;
          const de = vis.filter((x) => x.fase === fase);
          const prom = Math.round(de.reduce((a, x) => a + db().avanceHito(x), 0) / de.length);
          filas.push(`<tr class="fila-fase"><td colspan="9">${esc(nombreFase(fase))} <span class="tenue">· ${plural(de.length, 'hito', 'hitos')} · ${prom}%</span></td></tr>`);
        }
        const a = db().alerta(h), fc = db().fechaContratada(h), fp = db().finPrevisto(h);
        filas.push(`<tr>
          <td data-label="N.º"><span class="num-hito">${h.cat}</span></td>
          <td data-label="Hito"><a class="fila__titulo" href="${abrir(h)}">${esc(h.nombre)}</a>${(h.prioridad || 'Normal') === 'Normal' ? '' : ` <span class="chip ${h.prioridad === 'Alta' ? 'chip--alerta' : ''}">PRIORIDAD ${h.prioridad.toUpperCase()}</span>`}</td>
          <td data-label="Estado">${chipEstado(h.estado)}</td>
          <td data-label="Contratista">${esc(h.contratista) || '—'}</td>
          <td data-label="Responsable">${esc(h.resp)}</td>
          <td data-label="Fecha contratada" class="nw">${fc ? fechaLarga(fc) : '<span class="tenue">Sin fechas</span>'}</td>
          <td data-label="Fin previsto" class="nw">${fp ? fechaLarga(fp) : '—'}</td>
          <td data-label="Avance">${barra(db().avanceHito(h))}</td>
          <td data-label="Alerta">${chipAlerta(a)}</td></tr>`);
      });
      document.getElementById('filas').innerHTML = filas.length ? filas.join('') : '<tr><td colspan="9" class="tenue">Ningún hito coincide con estos filtros.</td></tr>';
      document.getElementById('pie-tabla').textContent = `Se muestran ${vis.length} de ${todos.length} hitos. El avance sale de los pasos hechos; la fecha contratada y el fin previsto se calculan desde los pasos.`;
      pintarIconos();
    }
    [['f-q', 'q', 'input'], ['f-fase', 'fase', 'change'], ['f-estado', 'estado', 'change'], ['f-resp', 'resp', 'change'], ['f-mostrar', 'mostrar', 'change']].forEach(([id, k, ev]) => document.getElementById(id).addEventListener(ev, (e) => { f[k] = e.target.value; pintar(); }));
    pintar();
  }

  /* ======================= 15 · Agregar hitos ======================= */
  function agregar() {
    const r = raiz();
    const marcados = new Set();
    let buscar = '';
    r.className = 'pagina pagina--angosta';
    r.innerHTML = volverA(COD + ' · Hitos', enlace('14-hitos.html')) + `
    <div class="pagina__titulo"><h1 class="titulo-seccion">Agregar <em>hitos</em></h1></div>
    <form class="tarjeta formulario" id="f" novalidate>
      <p class="tenue">Marca los hitos del catálogo base que aplican a este proyecto. Cada uno nace con sus ${10} pasos tipo, que luego puedes ajustar.</p>
      <label class="campo"><span class="campo__etiqueta">Buscar en el catálogo</span><input class="campo__entrada" type="search" id="buscar" placeholder="Nombre del hito"></label>
      <div class="lista-ref" id="catalogo"></div>
      <p class="tenue pequeno">El catálogo (${db().CATALOGO.length} hitos) es un borrador que la oficina debe aprobar.</p>
      <div class="vista-previa" id="previa" aria-live="polite"></div>
      <p class="bloqueo"><span data-icono="candado"></span> ¿Falta un hito en el catálogo? Lo agrega Gerencia desde Catálogos.</p>
      <div class="acciones"><a class="btn" href="${enlace('14-hitos.html')}">Cancelar</a><button class="btn btn--primario" type="submit" id="enviar">Agregar hitos</button></div>
    </form>`;
    function pintar() {
      const t = buscar.trim().toLowerCase();
      let html = '';
      db().FASES.forEach((_, i) => {
        const fase = i + 1;
        const cat = db().CATALOGO.filter((c) => c.fase === fase && (!t || c.nombre.toLowerCase().includes(t)));
        if (!cat.length) return;
        html += `<h3>${esc(nombreFase(fase))}</h3>` + cat.map((c) => {
          const ya = !!db().hito(COD, c.cat);
          return `<label class="casilla casilla--texto${ya ? ' ya-esta' : ''}"><input type="checkbox" data-cat="${c.cat}"${ya ? ' checked disabled' : marcados.has(c.cat) ? ' checked' : ''}><span class="casilla__marca"></span>${esc(c.nombre)}${ya ? ' · ya está' : ''}</label>`;
        }).join('');
      });
      document.getElementById('catalogo').innerHTML = html || '<p class="tenue">Ningún hito del catálogo coincide con la búsqueda.</p>';
      resumen();
    }
    function resumen() {
      const n = marcados.size, nombres = [...marcados].map((c) => db().CATALOGO.find((x) => x.cat === c).nombre);
      document.getElementById('previa').innerHTML = n
        ? `<span class="etiqueta">${plural(n, 'hito nuevo', 'hitos nuevos')}</span><span class="vista-previa__valor">${nombres.map(esc).join(' · ')}</span><span class="tenue pequeno">Entrarán como «Pendiente de cotizar», sin fechas. Todos los hitos pesan igual.</span>`
        : '<span class="tenue">Aún no marcaste ningún hito.</span>';
      const b = document.getElementById('enviar'); b.disabled = !n; b.textContent = n ? 'Agregar ' + plural(n, 'hito', 'hitos') : 'Agregar hitos';
    }
    document.getElementById('buscar').addEventListener('input', (e) => { buscar = e.target.value; pintar(); });
    document.getElementById('catalogo').addEventListener('change', (e) => { const c = e.target.dataset.cat; if (!c) return; e.target.checked ? marcados.add(c) : marcados.delete(c); resumen(); });
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault(); if (!marcados.size) return;
      const nuevos = db().agregarHitos(COD, [...marcados], quien());
      sessionStorage.setItem('gru-aviso-hitos', plural(nuevos.length, 'hito agregado', 'hitos agregados') + '. Entraron sin fechas: ábrelos para programar sus pasos.');
      location.href = enlace('14-hitos.html');
    });
    pintar(); pintarIconos();
  }

  /* ======================= 16 · Hito ======================= */
  function hito() {
    const r = raiz(), h = hitoPedido();
    if (!h) { r.innerHTML = '<section class="tarjeta vacio"><h1>Este proyecto aún no tiene hitos</h1><p><a class="btn" href="' + enlace('15-hitos-agregar.html') + '">Agregar hitos</a></p></section>'; return; }
    let intento = null, faltas = [], escribiendoNota = false;
    const cerrado = () => db().cerrado(h);
    const persona = (n) => esc(n);

    function textoAvance() {
      const hechos = db().hechos(h), n = h.pasos.length, pend = h.pasos.filter((p) => !p.hecho);
      if (cerrado()) {
        if (h.excepcion) return `Terminado con excepción el ${fechaLarga(h.excepcion.fecha)}: «${esc(h.excepcion.motivo)}». Quedaron ${plural(pend.length, 'paso', 'pasos')} sin marcar.`;
        const ultimo = h.pasos.map((p) => p.real).filter(Boolean).sort().pop(), prev = db().finPrevisto(h);
        if (!ultimo) return `${hechos} de ${n} pasos hechos.`;
        const d = prev ? db().difDias(ultimo, prev) : 0;
        return `${hechos} de ${n} pasos hechos. Terminó el ${fechaLarga(ultimo)}${d > 0 ? ', ' + plural(d, 'día', 'días') + ' antes de lo previsto' : d < 0 ? ', ' + plural(-d, 'día', 'días') + ' después de lo previsto' : ', en la fecha prevista'}.`;
      }
      return `${hechos} de ${n} pasos hechos. ${pend.length === 1 ? 'Falta «' + esc(pend[0].nombre) + '». ' : ''}El avance se calcula solo: nadie lo escribe.`;
    }
    function avisoPaso(p) {
      if (p.hecho) { const d = p.real && p.fin ? db().difDias(p.fin, p.real) : 0; return d > 0 ? `<span class="tenue pequeno">${plural(d, 'día tarde', 'días tarde')}</span>` : ''; }
      if (p.fin && p.fin < db().HOY) return `<span class="chip chip--grave">ATRASADO ${plural(db().difDias(p.fin, db().HOY), 'DÍA', 'DÍAS')}</span>`;
      if (p.dep) { const d = h.pasos.find((x) => x.n === p.dep); if (d && !d.hecho) return `<span class="tenue pequeno">Depende del ${p.dep}</span>`; }
      return '';
    }
    function filaPaso(p) {
      const atras = !p.hecho && p.fin && p.fin < db().HOY;
      return `<tr class="${p.hecho ? 'fila--hecha' : atras ? 'fila--atrasada' : ''}">
        <td data-label="Hecho"><label class="casilla"><input type="checkbox" data-paso="${p.n}" ${p.hecho ? 'checked' : ''} ${cerrado() ? 'disabled' : ''} aria-label="Paso ${p.n} hecho"><span class="casilla__marca"></span></label></td>
        <td data-label="Paso">${cerrado() ? p.n + '. ' + esc(p.nombre) : `<button class="enlace" type="button" data-editar="${p.n}">${p.n}. ${esc(p.nombre)}</button>`}</td>
        <td data-label="Encargado">${esc(p.enc)}</td>
        <td data-label="Programado" class="nw">${rango(p.ini, p.fin)}</td>
        <td data-label="Real" class="nw">${p.real ? corta(p.real) : '—'}</td>
        <td data-label="">${avisoPaso(p)}</td></tr>`;
    }

    function pintar() {
      const p = PROY(), fc = db().fechaContratada(h), fp = db().finPrevisto(h), pct = db().avanceHito(h);
      const sinFechas = !db().tieneFechas(h), pendientes = h.pasos.filter((x) => !x.hecho);
      r.innerHTML = volverA(COD + ' · Hitos', enlace('14-hitos.html')) + `
      <div class="proyecto-cab"><div><span class="proyecto-cab__codigo">${h.cat} · ${esc(db().FASES[h.fase - 1])}</span><h1>${esc(h.nombre)}</h1>
        <p class="proyecto-cab__meta tenue">Responsable: ${esc(h.resp)} · Fecha contratada: ${fc ? fechaLarga(fc) : 'sin fechas'} · Fin previsto: ${fp ? fechaLarga(fp) : 'sin fechas'}</p></div>${chipEstado(h.estado)}</div>
      <div class="rejilla"><div>
        <section class="tarjeta seccion">
          <div class="seccion__cabecera"><h2>Pasos</h2>${cerrado() ? '' : '<button class="btn btn--chico" type="button" id="agregar-paso">Agregar paso</button>'}</div>
          <div class="hito-avance"><div class="avance"><span class="avance__barra avance__barra--real" style="width:${pct}%"></span></div><span class="hito-avance__num">${pct}%</span></div>
          <p class="tenue pequeno">${textoAvance()}</p>
          ${sinFechas && !cerrado() ? `<div class="aviso aviso--alerta"><h3>Este hito todavía no tiene fechas</h3><p>Indica el primer día de trabajo y se calculan las fechas de los ${h.pasos.length} pasos tipo. Después puedes mover cada uno.</p>
            <div class="acciones acciones--izq"><label class="campo"><span class="campo__etiqueta">Primer día</span><input class="campo__entrada" type="date" id="inicio" value="${db().HOY}"></label><button class="btn btn--chico btn--primario" type="button" id="programar">Calcular fechas</button></div></div>` : ''}
          <div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Hecho</th><th>Paso</th><th>Encargado</th><th>Programado</th><th>Real</th><th><span class="solo-lector">Aviso</span></th></tr></thead><tbody>${h.pasos.map(filaPaso).join('')}</tbody></table></div>
          ${cerrado() ? '' : '<p class="tenue pequeno">Toca el nombre de un paso para cambiar fecha o encargado. Si otros pasos dependen de él, te avisamos: avisa, no bloquea. Los 10 pasos tipo son un ejemplo: la oficina debe validarlos.</p>'}
        </section>
        ${cerrado() ? '' : `<section class="tarjeta seccion" id="avance-dia"><h2>Registrar avance del día</h2>
          <form id="form-dia"><fieldset class="grupo"><legend class="etiqueta">¿Qué pasó hoy?</legend>
            <label class="casilla casilla--texto"><input type="radio" name="tipo" value="paso" ${pendientes.length ? 'checked' : 'disabled'}><span class="casilla__marca"></span>Terminé un paso</label>
            <label class="casilla casilla--texto"><input type="radio" name="tipo" value="comentario" ${pendientes.length ? '' : 'checked'}><span class="casilla__marca"></span>Solo comentario (el avance no cambia)</label></fieldset>
            <label class="campo" id="campo-paso"><span class="campo__etiqueta">Paso terminado</span><select class="campo__entrada" id="dia-paso">${pendientes.map((x) => `<option value="${x.n}">${x.n}. ${esc(x.nombre)}</option>`).join('')}</select></label>
            <label class="campo"><span class="campo__etiqueta">Comentario <span class="tenue">(opcional si marcas un paso)</span></span><textarea class="campo__entrada" id="dia-texto" rows="2" placeholder="Qué se hizo o qué se encontró"></textarea><span class="campo__error" role="alert" id="err-dia" hidden>Escribe un comentario.</span></label>
            <div class="acciones acciones--izq"><button class="btn btn--chico btn--primario" type="submit">Guardar avance</button></div></form></section>`}
        <section class="tarjeta seccion">
          <div class="seccion__cabecera"><h2>Notas del hito</h2><button class="btn btn--chico" type="button" id="agregar-nota">Agregar nota</button></div>
          <form id="form-nota" hidden><label class="campo"><span class="campo__etiqueta">Nueva nota</span><textarea class="campo__entrada" id="texto-nota" rows="3" placeholder="Qué pasó, qué falta o qué se decidió"></textarea></label>
            <div class="acciones acciones--izq"><button class="btn btn--chico btn--primario" type="submit">Guardar nota</button><button class="btn btn--chico" type="button" id="cancelar-nota">Cancelar</button></div></form>
          ${h.notas.length ? h.notas.map((n) => `<div class="nota"><strong>${persona(n.por)}</strong>: ${esc(n.texto)}<time>${fechaLarga(n.fecha)}, ${n.hora}${n.origen ? ' · ' + esc(n.origen) : ''}</time></div>`).join('') : '<p class="tenue">Aún no hay notas.</p>'}
          <p class="bloqueo" style="margin-top:.5rem"><span data-icono="candado"></span> Las notas las ve toda la oficina. El cliente no.</p>
        </section>
        ${h.historial.length ? `<section class="tarjeta seccion"><h2>Actividad</h2><ul class="lista-simple">${h.historial.slice(0, 6).map((e) => `<li>${esc(e[0])} <span class="tenue pequeno">· ${esc(e[1])}</span></li>`).join('')}</ul></section>` : ''}
      </div>
      <aside>${ficha()}${cierre()}</aside></div>`;
      enlazar(); pintarIconos();
    }

    function ficha() {
      const opciones = cerrado() ? ['Terminado', 'Liquidado'] : db().ESTADOS_HITO;
      const sel = intento || h.estado;
      return `<section class="tarjeta seccion"><h2>Ficha del hito</h2>
        <label class="campo"><span class="campo__etiqueta">Estado</span><select class="campo__entrada" id="estado" ${intento ? 'aria-invalid="true"' : ''}>${opciones.map((e) => `<option${e === sel ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
        ${faltas.length ? `<div class="aviso aviso--grave" role="alert"><h3>No se puede pasar a ${esc(intento)}</h3>${faltas.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
        <label class="campo"><span class="campo__etiqueta">Contratista</span><input class="campo__entrada" id="contratista" autocomplete="off" placeholder="Se llena al adjudicar" value="${esc(h.contratista)}"></label>
        <label class="campo"><span class="campo__etiqueta">Responsable</span><select class="campo__entrada" id="resp">${db().responsables().concat(['Sin asignar']).map((e) => `<option${e === h.resp ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
        ${esGerencia() ? `<p class="campo__ayuda"><a class="enlace" href="21-usuarios.html">Administrar personas</a>: quien esté activa en Usuarios aparece aquí.</p>` : ''}
        <label class="campo"><span class="campo__etiqueta">Prioridad</span><select class="campo__entrada" id="prioridad">${db().PRIORIDADES.map((e) => `<option${e === (h.prioridad || 'Normal') ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
        <label class="casilla casilla--texto"><input type="checkbox" id="visible" ${h.visible ? 'checked' : ''}><span class="casilla__marca"></span>Visible para el cliente</label>
        <p class="campo__ayuda">El cliente verá el estado, las fechas y el contratista. Nunca las notas.</p>
        <div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="guardar-ficha">Guardar</button></div></section>`;
    }

    function cierre() {
      const c = h.cierre, ver = puedeVerificar();
      const fila = (clave, texto, quien2, hecho) => {
        const bloqueado = !ver || (clave === 'asbuilt' && (!c.asbuilt.adj || cerrado()));
        const sub = hecho ? `Verificó ${esc(hecho.por)} · ${fechaLarga(hecho.fecha)}` : (clave === 'asbuilt' && c.asbuilt.adj ? 'Adjunto: falta verificar · ' + esc(quien2) : (cerrado() && h.excepcion ? 'Pendiente: ' : '') + 'Verifica: ' + esc(quien2));
        return `<li><label class="casilla"><input type="checkbox" data-cierre="${clave}" ${hecho ? 'checked' : ''} ${bloqueado ? 'disabled' : ''} aria-label="${esc(texto)}"><span class="casilla__marca"></span></label><span>${esc(texto)}</span><span class="cierre__quien">${sub}</span></li>`;
      };
      const adj = c.asbuilt.adj;
      const faltasLiq = h.estado === 'Terminado' ? db().faltasCierre(h, 'Liquidado').filter((t) => /Falta verificar/.test(t)) : [];
      return `<section class="tarjeta seccion"><h2>Cierre documental</h2>
        <p class="tenue pequeno">${cerrado() ? 'Lo que se verificó al cerrar el hito.' : 'Se llena cuando el contratista termina. Sin As-Built, el hito no se puede terminar.'}</p>
        <ul class="cierre">${fila('asbuilt', 'Planos As-Built con editable final', 'Gerente de Supervisión', c.asbuilt.ver)}${fila('garantia', 'Garantía', 'Gerente de Supervisión', c.garantia)}${fila('liquidacion', 'Liquidación', 'Gerente de Presupuestos', c.liquidacion)}${fila('retencion', 'Retención', 'Gerente de Presupuestos', c.retencion)}</ul>
        ${adj ? `<p class="tenue pequeno">As-Built adjunto: <span class="mono">${esc(adj.nombre)}</span> · lo subió ${esc(adj.por)} el ${fechaLarga(adj.fecha)} · huella <span class="mono">${esc(adj.hash.slice(0, 8))}…</span></p>` : ''}
        ${ver ? '' : '<p class="bloqueo"><span data-icono="candado"></span> Cada casilla la marca el gerente de su área.</p>'}
        ${faltasLiq.length ? `<p class="bloqueo"><span data-icono="candado"></span> Para pasar a Liquidado ${faltasLiq.map((t) => t.replace('Falta verificar ', '').replace('.', '')).join(' y ').replace(/^/, 'faltan ')}.</p>` : ''}
        ${h.excepcion ? `<div class="aviso aviso--alerta"><h3>Terminado con excepción</h3><p>${esc(h.excepcion.por)} · ${fechaLarga(h.excepcion.fecha)}: «${esc(h.excepcion.motivo)}»</p></div>` : ''}
        <div class="acciones acciones--izq">
          ${cerrado() ? '' : `<button class="btn btn--chico" type="button" id="adjuntar">${adj ? 'Cambiar As-Built' : 'Adjuntar As-Built'}</button>`}
          ${!cerrado() && ver ? '<button class="btn btn--chico btn--grave" type="button" id="excepcion">Terminar con excepción</button>' : ''}
        </div>
        ${!cerrado() && ver ? '<p class="tenue pequeno">La excepción pide un motivo escrito y queda en la actividad del hito. Es una propuesta, pendiente de confirmar.</p>' : ''}</section>`;
    }

    function enlazar() {
      const por = quien();
      r.querySelectorAll('[data-paso]').forEach((c) => c.addEventListener('change', () => {
        const n = +c.dataset.paso, paso = h.pasos.find((x) => x.n === n);
        if (c.checked && paso.dep) { const d = h.pasos.find((x) => x.n === paso.dep); if (d && !d.hecho) GRU.aviso('Ojo: este paso depende del ' + paso.dep + ', que aún no está hecho. Se marcó igual.'); }
        db().marcarPaso(h, n, c.checked, por); intento = null; faltas = []; pintar();
      }));
      r.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => editarPaso(+b.dataset.editar)));
      const ap = document.getElementById('agregar-paso'); if (ap) ap.addEventListener('click', nuevoPaso);
      const pr = document.getElementById('programar'); if (pr) pr.addEventListener('click', () => { const v = document.getElementById('inicio').value; if (!v) return; db().programarHito(h, v, por); GRU.aviso('Fechas calculadas desde el ' + fechaLarga(v) + '.', 'ok'); pintar(); });
      const fd = document.getElementById('form-dia');
      if (fd) {
        const ver = () => { document.getElementById('campo-paso').hidden = fd.tipo.value !== 'paso'; }; fd.addEventListener('change', ver); ver();
        fd.addEventListener('submit', (e) => {
          e.preventDefault(); const t = document.getElementById('dia-texto').value.trim(), esPaso = fd.tipo.value === 'paso';
          if (!esPaso && !t) { document.getElementById('err-dia').hidden = false; document.getElementById('dia-texto').focus(); return; }
          if (esPaso) { const n = +document.getElementById('dia-paso').value, paso = h.pasos.find((x) => x.n === n); if (paso.dep) { const d = h.pasos.find((x) => x.n === paso.dep); if (d && !d.hecho) GRU.aviso('Ojo: este paso depende del ' + paso.dep + ', que aún no está hecho. Se marcó igual.'); } db().marcarPaso(h, n, true, por); }
          if (t) db().agregarNota(h, t, por, 'Avance del día');
          GRU.aviso(esPaso ? 'Avance guardado. El porcentaje se recalculó.' : 'Comentario guardado. El avance no cambió.', 'ok'); pintar();
        });
      }
      const nf = document.getElementById('form-nota'), an = document.getElementById('agregar-nota');
      an.addEventListener('click', () => { nf.hidden = !nf.hidden; if (!nf.hidden) document.getElementById('texto-nota').focus(); });
      document.getElementById('cancelar-nota').addEventListener('click', () => { nf.hidden = true; });
      nf.addEventListener('submit', (e) => { e.preventDefault(); const t = document.getElementById('texto-nota').value.trim(); if (!t) { document.getElementById('texto-nota').focus(); return; } db().agregarNota(h, t, por); GRU.aviso('Nota guardada.', 'ok'); pintar(); });
      document.getElementById('estado').addEventListener('change', (e) => {
        const nuevo = e.target.value, res = db().cambiarEstado(h, nuevo, por);
        if (res.ok) { intento = null; faltas = []; GRU.aviso('Estado: ' + nuevo + '.', 'ok'); } else { intento = nuevo; faltas = res.faltas; }
        pintar();
      });
      document.getElementById('guardar-ficha').addEventListener('click', () => {
        db().guardarFicha(h, { contratista: document.getElementById('contratista').value.trim(), resp: document.getElementById('resp').value, prioridad: document.getElementById('prioridad').value, visible: document.getElementById('visible').checked }, por);
        GRU.aviso('Ficha guardada.', 'ok'); pintar();
      });
      r.querySelectorAll('[data-cierre]').forEach((c) => c.addEventListener('change', () => { db().verificarCierre(h, c.dataset.cierre, c.checked, por); intento = null; faltas = []; pintar(); }));
      const ad = document.getElementById('adjuntar');
      if (ad) ad.addEventListener('click', () => elegirArchivo('.pdf,.dwg,.zip,application/pdf', (archivo, hx) => { db().adjuntarAsBuilt(h, { nombre: archivo.name, hash: hx || 'sin-huella' }, por); intento = null; faltas = []; GRU.aviso('As-Built adjunto. Falta que el Gerente de Supervisión lo verifique.', 'ok'); pintar(); }));
      const ex = document.getElementById('excepcion');
      if (ex) ex.addEventListener('click', () => {
        const d = dialogo('Terminar con excepción', `<p>Vas a terminar «${esc(h.nombre)}» aunque falte parte del cierre. Queda escrito quién lo hizo y por qué.</p>
          <form id="f-ex"><label class="campo"><span class="campo__etiqueta">Motivo (obligatorio)</span><textarea class="campo__entrada" id="motivo-ex" rows="3"></textarea><span class="campo__error" role="alert" id="err-ex" hidden>Escribe el motivo para poder continuar.</span></label>
          <div class="acciones"><button class="btn" type="button" id="no-ex">Cancelar</button><button class="btn btn--grave" type="submit">Terminar con excepción</button></div></form>`);
        d.caja.querySelector('#no-ex').addEventListener('click', d.cerrar);
        d.caja.querySelector('#f-ex').addEventListener('submit', (e) => {
          e.preventDefault(); const m = d.caja.querySelector('#motivo-ex').value.trim();
          if (!m) { d.caja.querySelector('#err-ex').hidden = false; d.caja.querySelector('#motivo-ex').focus(); return; }
          db().terminarConExcepcion(h, m, por); d.cerrar(); intento = null; faltas = []; GRU.aviso('Hito terminado con excepción. Quedó en la actividad.', 'ok'); pintar();
        });
      });
    }

    function nuevoPaso() {
      const d = dialogo('Agregar paso', `<form id="f-np"><label class="campo"><span class="campo__etiqueta">Nombre del paso</span><input class="campo__entrada" id="np-nombre" autocomplete="off"><span class="campo__error" role="alert" id="err-np" hidden>Escribe cómo se llama el paso.</span></label>
        <label class="campo"><span class="campo__etiqueta">Encargado</span><select class="campo__entrada" id="np-enc">${db().responsables().concat(['Diego Ortiz', 'Sin asignar']).map((e) => `<option${e === h.resp ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Termina (opcional)</span><input class="campo__entrada" type="date" id="np-fin"></label>
        <div class="acciones"><button class="btn" type="button" id="np-no">Cancelar</button><button class="btn btn--primario" type="submit">Agregar paso</button></div></form>`);
      d.caja.querySelector('#np-no').addEventListener('click', d.cerrar);
      d.caja.querySelector('#f-np').addEventListener('submit', (e) => {
        e.preventDefault(); const nombre = d.caja.querySelector('#np-nombre').value.trim();
        if (!nombre) { d.caja.querySelector('#err-np').hidden = false; d.caja.querySelector('#np-nombre').focus(); return; }
        db().agregarPaso(h, { nombre, enc: d.caja.querySelector('#np-enc').value, fin: d.caja.querySelector('#np-fin').value }, quien());
        d.cerrar(); GRU.aviso('Paso agregado al final. El avance se recalculó.', 'ok'); pintar();
      });
    }

    function editarPaso(n) {
      const paso = h.pasos.find((x) => x.n === n), por = quien();
      const personas = db().responsables().concat(['Diego Ortiz', 'Sin asignar']);
      if (!personas.includes(paso.enc)) personas.unshift(paso.enc);
      const d = dialogo(`Paso ${n}: ${esc(paso.nombre)}`, `<form id="f-ep">
        <label class="campo"><span class="campo__etiqueta">Encargado</span><select class="campo__entrada" id="ep-enc">${personas.map((e) => `<option${e === paso.enc ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
        <label class="campo"><span class="campo__etiqueta">Termina</span><input class="campo__entrada" type="date" id="ep-fin" value="${paso.fin || ''}"><span class="campo__ayuda">${paso.fin ? 'Al cambiar la fecha se mueve todo el paso, con la misma duración.' : 'Este paso aún no tiene fecha.'}</span></label>
        ${paso.dep ? `<p class="tenue pequeno">Depende del paso ${paso.dep}: ${esc(h.pasos.find((x) => x.n === paso.dep).nombre)}.</p>` : ''}
        <div class="acciones"><button class="btn" type="button" id="ep-no">Cancelar</button><button class="btn btn--primario" type="submit">Guardar</button></div></form>`);
      d.caja.querySelector('#ep-no').addEventListener('click', d.cerrar);
      d.caja.querySelector('#f-ep').addEventListener('submit', (e) => {
        e.preventDefault();
        const enc = d.caja.querySelector('#ep-enc').value, fin = d.caja.querySelector('#ep-fin').value;
        const mueve = fin && paso.fin && fin !== paso.fin, deps = mueve ? db().dependientes(h, n) : [];
        if (!deps.length) { db().moverPaso(h, n, fin, enc, false, por); d.cerrar(); GRU.aviso('Paso actualizado.', 'ok'); pintar(); return; }
        const delta = db().difDias(paso.fin, fin), fcAntes = db().fechaContratada(h);
        const toca7 = deps.includes(7) || n === 7;
        d.cerrar();
        const d2 = dialogo(`${deps.length === 1 ? '1 paso depende' : deps.length + ' pasos dependen'} de este`, `<p>Moviste «${esc(paso.nombre)}» del ${corta(paso.fin)} al ${corta(fin)} (${plural(Math.abs(delta), 'día', 'días')}). De él ${deps.length === 1 ? 'depende' : 'dependen'}:</p>
          <ul>${deps.map((x) => `<li>${x}. ${esc(h.pasos.find((y) => y.n === x).nombre)}</li>`).join('')}</ul>
          ${toca7 && fcAntes ? `<p class="tenue pequeno">Si los recorres, la fecha contratada pasa del ${corta(fcAntes)} al ${corta(db().addDias(fcAntes, delta))}.</p>` : ''}
          <div class="acciones"><button class="btn" type="button" id="solo">Mover solo este</button><button class="btn btn--primario" type="button" id="todos">Recorrer los ${deps.length}</button></div>`);
        d2.caja.querySelector('#solo').addEventListener('click', () => { db().moverPaso(h, n, fin, enc, false, por); d2.cerrar(); GRU.aviso('Se movió solo ese paso.', 'ok'); pintar(); });
        d2.caja.querySelector('#todos').addEventListener('click', () => { db().moverPaso(h, n, fin, enc, true, por); d2.cerrar(); GRU.aviso('Se recorrieron ' + deps.length + ' pasos.', 'ok'); pintar(); });
      });
    }
    pintar();
  }

  /* ======================= 17 · Cronograma ======================= */
  function cronograma() {
    const r = raiz();
    const hoy = partes(db().HOY);
    let m0 = hoy[0] * 12 + hoy[1] - 2;            /* ventana de 4 meses: empieza un mes antes del actual */
    r.innerHTML = cabeceraProyecto('14-hitos.html') + `
    <div class="seccion__cabecera">
      <div class="vista-cambio" role="group" aria-label="Vista"><a class="pill" href="${enlace('14-hitos.html')}">Lista</a><a class="pill" aria-current="true" href="${enlace('17-cronograma.html')}">Cronograma</a></div>
      <div class="seccion__acciones"><button class="btn btn--chico" type="button" id="ant" aria-label="Meses anteriores">‹ Antes</button><button class="btn btn--chico" type="button" id="sig" aria-label="Meses siguientes">Después ›</button><button class="btn btn--primario" type="button" id="pdf">Exportar PDF (A3)</button></div>
      <label class="campo campo--en-linea"><span class="campo__etiqueta">Escala</span><select class="campo__entrada" id="escala"><option value="2">2 meses</option><option value="4" selected>4 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></label>
    </div>
    <section class="tarjeta seccion" id="gantt-caja"></section>`;
    let N = 4;
    const mes = (i) => [Math.floor(i / 12), (i % 12) + 1];
    const dias = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
    function pos(iso, fin) {                       /* % dentro de la ventana; la fecha de fin cuenta hasta el final de su día */
      const [y, m, d] = partes(iso);
      const idx = y * 12 + m - m0 - 1 + (d - (fin ? 0 : 1)) / dias(y, m);
      return idx / N * 100;
    }
    const clamp = (x) => Math.max(0, Math.min(100, x));
    function pintar() {
      const caja = document.getElementById('gantt-caja'), todos = db().hitos(COD);
      if (!todos.length) { caja.innerHTML = '<div class="vacio"><h2>Este proyecto aún no tiene hitos</h2><p class="tenue">El cronograma se arma con los pasos de cada hito.</p><a class="btn btn--primario" href="' + enlace('15-hitos-agregar.html') + '">Agregar hitos</a></div>'; document.getElementById('ant').hidden = document.getElementById('sig').hidden = document.getElementById('pdf').hidden = true; return; }
      const meses = Array.from({ length: N }, (_, k) => mes(m0 + k));
      const visibles = todos.filter((h) => { const a = db().inicioPrevisto(h), b = db().finPrevisto(h); return a && b && pos(b, true) > 0 && pos(a) < 100; });
      const sinFechas = todos.filter((h) => !db().tieneFechas(h));
      const xh = pos(db().HOY), hoyDentro = xh >= 0 && xh <= 100;
      let fase = 0, filas = '';
      visibles.forEach((h) => {
        if (h.fase !== fase) { fase = h.fase; filas += `<div class="gantt__fila gantt__fila--fase"><div class="gantt__nombre">${esc(nombreFase(fase))}</div><div class="gantt__pista${hoyDentro ? '' : ' gantt__pista--sin-hoy'}" style="--hoy:${xh}%"></div></div>`; }
        const a = db().inicioPrevisto(h), b = db().finPrevisto(h), x1 = clamp(pos(a)), x2 = clamp(pos(b, true)), av = db().avanceHito(h), al = db().alerta(h), fc = db().fechaContratada(h);
        const real = db().cerrado(h) ? x2 - x1 : (x2 - x1) * av / 100;
        const xm = fc ? pos(fc) : -1;
        filas += `<div class="gantt__fila"><div class="gantt__nombre"><a href="${abrir(h)}">${esc(h.nombre)}</a><span class="tenue pequeno">${esc(h.estado)} · ${av}%${al ? ' · <span class="chip ' + (al === 'ATRASADO' ? 'chip--grave' : 'chip--alerta') + '">' + al + '</span>' : ''}</span></div>
          <div class="gantt__pista${hoyDentro ? '' : ' gantt__pista--sin-hoy'}" style="--hoy:${xh}%"><span class="gantt__barra" style="left:${x1}%;width:${x2 - x1}%"></span>${av ? `<span class="gantt__barra gantt__barra--real" style="left:${x1}%;width:${real}%"></span>` : ''}${xm >= 0 && xm <= 100 ? `<span class="gantt__marca" style="left:${xm}%" title="Fecha contratada"></span>` : ''}</div></div>`;
      });
      caja.innerHTML = `<p class="leyenda"><span>Programado</span><span class="leyenda--real">Avance real</span><span class="leyenda--marca">Fecha contratada</span>${hoyDentro ? `<span class="leyenda--hoy">Hoy, ${corta(db().HOY)}</span>` : ''}</p>
        <div class="gantt"><div class="gantt__tabla"><div class="gantt__fila gantt__fila--cab"><div class="gantt__nombre etiqueta">Hito</div><div>
          <div class="gantt__meses" style="grid-template-columns:repeat(${N},1fr)">${meses.map(([y, m]) => `<span>${N > 6 ? MES_LARGO[m - 1].slice(0, 3) : MES_LARGO[m - 1]} ${N > 6 ? String(y).slice(2) : y}</span>`).join('')}</div>
          ${N <= 4 ? `<div class="gantt__semanas" style="grid-template-columns:repeat(${N * 4},1fr)">${meses.map(() => '<span>S1</span><span>S2</span><span>S3</span><span>S4</span>').join('')}</div>` : ''}</div></div>${filas || '<div class="gantt__fila"><div class="gantt__nombre tenue">Ningún hito cae en estos ${N} meses.</div><div></div></div>'}</div></div>
        <p class="tenue pequeno" style="margin:1rem 0 0">Se muestran ${visibles.length} de ${todos.length} hitos: los que caen en estos ${N} meses. Cuando la barra azul queda antes de la línea roja y la morada no la alcanza, el hito va atrasado.${sinFechas.length ? ' Sin fechas todavía: ' + sinFechas.map((h) => esc(h.nombre)).join(', ') + '.' : ''}</p>`;
      pintarIconos();
    }
    const paso = () => (N >= 12 ? 6 : N >= 6 ? 3 : 1);
    document.getElementById('ant').addEventListener('click', () => { m0 -= paso(); pintar(); });
    document.getElementById('sig').addEventListener('click', () => { m0 += paso(); pintar(); });
    document.getElementById('escala').addEventListener('change', (e) => { N = +e.target.value; m0 = hoy[0] * 12 + hoy[1] - (N >= 6 ? 2 : 2); pintar(); });
    document.getElementById('pdf').addEventListener('click', () => GRU.aviso('En el sistema real esto descarga el cronograma en PDF tamaño A3.'));
    pintar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (!db().proyecto(COD) && db().proyectos().length === 0) { const rr = raiz(); if (rr) rr.innerHTML = '<section class="tarjeta vacio"><h1>No hay proyectos</h1><p><a class="btn" href="06-proyectos.html">Ir a Proyectos</a></p></section>'; return; }
    ({ hitos: lista, 'hitos-agregar': agregar, hito, cronograma }[v] || (() => {}))();
  });
})();
