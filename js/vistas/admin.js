/* vistas/admin.js · Pantallas 21 (Usuarios), 22 (Persona) y 23 (Catálogos), alimentadas por GRU.db. Solo Gerencia y Soporte técnico. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const { db, esc, q, quien, fechaLarga, raiz, pintarIconos, dialogo } = GRU.vista;
  const rol = () => GRU.estado.rol, NOMBRE_ROL = () => GRU.datos.nombreRol;
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const opciones = (lista, sel) => lista.map((x) => `<option${x === sel ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const volver = (txt, href) => `<p class="pagina__atras"><a class="enlace-flecha enlace-flecha--atras" href="${href}"><span data-icono="atras"></span> ${esc(txt)}</a></p>`;
  const bloqueoEquipo = (titulo, texto, volverA) => `${volver('Más', '00-mas.html')}<section class="tarjeta vacio"><h1 class="titulo-seccion" style="display:inline-block">${esc(titulo)}</h1><p class="bloqueo" style="justify-content:center"><span data-icono="candado"></span> ${texto}</p><p style="margin-top:1rem"><a class="btn" href="${volverA || '00-mas.html'}">Volver</a></p></section>`;
  const err = (id, txt) => `<span class="campo__error" role="alert" data-err="${id}" hidden>${txt}</span>`;
  const chipEstado = (u) => u.estado === 'activa' ? '<span class="chip chip--ok">ACTIVA</span>' : u.estado === 'pendiente' ? '<span class="chip chip--alerta">INVITACIÓN PENDIENTE</span>' : '<span class="chip chip--grave">DESACTIVADA</span>';
  const mostrar = (cont, id, malo) => { const e = cont.querySelector(`[data-err="${id}"]`); if (e) e.hidden = !malo; return malo; };

  /* ======================= 21 · Usuarios ======================= */
  function usuarios() {
    const r = raiz();
    if (rol() === 'equipo') { r.innerHTML = bloqueoEquipo('Usuarios', 'Solo Gerencia y Soporte técnico administran las cuentas.'); pintarIconos(); return; }
    const todos = db().usuarios(), n = (e) => todos.filter((u) => u.estado === e).length;
    const f = { q: '', rol: 'Todos', estado: 'todas' };
    r.innerHTML = `${volver('Más', '00-mas.html')}<div class="pagina__titulo"><h1 class="titulo-seccion">Usuarios</h1><a class="btn btn--primario" href="22-persona.html?nuevo=1">Invitar persona</a></div>
      <div class="cifras"><div class="cifra"><span class="cifra__numero">${n('activa')}</span><span class="cifra__texto">${n('activa') === 1 ? 'activa' : 'activas'}</span></div><div class="cifra"><span class="cifra__numero">${n('pendiente')}</span><span class="cifra__texto">${n('pendiente') === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}</span></div><div class="cifra"><span class="cifra__numero">${n('desactivada')}</span><span class="cifra__texto">${n('desactivada') === 1 ? 'desactivada' : 'desactivadas'}</span></div></div>
      <div class="filtros"><label class="campo"><span class="campo__etiqueta">Buscar</span><input class="campo__entrada" type="search" id="u-q" placeholder="Nombre, correo o puesto" autocomplete="off"></label>
        <label class="campo"><span class="campo__etiqueta">Rol</span><select class="campo__entrada" id="u-rol"><option>Todos</option><option>Gerencia</option><option>Equipo</option><option>Soporte técnico</option></select></label></div>
      <div class="pills" role="group" aria-label="Estado de la cuenta">${[['todas', 'Todas', todos.length], ['activa', 'Activas', n('activa')], ['pendiente', 'Pendientes', n('pendiente')], ['desactivada', 'Desactivadas', n('desactivada')]].map(([k, t, c]) => `<button class="pill" type="button" data-pill="${k}" aria-pressed="${k === 'todas'}">${t} <span class="pill__cuenta">${c}</span></button>`).join('')}</div>
      <div id="u-lista"></div>`;
    const pintar = () => {
      const t = f.q.toLowerCase(), RN = NOMBRE_ROL();
      const l = todos.filter((u) => (f.estado === 'todas' || u.estado === f.estado) && (f.rol === 'Todos' || RN[u.rol] === f.rol) && (!t || (u.nombre + ' ' + u.correo + ' ' + u.puesto).toLowerCase().includes(t)));
      const orden = { pendiente: 0, activa: 1, desactivada: 2 };
      l.sort((a, b) => orden[a.estado] - orden[b.estado]);
      document.getElementById('u-lista').innerHTML = !l.length
        ? `<section class="tarjeta vacio"><h2>${t ? 'Nadie coincide con «' + esc(f.q) + '»' : 'Nadie coincide con estos filtros'}</h2><p class="tenue">Revisa cómo está escrito o quita los filtros.</p><button class="btn" type="button" id="u-quitar">Quitar filtros</button></section>`
        : `<div class="tabla-caja"><table class="tabla"><thead><tr><th>Persona</th><th>Puesto</th><th>Área</th><th>Rol</th><th>Estado</th><th>Último ingreso</th><th><span class="solo-lector">Acción</span></th></tr></thead><tbody>${l.map((u) => `<tr><td class="celda-persona" data-label="Persona"><span class="persona"><span class="persona__nombre">${esc(u.nombre)}</span><span class="persona__correo">${esc(u.correo)}</span></span></td><td data-label="Puesto">${esc(u.puesto)}</td><td data-label="Área">${esc(u.area)}</td><td data-label="Rol"><span class="tag">${RN[u.rol]}</span></td><td data-label="Estado">${chipEstado(u)}</td><td data-label="Último ingreso">${esc(u.ultimo)}</td><td data-label=""><a class="btn btn--chico" href="22-persona.html?u=${u.id}" aria-label="Abrir a ${esc(u.nombre)}">Abrir</a></td></tr>`).join('')}</tbody></table></div>`;
      const qb = document.getElementById('u-quitar'); if (qb) qb.addEventListener('click', () => { f.q = ''; f.rol = 'Todos'; f.estado = 'todas'; document.getElementById('u-q').value = ''; document.getElementById('u-rol').value = 'Todos'; r.querySelectorAll('[data-pill]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pill === 'todas')); pintar(); });
    };
    document.getElementById('u-q').addEventListener('input', (e) => { f.q = e.target.value.trim(); pintar(); });
    document.getElementById('u-rol').addEventListener('change', (e) => { f.rol = e.target.value; pintar(); });
    r.querySelectorAll('[data-pill]').forEach((b) => b.addEventListener('click', () => { f.estado = b.dataset.pill; r.querySelectorAll('[data-pill]').forEach((x) => x.setAttribute('aria-pressed', x === b)); pintar(); }));
    pintar(); pintarIconos();
  }

  /* ======================= 22 · Persona ======================= */
  const formUsuario = (u, idForm) => {
    const soy = rol(), yaHaySoporte = db().usuarios().some((x) => x.rol === 'soporte' && (!u || x.id !== u.id));
    const opcion = (v, t, d) => `<label class="opcion"><input type="radio" name="rol-${idForm}" value="${v}"${(u ? u.rol : 'equipo') === v ? ' checked' : ''}><span><span class="opcion__titulo">${t}</span><span class="opcion__texto">${d}</span></span></label>`;
    return `<div class="formulario__dos">
      <label class="campo"><span class="campo__etiqueta">Nombre completo</span><input class="campo__entrada" name="nombre" autocomplete="off" value="${esc(u ? u.nombre : '')}">${u ? '<span class="campo__ayuda">Si cambias el nombre, el historial lo sigue reconociendo.</span>' : ''}${err('nombre', 'Escribe el nombre completo.')}</label>
      <label class="campo"><span class="campo__etiqueta">Correo</span><input class="campo__entrada" name="correo" type="email" autocomplete="off" value="${esc(u ? u.correo : '')}">${err('correo', 'Escribe un correo válido, como nombre@empresa.com.')}<span class="campo__error" role="alert" data-err="repetido" hidden></span></label>
      <label class="campo"><span class="campo__etiqueta">Puesto</span><input class="campo__entrada" name="puesto" autocomplete="off" value="${esc(u ? u.puesto : '')}">${err('puesto', 'Escribe el puesto.')}</label>
      <label class="campo"><span class="campo__etiqueta">Área</span><select class="campo__entrada" name="area">${opciones(db().AREAS, u ? u.area : 'Arquitectura')}</select>${u ? '' : '<span class="campo__ayuda">Define qué ve en Hoy y qué casillas de cierre verifica.</span>'}</label></div>
      <fieldset class="opciones opciones--tres"><legend>Rol</legend>${opcion('gerencia', 'Gerencia', 'Crea proyectos, anula, administra cuentas y catálogos.')}${opcion('equipo', 'Equipo', 'Trabaja hitos, pasos, planos, emisiones y minutas.')}${soy === 'soporte' && !yaHaySoporte ? opcion('soporte', 'Soporte técnico', 'Todos los permisos. Una sola cuenta.') : ''}</fieldset>
      ${soy === 'soporte' ? (yaHaySoporte ? '<p class="bloqueo"><span data-icono="candado"></span> Soporte técnico es una sola cuenta, y ya existe.</p>' : '') : '<p class="bloqueo"><span data-icono="candado"></span> El rol Soporte técnico solo lo asigna Soporte técnico.</p>'}`;
  };
  const leerForm = (f, idActual) => {
    const v = (n) => f.elements[n].value.trim(), c = { nombre: v('nombre'), correo: v('correo'), puesto: v('puesto'), area: f.elements.area.value, rol: (f.querySelector('input[type=radio]:checked') || {}).value };
    let ok = true, primero = null;
    const malo = (n, b, el) => { if (mostrar(f, n, b)) { ok = false; primero = primero || f.elements[el || n]; } };
    malo('nombre', !c.nombre); malo('puesto', !c.puesto); malo('correo', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo));
    const rep = ok || !primero || primero.name !== 'correo' ? db().correoRepetido(c.correo, idActual) : null, e = f.querySelector('[data-err=repetido]');
    if (rep && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo)) { e.hidden = false; e.innerHTML = `Este correo ya tiene una cuenta. <a href="22-persona.html?u=${rep.id}">Abrir a ${esc(rep.nombre)}</a>`; ok = false; primero = primero || f.elements.correo; } else e.hidden = true;
    return { ok, primero, c };
  };

  function persona() {
    const r = raiz();
    if (rol() === 'equipo') { r.innerHTML = bloqueoEquipo('Persona', 'Solo Gerencia y Soporte técnico administran las cuentas.', '00-mas.html'); pintarIconos(); return; }
    const uid = q.get('u'); let enviada = null;
    const datosU = (u) => `<dl class="datos"><div><dt class="etiqueta">Correo</dt><dd class="mono pequeno">${esc(u.correo)}</dd></div><div><dt class="etiqueta">Puesto</dt><dd>${esc(u.puesto)} · ${esc(u.area)}</dd></div><div><dt class="etiqueta">Rol</dt><dd><span class="tag">${NOMBRE_ROL()[u.rol]}</span></dd></div></dl>`;
    const titulo = (u) => { const [a, ...b] = u.nombre.split(' '); return `<div class="pagina__titulo"><div><h1 class="titulo-seccion">${esc(a)} <em>${esc(b.join(' '))}</em></h1></div>${chipEstado(u)}</div>`; };
    function pintar() {
      const u = uid ? db().usuario(uid) : null;
      let h = volver('Usuarios', '21-usuarios.html');
      if (enviada) {
        h += `<div class="pagina__titulo"><h1 class="titulo-seccion">Invitación <em>enviada</em></h1></div><section class="tarjeta"><div class="aviso aviso--ok" role="status"><h2>${esc(enviada.nombre)} recibirá un correo en <span class="mono">${esc(enviada.correo)}</span></h2><p>Entrará como ${esc(enviada.puesto)}, con rol ${NOMBRE_ROL()[enviada.rol]}. La invitación caduca el ${fechaLarga(enviada.invitacion.caduca)}.</p></div><p class="tenue">Quedó registrado: ${esc(quien())} invitó a ${esc(enviada.nombre)} el ${fechaLarga(db().HOY)}.</p><div class="acciones"><a class="btn" href="22-persona.html?nuevo=1">Invitar a otra persona</a><a class="btn btn--primario" href="21-usuarios.html">Volver a Usuarios</a></div></section>`;
      } else if (!u) {
        h += `<div class="pagina__titulo"><h1 class="titulo-seccion">Invitar <em>persona</em></h1></div><form class="tarjeta formulario" novalidate id="f-inv"><p class="tenue">Le llegará un correo con un enlace para crear su contraseña. El enlace sirve una vez y caduca en 7 días.</p>${formUsuario(null, 'a')}<div class="acciones"><a class="btn" href="21-usuarios.html">Cancelar</a><button class="btn btn--primario" type="submit">Enviar invitación</button></div></form>`;
      } else if (u.estado === 'pendiente') {
        const vencida = u.invitacion.caduca < db().HOY;
        h += titulo(u) + `<section class="tarjeta seccion">${datosU(u)}</section><section class="tarjeta seccion"><h2>Invitación</h2><p>Enviada por ${esc(u.invitacion.por)} el ${fechaLarga(u.invitacion.enviada)}. Todavía no crea su contraseña. <strong>${vencida ? 'Caducó' : 'Caduca'} el ${fechaLarga(u.invitacion.caduca)}.</strong></p><div class="acciones acciones--izq"><button class="btn btn--primario" type="button" id="reenviar">Reenviar invitación</button><button class="btn btn--grave" type="button" id="cancelar-inv">Cancelar invitación</button></div></section>`;
      } else if (u.estado === 'desactivada') {
        h += titulo(u) + `<div class="aviso aviso--grave"><h2>Sin acceso desde el ${fechaLarga(u.baja.fecha)}</h2><p>La desactivó ${esc(u.baja.por)}.${u.baja.motivo ? ' Motivo: «' + esc(u.baja.motivo) + '».' : ''} Sus registros se conservan a su nombre.</p></div><section class="tarjeta seccion">${datosU(u)}<p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> Una cuenta desactivada no se edita ni se borra. Para cambiarla, primero reactívala.</p><div class="acciones acciones--izq"><button class="btn" type="button" id="reactivar">Reactivar cuenta</button><a class="btn btn--chico" href="24-historial.html?persona=${encodeURIComponent(u.nombre)}">Ver su historial</a></div></section>`;
      } else {
        const soloSoporte = u.rol === 'soporte' && rol() !== 'soporte', yo = u.nombre === quien();
        h += titulo(u);
        h += soloSoporte ? `<section class="tarjeta seccion">${datosU(u)}<p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> Solo Soporte técnico administra la cuenta de Soporte técnico.</p></section>`
          : `<form class="tarjeta formulario seccion" novalidate id="f-ed"><h2>Datos</h2>${formUsuario(u, 'b')}<div class="acciones"><button class="btn btn--primario" type="submit">Guardar cambios</button></div></form>`;
        h += `<section class="tarjeta seccion"><h2>Acceso</h2><dl class="datos"><div><dt class="etiqueta">Último ingreso</dt><dd>${esc(u.ultimo)}</dd></div><div><dt class="etiqueta">Cuenta desde</dt><dd>${fechaLarga(u.desde)}</dd></div><div><dt class="etiqueta">Invitado por</dt><dd>${esc(u.invitadoPor)}</dd></div></dl><div class="acciones acciones--izq"><button class="btn btn--chico" type="button" id="reset">Enviar enlace para restablecer contraseña</button><a class="btn btn--chico" href="24-historial.html?persona=${encodeURIComponent(u.nombre)}">Ver su historial</a></div></section>`;
        h += soloSoporte ? '' : `<section class="tarjeta seccion zona-riesgo"><h2>Desactivar cuenta</h2><p>Pierde el acceso en ese momento, aunque tenga la sesión abierta. Todo lo que registró se conserva a su nombre y la cuenta se puede reactivar.</p>${yo ? '<p class="bloqueo"><span data-icono="candado"></span> No puedes desactivar tu propia cuenta.</p>' : '<div class="acciones acciones--izq"><button class="btn btn--grave" type="button" id="baja">Desactivar cuenta</button></div>'}</section>`;
      }
      r.innerHTML = '<div class="pagina--angosta-caja">' + h + '</div>'; r.className = 'pagina pagina--angosta'; pintarIconos(); acciones(u);
    }
    function acciones(u) {
      const fi = document.getElementById('f-inv');
      if (fi) fi.addEventListener('submit', (e) => { e.preventDefault(); const L = leerForm(fi, null); if (!L.ok) { L.primero.focus(); return; } enviada = db().invitar(L.c, quien()); pintar(); window.scrollTo(0, 0); });
      const fe = document.getElementById('f-ed');
      if (fe) fe.addEventListener('submit', (e) => { e.preventDefault(); const L = leerForm(fe, u.id); if (!L.ok) { L.primero.focus(); return; } const n = db().editarUsuario(u.id, L.c, quien()); GRU.aviso(n ? 'Cambios guardados.' : 'No había cambios que guardar.', 'ok'); pintar(); });
      const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };
      on('reset', () => GRU.aviso('En el sistema real, ' + u.nombre + ' recibe un correo con un enlace para crear otra contraseña.', 'ok'));
      on('reenviar', () => { db().reenviarInvitacion(u.id, quien()); GRU.aviso('Invitación reenviada.', 'ok'); pintar(); });
      on('reactivar', () => { db().reactivarUsuario(u.id, quien()); GRU.aviso('Cuenta reactivada.', 'ok'); pintar(); });
      on('cancelar-inv', () => {
        const d = dialogo('¿Cancelar la invitación?', `<p>${esc(u.nombre)} ya no podrá crear su contraseña con el enlace que recibió. Si cambias de idea, puedes invitarla de nuevo.</p><div class="acciones"><button class="btn" type="button" id="no">Volver</button><button class="btn btn--grave" type="button" id="si">Cancelar invitación</button></div>`);
        d.caja.querySelector('#no').addEventListener('click', d.cerrar);
        d.caja.querySelector('#si').addEventListener('click', () => { db().cancelarInvitacion(u.id, quien()); d.cerrar(); GRU.aviso('Invitación cancelada.', 'ok'); location.href = '21-usuarios.html'; });
      });
      on('baja', () => {
        const h = db().huellaUsuario(u.nombre);
        const d = dialogo('¿Desactivar a ' + esc(u.nombre) + '?', `<ul><li>Pierde el acceso de inmediato.</li><li>Sus ${plural(h.planos, 'plano', 'planos')}, ${plural(h.emisiones, 'emisión', 'emisiones')} y demás registros siguen a su nombre.</li>${h.pendientes ? `<li>Sus ${plural(h.pendientes, 'pendiente abierto', 'pendientes abiertos')} quedan sin encargado activo: conviene reasignarlos.</li>` : ''}</ul>
          <label class="campo"><span class="campo__etiqueta">Motivo <span class="campo__opcional">opcional</span></span><input class="campo__entrada" id="motivo" autocomplete="off"><span class="campo__ayuda">Se guarda en el historial.</span></label>
          <div class="acciones"><button class="btn" type="button" id="no">Cancelar</button><button class="btn btn--primario" type="button" id="si">Desactivar cuenta</button></div>`);
        d.caja.querySelector('#no').addEventListener('click', d.cerrar);
        d.caja.querySelector('#si').addEventListener('click', () => { db().desactivarUsuario(u.id, d.caja.querySelector('#motivo').value.trim(), quien()); d.cerrar(); GRU.aviso('Cuenta desactivada.', 'ok'); pintar(); window.scrollTo(0, 0); });
      });
    }
    pintar();
  }

  /* ======================= 23 · Catálogos ======================= */
  function catalogos() {
    const r = raiz();
    if (rol() === 'equipo') { r.innerHTML = bloqueoEquipo('Catálogos', 'Los catálogos los mantiene Gerencia. Tú eliges de ellos al crear planos e hitos.'); pintarIconos(); return; }
    const TABS = [['inst', 'Instituciones'], ['disc', 'Disciplinas'], ['clientes', 'Clientes'], ['hitos', 'Hitos base'], ['planos', 'Planos de referencia']];
    const BOTON = { inst: 'Agregar institución', disc: 'Agregar disciplina', clientes: 'Agregar cliente', hitos: 'Agregar al catálogo', planos: 'Agregar al catálogo' };
    const ayuda = { inst: () => `A quién va dirigido un plano. El código de 3 letras forma parte del CUP. ${plural(db().catInst().length, 'institución', 'instituciones')} en la lista.`, disc: () => `Especialidad del plano. El código de 2 letras forma parte del CUP. ${plural(db().catDisc().length, 'disciplina', 'disciplinas')} en la lista.`, clientes: () => 'El proyecto elige su cliente de esta lista. Solo nombre; la ubicación es del proyecto.', hitos: () => `Catálogo base único en ${db().FASES.length} fases. Cada hito nace con los 10 pasos tipo. Los cambios aplican a hitos nuevos, no a los que ya existen.`, planos: () => 'Planos tipo para arrancar un INDEX rápido.' };
    let tab = TABS.some((t) => t[0] === q.get('t')) ? q.get('t') : 'inst', filtro = '';
    const quitarBtn = (act, id, label) => `<button class="btn btn--chico" type="button" data-${act}="${esc(id)}" aria-label="${label}">${act === 'editar' ? 'Editar' : act === 'off' ? 'Desactivar' : 'Reactivar'}</button>`;
    function filas() {
      const t = filtro.toLowerCase();
      if (tab === 'inst' || tab === 'disc') return db()[tab === 'inst' ? 'catInst' : 'catDisc']().filter((x) => !t || (x.cod + x.nombre).toLowerCase().includes(t)).map((x) => ({ cod: x.cod, nombre: x.nombre, uso: plural(db().usoCatalogo(tab, x.cod), 'plano', 'planos'), n: db().usoCatalogo(tab, x.cod), activo: x.activo, clave: x.cod }));
      if (tab === 'clientes') return db().catClientes().filter((x) => !t || x.nombre.toLowerCase().includes(t)).map((x) => ({ cod: String(x.n).padStart(2, '0'), nombre: x.nombre, uso: plural(db().usoCatalogo('clientes', x.nombre), 'proyecto', 'proyectos'), n: db().usoCatalogo('clientes', x.nombre), activo: x.activo, clave: x.nombre }));
      if (tab === 'hitos') return db().CATALOGO.filter((x) => !t || (x.cat + x.nombre + db().FASES[x.fase - 1]).toLowerCase().includes(t)).map((x) => ({ cod: x.cat, nombre: x.nombre, sub: db().FASES[x.fase - 1], uso: plural(db().usoCatalogo('hitos', x.cat), 'proyecto', 'proyectos'), n: 0, activo: true, clave: x.cat, soloLectura: true }));
      return Object.entries(db().REFERENCIA).flatMap(([d, ls]) => ls.map((n) => ({ cod: d, nombre: n, uso: plural(db().usoCatalogo('planos', n), 'proyecto', 'proyectos'), n: 0, activo: true, clave: n, soloLectura: true }))).filter((x) => !t || (x.cod + x.nombre).toLowerCase().includes(t));
    }
    function pintar() {
      const fs = filas(), cab = { inst: 'Código', disc: 'Código', clientes: 'N.º', hitos: 'Hito', planos: 'Disc.' }[tab];
      r.innerHTML = `${volver('Más', '00-mas.html')}<div class="pagina__titulo"><h1 class="titulo-seccion">Catálogos</h1><button class="btn btn--primario" type="button" id="agregar">${BOTON[tab]}</button></div>
        <div class="pills" role="group" aria-label="Catálogo">${TABS.map(([k, t]) => `<button class="pill" type="button" data-tab="${k}" aria-pressed="${k === tab}">${t}</button>`).join('')}</div>
        <p class="tenue">${ayuda[tab]()}</p>
        <div class="filtros"><label class="campo"><span class="campo__etiqueta">Buscar en este catálogo</span><input class="campo__entrada" type="search" id="c-q" value="${esc(filtro)}" autocomplete="off"></label></div>
        ${fs.length ? `<div class="tabla-caja"><table class="tabla"><thead><tr><th>${cab}</th><th>Nombre</th><th>En uso</th><th>Estado</th><th><span class="solo-lector">Acción</span></th></tr></thead><tbody>${fs.map((x) => `<tr><td data-label="${cab}" class="mono">${esc(x.cod)}</td><td data-label="Nombre">${esc(x.nombre)}${x.sub ? `<br><span class="tenue pequeno">${esc(x.sub)}</span>` : ''}</td><td data-label="En uso">${x.uso}</td><td data-label="Estado"><span class="chip ${x.activo ? 'chip--ok' : 'chip--grave'}">${x.activo ? (tab === 'clientes' ? 'ACTIVO' : tab === 'hitos' || tab === 'planos' ? 'ACTIVO' : 'ACTIVA') : (tab === 'clientes' ? 'DESACTIVADO' : 'DESACTIVADA')}</span></td><td data-label="">${x.soloLectura ? `<button class="btn btn--chico" type="button" data-toast="1" aria-label="Editar ${esc(x.nombre)}">Editar</button>` : quitarBtn('editar', x.clave, 'Editar ' + esc(x.nombre)) + ' ' + quitarBtn(x.activo ? 'off' : 'on', x.clave, (x.activo ? 'Desactivar ' : 'Reactivar ') + esc(x.nombre))}</td></tr>`).join('')}</tbody></table></div>` : `<section class="tarjeta vacio"><h2>Nada coincide con «${esc(filtro)}»</h2><button class="btn" type="button" id="c-quitar">Quitar búsqueda</button></section>`}
        <p class="bloqueo" style="margin-top:1rem"><span data-icono="candado"></span> Lo que ya está en uso no se borra ni cambia de código: se desactiva, y deja de ofrecerse para lo nuevo.</p>`;
      pintarIconos(); acciones();
    }
    const toastReal = () => GRU.aviso(tab === 'hitos' ? 'En el sistema real, Gerencia edita aquí los hitos base; el cambio aplica a hitos nuevos, no a los existentes.' : 'En el sistema real, Gerencia edita aquí los planos de referencia que se ofrecen al armar un INDEX.', 'ok');
    function acciones() {
      r.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; filtro = ''; pintar(); }));
      const qi = document.getElementById('c-q'); qi.addEventListener('input', () => { filtro = qi.value.trim(); pintar(); const n = document.getElementById('c-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
      const qb = document.getElementById('c-quitar'); if (qb) qb.addEventListener('click', () => { filtro = ''; pintar(); });
      r.querySelectorAll('[data-toast]').forEach((b) => b.addEventListener('click', toastReal));
      document.getElementById('agregar').addEventListener('click', () => (tab === 'hitos' || tab === 'planos') ? toastReal() : dlgAgregar());
      r.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => dlgEditar(b.dataset.editar)));
      r.querySelectorAll('[data-off]').forEach((b) => b.addEventListener('click', () => dlgOff(b.dataset.off)));
      r.querySelectorAll('[data-on]').forEach((b) => b.addEventListener('click', () => { activar(b.dataset.on, true); GRU.aviso('Reactivado.', 'ok'); pintar(); }));
    }
    const activar = (clave, v) => tab === 'clientes' ? db().activarCliente(clave, v, quien()) : db().activarCatalogo(tab, clave, v, quien());
    const nombreExiste = (n, salvo) => (tab === 'clientes' ? db().catClientes() : tab === 'inst' ? db().catInst() : db().catDisc()).some((x) => x.nombre.toLowerCase() === n.toLowerCase() && (x.cod || x.nombre) !== salvo);
    function dlgAgregar() {
      const conCod = tab !== 'clientes', largo = tab === 'inst' ? 3 : 2;
      const d = dialogo(BOTON[tab], `<form id="f-c" novalidate>${conCod ? `<label class="campo"><span class="campo__etiqueta">Código de ${largo} letras</span><input class="campo__entrada mono" name="cod" maxlength="${largo}" autocomplete="off" style="text-transform:uppercase"><span class="campo__ayuda">Forma parte del CUP. No se podrá cambiar después.</span><span class="campo__error" role="alert" data-err="cod" hidden></span></label>` : ''}<label class="campo"><span class="campo__etiqueta">Nombre</span><input class="campo__entrada" name="nombre" autocomplete="off"><span class="campo__error" role="alert" data-err="nombre" hidden></span></label><div class="acciones"><button class="btn" type="button" id="no">Cancelar</button><button class="btn btn--primario" type="submit">Agregar</button></div></form>`);
      const f = d.caja.querySelector('#f-c'); d.caja.querySelector('#no').addEventListener('click', d.cerrar);
      f.addEventListener('submit', (e) => {
        e.preventDefault(); let ok = true, primero = null; const set = (id, txt, el) => { const s = f.querySelector(`[data-err=${id}]`); s.hidden = !txt; if (txt) { s.textContent = txt; ok = false; primero = primero || f.elements[el || id]; } };
        const nombre = f.elements.nombre.value.trim();
        if (conCod) { const cod = f.elements.cod.value.trim().toUpperCase(); const lista = tab === 'inst' ? db().catInst() : db().catDisc(); set('cod', !new RegExp('^[A-Z]{' + largo + '}$').test(cod) ? `Usa exactamente ${largo} letras, sin acentos.` : lista.some((x) => x.cod === cod) ? 'Ese código ya existe.' : ''); }
        set('nombre', !nombre ? 'Escribe el nombre.' : nombreExiste(nombre, null) ? 'Ya hay un registro con ese nombre.' : '');
        if (!ok) { primero.focus(); return; }
        if (tab === 'clientes') db().agregarCliente(nombre, quien()); else db().agregarCatalogo(tab, f.elements.cod.value.trim().toUpperCase(), nombre, quien());
        d.cerrar(); GRU.aviso('Agregado al catálogo.', 'ok'); pintar();
      });
    }
    function dlgEditar(clave) {
      const actual = tab === 'clientes' ? clave : (tab === 'inst' ? db().catInst() : db().catDisc()).find((x) => x.cod === clave).nombre;
      const d = dialogo('Editar', `<form id="f-c" novalidate>${tab === 'clientes' ? '' : `<p class="tenue">Código: <span class="mono">${esc(clave)}</span> (no se puede cambiar).</p>`}<label class="campo"><span class="campo__etiqueta">Nombre</span><input class="campo__entrada" name="nombre" autocomplete="off" value="${esc(actual)}"><span class="campo__error" role="alert" data-err="nombre" hidden></span></label><div class="acciones"><button class="btn" type="button" id="no">Cancelar</button><button class="btn btn--primario" type="submit">Guardar</button></div></form>`);
      const f = d.caja.querySelector('#f-c'); d.caja.querySelector('#no').addEventListener('click', d.cerrar);
      f.addEventListener('submit', (e) => {
        e.preventDefault(); const n = f.elements.nombre.value.trim(), s = f.querySelector('[data-err=nombre]');
        const m = !n ? 'Escribe el nombre.' : nombreExiste(n, clave) ? 'Ya hay un registro con ese nombre.' : ''; s.hidden = !m; if (m) { s.textContent = m; f.elements.nombre.focus(); return; }
        if (n !== actual) { if (tab === 'clientes') db().editarCliente(actual, n, quien()); else db().editarCatalogo(tab, clave, n, quien()); }
        d.cerrar(); GRU.aviso('Cambios guardados.', 'ok'); pintar();
      });
    }
    function dlgOff(clave) {
      const uso = db().usoCatalogo(tab, clave), unid = tab === 'clientes' ? ['proyecto', 'proyectos'] : ['plano', 'planos'];
      const d = dialogo('¿Desactivar?', `<p>Deja de ofrecerse para lo nuevo.${uso ? ` Los ${plural(uso, unid[0], unid[1])} que ya lo usan no cambian.` : ''} Se puede reactivar cuando quieras.</p><div class="acciones"><button class="btn" type="button" id="no">Cancelar</button><button class="btn btn--primario" type="button" id="si">Desactivar</button></div>`);
      d.caja.querySelector('#no').addEventListener('click', d.cerrar);
      d.caja.querySelector('#si').addEventListener('click', () => { activar(clave, false); d.cerrar(); GRU.aviso('Desactivado.', 'ok'); pintar(); });
    }
    pintar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    ({ usuarios, persona, catalogos })[v] && ({ usuarios, persona, catalogos })[v]();
  });
})();
