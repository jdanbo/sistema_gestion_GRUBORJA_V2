/* vistas/cliente.js · Pantallas 20 (definiciones del cliente), 25 (compartir), 26 (vista del cliente) y 29 (portal del cliente), alimentadas por GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, q, COD, PROY, quien, esGerencia, enlace, fechaLarga, raiz, cabeceraProyecto, pintarIconos, dialogo, copiar } = GRU.vista;
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const urlDemo = (e) => 'https://gestion.demo.test/c/' + e.token;
  const hoyHora = () => new Date().toTimeString().slice(0, 5);

  const chipDef = (d) => {
    if (d.estado === 'decidida') return '<span class="chip chip--ok">DECIDIDA</span>';
    const n = db().diasDef(d);
    if (n < 0) return `<span class="chip chip--grave">VENCIDA ${plural(-n, 'DÍA', 'DÍAS')}</span>`;
    if (n <= 3) return `<span class="chip chip--alerta">${n === 0 ? 'VENCE HOY' : 'VENCE EN ' + plural(n, 'DÍA', 'DÍAS')}</span>`;
    return '<span class="chip">PENDIENTE</span>';
  };
  const afectaTxt = (d, enlaces) => d.afecta.length ? d.afecta.map((c) => { const h = db().hito(d.proyecto, c); return h ? (enlaces ? `<a href="${enlace('16-hito.html', '&h=' + c)}">${c} ${esc(h.nombre)}</a>` : c + ' ' + esc(h.nombre)) : c; }).join(', ') : '—';
  const pillsCliente = (activa) => `<div class="vista-cambio" role="group" aria-label="Sección de cliente"><a class="pill"${activa === 20 ? ' aria-current="true"' : ''} href="${enlace('20-definiciones.html')}">Definiciones del cliente</a><a class="pill"${activa === 25 ? ' aria-current="true"' : ''} href="${enlace('25-compartir.html')}">Compartir con el cliente</a></div>`;

  /* ======================= 20 · Definiciones ======================= */
  function definiciones() {
    const r = raiz(), p = PROY();
    let abierta = location.hash === '#estado=nueva';
    function pintar() {
      const ds = db().definiciones(COD), hs = db().hitos(COD);
      r.innerHTML = cabeceraProyecto('20-definiciones.html') + `
      <div class="seccion__cabecera">${pillsCliente(20)}<button class="btn btn--primario" type="button" id="nueva">Nueva definición</button></div>
      <form class="tarjeta formulario seccion" id="f-def" novalidate ${abierta ? '' : 'hidden'}>
        <h2>Nueva definición</h2>
        <div class="formulario__dos">
          <label class="campo"><span class="campo__etiqueta">Qué debe decidir</span><input class="campo__entrada" name="titulo" autocomplete="off" placeholder="Ej. Color de la carpintería de aluminio"><span class="campo__error" role="alert" id="e-titulo" hidden>Escribe qué debe decidir el cliente.</span></label>
          <label class="campo"><span class="campo__etiqueta">Fecha límite</span><input class="campo__entrada" name="limite" type="date" value="${db().addDias(db().HOY, 10)}"><span class="campo__error" role="alert" id="e-limite" hidden>Indica hasta cuándo.</span></label>
          <label class="campo"><span class="campo__etiqueta">Quién decide</span><input class="campo__entrada" name="decide" autocomplete="off" value="${esc(p.cliente)}"></label>
          <label class="campo"><span class="campo__etiqueta">Hito que afecta</span><select class="campo__entrada" name="afecta"><option value="">Ninguno en particular</option>${hs.map((h) => `<option value="${h.cat}">${h.cat} ${esc(h.nombre)}</option>`).join('')}</select></label>
        </div>
        <label class="campo"><span class="campo__etiqueta">Detalle <span class="campo__opcional">opcional</span></span><input class="campo__entrada" name="detalle" autocomplete="off"></label>
        <div class="acciones"><button class="btn" type="button" id="cancelar">Cancelar</button><button class="btn btn--primario" type="submit">Guardar</button></div>
      </form>
      ${ds.length ? `<div class="tabla-caja"><table class="tabla"><thead><tr><th>Qué debe decidir</th><th>Afecta</th><th>Quién decide</th><th>Fecha límite</th><th>Estado</th><th>Decisión</th></tr></thead><tbody>${ds.map((d) => `<tr>
        <td data-label="Tema"><strong>${esc(d.titulo)}</strong>${d.detalle ? `<br><span class="tenue pequeno">${esc(d.detalle)}</span>` : ''}</td>
        <td data-label="Afecta">${afectaTxt(d, true)}</td><td data-label="Quién decide">${esc(d.decide)}</td><td data-label="Fecha límite" class="nw">${fechaLarga(d.limite)}</td><td data-label="Estado">${chipDef(d)}</td>
        <td data-label="Decisión">${d.estado === 'decidida' ? `${esc(d.decision.texto)}<br><span class="tenue pequeno">${fechaLarga(d.decision.fecha)} · registró ${esc(d.decision.por)}</span>` : `<button class="btn btn--chico" type="button" data-decidir="${d.id}">Registrar decisión</button>`}</td></tr>`).join('')}</tbody></table></div>
        <p class="bloqueo"><span data-icono="candado"></span> Una decisión registrada no se edita: si cambia, se registra una nueva y la anterior queda en el historial. El cliente ve estas definiciones en su vista.</p>`
      : `<section class="tarjeta vacio"><h2>No hay decisiones pendientes del cliente</h2><p class="tenue">Anota aquí lo que el cliente debe decidir y para cuándo, así queda registro de qué se pidió y qué respondió.</p></section>`}`;
      enlazar(); pintarIconos();
    }
    function enlazar() {
      const f = document.getElementById('f-def');
      document.getElementById('nueva').addEventListener('click', () => { abierta = true; f.hidden = false; f.elements.titulo.focus(); });
      document.getElementById('cancelar').addEventListener('click', () => { abierta = false; f.hidden = true; });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = f.elements.titulo.value.trim(), l = f.elements.limite.value;
        document.getElementById('e-titulo').hidden = !!t; document.getElementById('e-limite').hidden = !!l;
        if (!t) { f.elements.titulo.focus(); return; } if (!l) { f.elements.limite.focus(); return; }
        db().crearDefinicion(COD, { titulo: t, limite: l, decide: f.elements.decide.value.trim() || p.cliente, afecta: f.elements.afecta.value ? [f.elements.afecta.value] : [], detalle: f.elements.detalle.value.trim() }, quien());
        abierta = false; GRU.aviso('Definición guardada. El cliente la verá en su vista.', 'ok'); pintar();
      });
      r.querySelectorAll('[data-decidir]').forEach((b) => b.addEventListener('click', () => {
        const d0 = db().definiciones(COD).find((x) => x.id === b.dataset.decidir);
        const d = dialogo('Registrar decisión', `<p><strong>${esc(d0.titulo)}</strong></p><form id="f-dec"><label class="campo"><span class="campo__etiqueta">Qué decidió el cliente</span><textarea class="campo__entrada" id="txt-dec" rows="3"></textarea><span class="campo__error" role="alert" id="e-dec" hidden>Escribe la decisión para poder registrarla.</span><span class="campo__ayuda">Una vez registrada no se puede editar.</span></label>
          <div class="acciones"><button class="btn" type="button" id="no-dec">Cancelar</button><button class="btn btn--primario" type="submit">Registrar</button></div></form>`);
        d.caja.querySelector('#no-dec').addEventListener('click', d.cerrar);
        d.caja.querySelector('#f-dec').addEventListener('submit', (e) => {
          e.preventDefault(); const t = d.caja.querySelector('#txt-dec').value.trim();
          if (!t) { d.caja.querySelector('#e-dec').hidden = false; d.caja.querySelector('#txt-dec').focus(); return; }
          db().registrarDecision(d0.id, t, quien()); d.cerrar(); GRU.aviso('Decisión registrada.', 'ok'); pintar();
        });
      }));
    }
    pintar();
  }

  /* ======================= 25 · Compartir con el cliente ======================= */
  function compartir() {
    const r = raiz();
    let nuevo = null, dias = 7;
    function pintar() {
      const es = db().enlaces(COD);
      const base = cabeceraProyecto('20-definiciones.html') + `<div class="seccion__cabecera">${pillsCliente(25)}</div>`;
      if (!esGerencia()) { r.innerHTML = base + '<section class="tarjeta vacio"><h2>Compartir con el cliente</h2><p class="bloqueo" style="justify-content:center"><span data-icono="candado"></span> Solo Gerencia genera reportes y enlaces para el cliente.</p></section>'; pintarIconos(); return; }
      r.innerHTML = base + `
      ${nuevo ? `<div class="aviso aviso--ok" role="status"><h2>Enlace creado. Vence el ${fechaLarga(nuevo.vence)}.</h2>
        <div class="enlace-caja"><span>${esc(urlDemo(nuevo))}</span><button class="btn btn--chico" type="button" id="copiar-nuevo"><span data-icono="copiar"></span> Copiar enlace</button></div>
        <p class="tenue pequeno" style="margin-top:.5rem">Quien tenga el enlace puede ver el proyecto sin cuenta hasta que venza o lo revoques.</p></div>` : ''}
      <div class="rejilla"><div>
        <section class="tarjeta seccion"><h2>Qué ve el cliente</h2>
          <div class="dos-listas"><div class="si"><h3>Sí ve</h3><ul><li>Datos del proyecto y avance real contra lo programado</li><li>Hitos marcados como visibles, con estado, fechas y contratista</li><li>Lo que está pendiente de su decisión, con fecha límite</li><li>Planos aprobados o vigentes</li></ul></div>
          <div class="no"><h3>Nunca ve</h3><ul><li>Notas internas y minutas</li><li>Pendientes por persona</li><li>Planos de uso interno o de cotización</li><li>Nada de otros clientes</li></ul></div></div>
          <p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> El filtro se aplica en el servidor: lo que no debe ver nunca sale del sistema.</p>
          <div class="acciones acciones--izq"><a class="btn btn--chico" href="${enlace('26-vista-cliente.html', '&previa=1')}">Ver como lo verá el cliente</a></div></section>
        <section class="tarjeta seccion"><div class="seccion__cabecera"><h2>Enlaces creados</h2></div>
          ${es.length ? `<div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Creado</th><th>Por</th><th>Vence</th><th>Visitas</th><th>Estado</th><th><span class="solo-lector">Acción</span></th></tr></thead><tbody>${es.map((e) => {
            const st = db().estadoEnlace(e);
            return `<tr><td data-label="Creado">${e.creado === db().HOY && e.hora ? 'Hoy, ' + e.hora : fechaLarga(e.creado)}</td><td data-label="Por">${esc(e.por)}</td><td data-label="Vence">${fechaLarga(e.vence)}</td>
              <td data-label="Visitas">${e.visitas}${e.ultima ? ' · última: ' + fechaLarga(e.ultima).replace(/ 20\d\d$/, '') : ''}</td><td data-label="Estado"><span class="chip ${st === 'ACTIVO' ? 'chip--ok' : st === 'REVOCADO' ? 'chip--grave' : ''}">${st}</span></td>
              <td data-label="">${st === 'ACTIVO' ? `<a class="btn btn--chico" href="26-vista-cliente.html?t=${e.token}">Abrir</a> <button class="btn btn--chico" type="button" data-copiar="${e.id}">Copiar</button> <button class="btn btn--chico btn--grave" type="button" data-revocar="${e.id}">Revocar</button>` : '<span class="tenue">—</span>'}</td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="tenue">Todavía no se ha compartido este proyecto.</p>'}</section>
      </div><aside>
        <section class="tarjeta seccion"><h2>Reporte en PDF</h2><p class="tenue pequeno">Una foto del proyecto a hoy, con la marca, lista para enviar por correo.</p><button class="btn btn--bloque" type="button" id="reporte">Generar reporte</button></section>
        <section class="tarjeta seccion"><h2>Enlace que caduca</h2><p class="tenue pequeno">El cliente abre el proyecto en su navegador, sin cuenta, y siempre ve los datos al día.</p>
          <label class="campo"><span class="campo__etiqueta">Duración</span><select class="campo__entrada" id="dias"><option value="7"${dias === 7 ? ' selected' : ''}>7 días</option><option value="3"${dias === 3 ? ' selected' : ''}>3 días</option><option value="1"${dias === 1 ? ' selected' : ''}>24 horas</option></select></label>
          <button class="btn btn--primario btn--bloque" type="button" id="crear">Crear enlace</button></section>
      </aside></div>`;
      enlazar(); pintarIconos();
    }
    function enlazar() {
      document.getElementById('crear').addEventListener('click', () => { dias = +document.getElementById('dias').value; nuevo = db().crearEnlace(COD, dias, quien()); pintar(); document.querySelector('.aviso--ok').scrollIntoView({ block: 'nearest' }); });
      document.getElementById('reporte').addEventListener('click', () => GRU.aviso('En el sistema real esto genera el reporte del proyecto en PDF, con la marca de GRUBORJA.'));
      const cn = document.getElementById('copiar-nuevo'); if (cn) cn.addEventListener('click', () => copiar(urlDemo(nuevo)));
      r.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => copiar(urlDemo(db().enlaces(COD).find((e) => e.id === b.dataset.copiar)))));
      r.querySelectorAll('[data-revocar]').forEach((b) => b.addEventListener('click', () => {
        const d = dialogo('Revocar este enlace', '<p>Quien lo tenga dejará de poder ver el proyecto. No se puede deshacer: tendrías que crear otro enlace.</p><div class="acciones"><button class="btn" type="button" id="no-rev">Cancelar</button><button class="btn btn--grave" type="button" id="si-rev">Revocar enlace</button></div>');
        d.caja.querySelector('#no-rev').addEventListener('click', d.cerrar);
        d.caja.querySelector('#si-rev').addEventListener('click', () => { db().revocarEnlace(b.dataset.revocar); d.cerrar(); if (nuevo && nuevo.id === b.dataset.revocar) nuevo = null; GRU.aviso('Enlace revocado.', 'ok'); pintar(); });
      }));
    }
    pintar();
  }

  /* ======================= 26 · Vista del cliente ======================= */
  function vistaCliente() {
    const r = raiz(), token = q.get('t');
    const barraTxt = document.getElementById('vence-txt'), cuenta = document.getElementById('cuenta-link');
    let e = null, p, modo = 'previa';
    if (token) {
      modo = 'enlace'; e = db().visitar(token);
      if (!e || db().estadoEnlace(e) !== 'ACTIVO') {
        r.innerHTML = `<section class="tarjeta vacio pagina--angosta" style="margin:3rem auto"><h1 class="titulo-seccion" style="display:inline-block">Este enlace ya <em>${e && e.revocado ? 'no está disponible' : 'venció'}</em></h1>
          <p>${e && e.revocado ? 'GRUBORJA dejó de compartirlo.' : 'Por seguridad, los enlaces dejan de funcionar después de unos días.'}</p><p class="tenue">Pida uno nuevo a su contacto en GRUBORJA.</p></section>`;
        if (barraTxt) barraTxt.textContent = ''; return;
      }
      p = db().proyecto(e.proyecto); barraTxt.textContent = 'Vista compartida · vence el ' + fechaLarga(e.vence);
    } else {
      p = PROY();
      if (q.get('cuenta')) { modo = 'cuenta'; cuenta.hidden = false; } else barraTxt.textContent = 'Vista previa para Gerencia · así lo verá el cliente';
    }
    const res = db().resumenHitos(p.codigo), hs = db().hitos(p.codigo).filter((h) => h.visible);
    const defs = db().pendientesDef(p.codigo), planos = db().planosParaCliente(p.codigo);
    const estCliente = (h) => (db().cerrado(h) ? ['TERMINADO', 'chip--ok'] : h.estado === 'En ejecución' ? ['EN EJECUCIÓN', ''] : h.estado === 'Contratado' ? ['CONTRATADO', 'chip--acento'] : ['EN CONTRATACIÓN', '']);
    let fase = 0, filas = '';
    hs.forEach((h) => {
      if (h.fase !== fase) { fase = h.fase; filas += `<tr class="fila-fase"><td colspan="5">${esc(db().FASES[fase - 1])}</td></tr>`; }
      const [t, c] = estCliente(h), ini = db().fechaContratada(h), fin = db().finPrevisto(h);
      filas += `<tr><td data-label="Etapa">${esc(h.nombre)}</td><td data-label="Estado"><span class="chip ${c}">${t}</span></td><td data-label="Contratista">${esc(h.contratista) || 'Por definir'}</td><td data-label="Inicio" class="nw">${ini ? fechaLarga(ini) : 'Por definir'}</td><td data-label="Fin" class="nw">${fin ? fechaLarga(fin) : 'Por definir'}</td></tr>`;
    });
    r.innerHTML = `
      <div class="proyecto-cab"><div><p class="etiqueta saludo__fecha">${esc(p.cliente)}</p><h1 class="titulo-seccion">${esc(p.nombre)}</h1><p class="proyecto-cab__meta tenue" style="margin-top:.75rem">${esc(p.municipio)}, ${esc(p.depto)} · datos al ${fechaLarga(db().HOY)}</p></div></div>
      <div class="rejilla"><div>
        <section class="tarjeta seccion"><h2>Avance de la obra</h2>
          ${res.n ? `<div class="doble"><div class="doble__linea"><span class="tenue">Programado a hoy</span><div class="avance"><span class="avance__barra" style="width:${res.prog}%"></span></div><span class="doble__num">${res.prog}%</span></div>
          <div class="doble__linea"><span class="tenue">Avance real</span><div class="avance"><span class="avance__barra avance__barra--real" style="width:${res.real}%"></span></div><span class="doble__num">${res.real}%</span></div></div>` : '<p class="tenue">El proyecto está en preparación. Pronto verá aquí el avance.</p>'}</section>
        ${hs.length ? `<section class="tarjeta seccion"><h2>Etapas y contrataciones</h2><div class="tabla-caja"><table class="tabla tabla--compacta"><thead><tr><th>Etapa</th><th>Estado</th><th>Contratista</th><th>Inicio</th><th>Fin previsto</th></tr></thead><tbody>${filas}</tbody></table></div></section>` : ''}
      </div><aside>
        <section class="tarjeta seccion zona-riesgo" style="border-left-color:var(--alerta)"><h2>Pendiente de su decisión</h2>
          ${defs.length ? `<ul class="actividad">${defs.map((d) => `<li><strong>${esc(d.titulo)}</strong><time>Fecha límite: ${fechaLarga(d.limite)}</time> ${db().diasDef(d) < 0 ? '<span class="chip chip--grave">VENCIDA</span>' : ''}</li>`).join('')}</ul><p class="tenue pequeno" style="margin:.5rem 0 0">Para responder, escriba a su contacto en GRUBORJA.</p>` : '<p class="tenue">No tiene decisiones pendientes.</p>'}</section>
        <section class="tarjeta seccion"><h2>Planos aprobados o vigentes</h2>
          ${planos.length ? `<ul class="actividad">${planos.slice(0, 8).map(({ x, u }) => `<li>${esc(x.titulo)} <span class="chip chip--ok">${u.estado}</span><time>${esc(x.inst === 'EXT' ? 'Externo' : db().INST[x.inst][0])} · versión ${u.v} · ${fechaLarga(u.fecha)}</time></li>`).join('')}</ul>${planos.length > 8 ? `<p class="tenue pequeno" style="margin:.5rem 0 0">Y ${planos.length - 8} más.</p>` : ''}` : '<p class="tenue">Aún no hay planos aprobados.</p>'}</section>
      </aside></div>
      <p class="cliente-nota">Vista de solo lectura preparada por GRUBORJA.</p>`;
    pintarIconos();
  }

  /* ======================= 29 · Portal del cliente ======================= */
  function portal() {
    const r = raiz(), cliente = q.get('cliente') || 'Cliente Demo';
    document.getElementById('portal-nombre').textContent = cliente;
    const ps = db().proyectos().filter((p) => p.cliente === cliente);
    r.innerHTML = `<div class="pagina__titulo"><h1 class="titulo-seccion">Mis <em>proyectos</em></h1></div>
      ${ps.length ? `<ul class="proyecto-lista">${ps.map((p) => {
        const res = db().resumenHitos(p.codigo), dec = db().pendientesDef(p.codigo).length;
        return `<li><a class="tarjeta tarjeta--enlace proyecto-card" href="26-vista-cliente.html?p=${encodeURIComponent(p.codigo)}&cuenta=1"><span class="proyecto-card__nombre">${esc(p.nombre)}</span><span class="proyecto-card__meta tenue">${esc(p.municipio)}, ${esc(p.depto)}</span>
          ${res.n ? `<div class="doble proyecto-card__barras"><div class="doble__linea"><span class="tenue">Programado</span><div class="avance"><span class="avance__barra" style="width:${res.prog}%"></span></div><span class="doble__num">${res.prog}%</span></div>
          <div class="doble__linea"><span class="tenue">Avance real</span><div class="avance"><span class="avance__barra avance__barra--real" style="width:${res.real}%"></span></div><span class="doble__num">${res.real}%</span></div></div>` : '<p class="tenue pequeno proyecto-card__barras" style="margin-bottom:0">Proyecto en preparación.</p>'}
          <span class="proyecto-card__pie"><span></span>${dec ? `<span class="chip chip--alerta">${plural(dec, 'DECISIÓN PENDIENTE', 'DECISIONES PENDIENTES')}</span>` : p.estado === 'terminado' ? '<span class="chip chip--acento">TERMINADO</span>' : res.n ? '<span class="chip chip--ok">AL DÍA</span>' : '<span class="chip">NUEVO</span>'}</span></a></li>`;
      }).join('')}</ul>` : '<section class="tarjeta vacio"><h2>Todavía no tiene proyectos</h2><p class="tenue">Cuando GRUBORJA le comparta uno, aparecerá aquí.</p></section>'}`;
    pintarIconos();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    if (v === 'vista-cliente' && q.get('t')) return vistaCliente();
    if (v === 'portal') return portal();
    if (!db().proyecto(COD) && db().proyectos().length === 0) { const rr = raiz(); if (rr) rr.innerHTML = '<section class="tarjeta vacio"><h1>No hay proyectos</h1><p><a class="btn" href="06-proyectos.html">Ir a Proyectos</a></p></section>'; return; }
    ({ definiciones, compartir, 'vista-cliente': vistaCliente }[v] || (() => {}))();
  });
})();
