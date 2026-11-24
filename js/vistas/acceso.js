/* vistas/acceso.js · Pantallas 1 (Ingreso), 2 (Olvidé mi contraseña), 3 (Activar cuenta) y 9 (Mi cuenta).
   Simula el acceso con las cuentas de Usuarios: la contraseña de todas parte de demo-clave-1. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const db = () => GRU.db;
  const q = new URLSearchParams(location.search);
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iniciales = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const hashEstado = () => /estado=/.test(location.hash);   /* si quien revisa eligió un estado en la barra, se respeta */
  const estado = (e) => GRU.estado.cambiar({ estado: e });
  const fijarTexto = (el, html) => { if (el) el.innerHTML = html; };
  const sesion = (clave, valor) => { try { if (valor === undefined) return sessionStorage.getItem(clave); if (valor === null) sessionStorage.removeItem(clave); else sessionStorage.setItem(clave, valor); } catch (e) { /* igual */ } return null; };
  const hora = () => new Date().toTimeString().slice(0, 5);
  const yo = () => { const n = GRU.datos.personas[GRU.estado.rol].nombre; return db().usuarioPorNombre(n); };
  const tipoLetras = (c) => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(c) && /\d/.test(c);
  function entrar(u) {
    sesion('gru-rol', u.rol); sesion('gru-persona', JSON.stringify({ rol: u.rol, nombre: u.nombre, puesto: u.puesto, iniciales: iniciales(u.nombre) }));
    sesion('gru-intentos', null); sesion('gru-bloqueo', null); db().registrarIngreso(u.id); location.href = '05-hoy.html';
  }
  const pistaMaqueta = (form) => form.insertAdjacentHTML('afterend', `<p class="tenue pequeno login__pista">Maqueta: todas las cuentas de Usuarios entran con la contraseña <span class="mono">${db().CLAVE_DEMO}</span>.</p>`);

  /* ======================= 1 · Ingreso ======================= */
  function ingreso() {
    const f = $('form'), [correo, clave] = f.querySelectorAll('input'), err = $('.campo__error', f), boton = $('button[type=submit]', f);
    pistaMaqueta(f);
    const bloqueado = () => Number(sesion('gru-bloqueo') || 0) > Date.now();
    if (!hashEstado()) { if (bloqueado()) estado('intentos'); else estado('normal'); }
    document.addEventListener('click', (e) => { if (e.target.closest('#maq-barra [data-estado]')) { sesion('gru-bloqueo', null); sesion('gru-intentos', null); } });
    const fallo = (html) => { fijarTexto(err, html); estado('error'); correo.focus(); };
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!navigator.onLine) return estado('conexion');
      if (bloqueado()) return estado('intentos');
      if (!correo.value.trim() || !clave.value) { fijarTexto(err, 'Escribe tu correo y tu contraseña.'); estado('error'); (correo.value.trim() ? clave : correo).focus(); return; }
      const u = db().usuarioPorCorreo(correo.value);
      if (!u || clave.value !== db().claveDe(u)) {
        const n = Number(sesion('gru-intentos') || 0) + 1; sesion('gru-intentos', String(n));
        if (n >= 5) { sesion('gru-bloqueo', String(Date.now() + 5 * 60e3)); return estado('intentos'); }
        return fallo('El correo o la contraseña no coinciden. Revisa e intenta de nuevo.');
      }
      if (u.estado === 'desactivada') { location.href = '04-desactivada.html'; return; }
      if (u.estado === 'pendiente') return fallo(`Tu invitación sigue pendiente. Crea tu contraseña con el enlace que te llegó. <a href="03-activar.html?u=${esc(u.id)}">Abrir mi invitación</a>`);
      entrar(u);
    });
  }

  /* ======================= 2 · Olvidé mi contraseña ======================= */
  function olvide() {
    const f = $('form'), correo = $('input[type=email]', f);
    if (!hashEstado()) estado('normal');
    const err = document.createElement('span'); err.className = 'campo__error'; err.setAttribute('role', 'alert'); err.hidden = true; err.textContent = 'Escribe un correo válido, como nombre@empresa.com.'; correo.closest('.campo').appendChild(err);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = correo.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); err.hidden = ok; if (ok) correo.removeAttribute('aria-invalid'); else { correo.setAttribute('aria-invalid', 'true'); correo.focus(); return; }
      db().pedirRestablecer(v);   /* la respuesta es la misma exista o no la cuenta */
      $('[data-f=correo]').textContent = v; estado('enviado');
    });
  }

  /* ======================= 3 · Activar cuenta / nueva contraseña ======================= */
  function activar() {
    const f = $('form'), campo = $('input[type=password]', f);
    campo.value = '';
    const r = q.get('r'), forzado = q.get('x'), id = q.get('u') || (r ? null : 'ana'), u = db().usuario(id || r);
    let modo = 'invitacion';
    if (forzado === 'vencido' || forzado === 'usado') modo = forzado;
    else if (r) modo = u && u.estado === 'activa' ? 'restablecer' : 'usado';
    else if (!u || u.estado !== 'pendiente' || !u.invitacion) modo = 'usado';
    else if (u.invitacion.caduca < db().HOY) modo = 'vencido';
    if (u) {
      const set = (k, v) => { const el = $(`[data-f=${k}]`); if (el) el.textContent = v; };
      set('nombre', u.nombre); set('por', u.invitacion ? u.invitacion.por : u.invitadoPor); set('correo', u.correo); set('correo2', u.correo); set('puesto', u.puesto + ' · ' + u.area); set('rol', GRU.datos.nombreRol[u.rol]);
    }
    if (!hashEstado()) estado(modo);
    const err = $('.campo__error[data-si-estado]', f);
    const reqs = () => {
      const v = campo.value, largo = v.length >= 10, ln = tipoLetras(v);
      document.querySelectorAll('.requisitos').forEach((ul, i) => {
        const items = [['Al menos 10 caracteres' + (i === 1 ? ` (llevas ${v.length})` : ''), largo], ['Letras y números', ln]];
        ul.innerHTML = items.map(([t, ok]) => `<li${ok ? ' class="cumple"' : ''}><span data-icono="${ok ? 'ok' : 'punto'}"></span> ${t}</li>`).join('');
      });
      GRU.comportamientos.iconos(); return { largo, ln };
    };
    campo.addEventListener('input', () => { reqs(); if (err) err.hidden = true; campo.removeAttribute('aria-invalid'); });
    reqs();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const { largo, ln } = reqs();
      if (!largo || !ln) { campo.setAttribute('aria-invalid', 'true'); fijarTexto(err, !largo ? 'La contraseña es muy corta. Usa al menos 10 caracteres.' : 'Usa letras y números.'); err.hidden = false; campo.focus(); return; }
      if (GRU.estado.estado === 'restablecer') { if (u) db().cambiarClave(u.id, campo.value); GRU.aviso('Contraseña guardada. Ya puedes iniciar sesión.', 'ok'); setTimeout(() => { location.href = '01-ingreso.html'; }, 900); return; }
      if (u && u.estado === 'pendiente') { db().activarCuenta(u.id, campo.value); entrar(db().usuario(u.id)); }
      else { GRU.aviso('En el sistema real, esto activa la cuenta y entra.', 'ok'); }
    });
  }

  /* ======================= 9 · Mi cuenta ======================= */
  function cuenta() {
    const u = yo(), f = $('form'), [actual, nueva, repite] = f.querySelectorAll('input');
    if (!hashEstado()) estado('normal');
    const ult = $('[data-f=ultimo]'); if (u && ult) ult.textContent = u.ultimo.startsWith('Hoy') ? 'hoy, ' + u.ultimo.slice(5) : u.ultimo.toLowerCase();
    const mk = (inp, txt) => { const s = document.createElement('span'); s.className = 'campo__error'; s.setAttribute('role', 'alert'); s.hidden = true; s.textContent = txt; inp.closest('.campo').appendChild(s); return s; };
    const eActual = $('.campo__error[data-si-estado=error]', f), eNueva = mk(nueva, 'Usa al menos 10 caracteres, con letras y números.'), eRepite = mk(repite, 'Las contraseñas nuevas no coinciden.');
    f.addEventListener('submit', (e) => {
      e.preventDefault(); let ok = true, primero = null;
      const malo = (inp, el, b) => { if (b) { ok = false; primero = primero || inp; inp.setAttribute('aria-invalid', 'true'); } else inp.removeAttribute('aria-invalid'); if (el) el.hidden = !b; };
      const claveMala = !u || actual.value !== db().claveDe(u);
      eActual.textContent = actual.value ? 'La contraseña actual no coincide.' : 'Escribe tu contraseña actual.';
      malo(actual, eActual, claveMala); malo(nueva, eNueva, nueva.value.length < 10 || !tipoLetras(nueva.value)); malo(repite, eRepite, repite.value !== nueva.value);
      if (!ok) { eActual.hidden = !claveMala; primero.focus(); return; }
      db().cambiarClave(u.id, nueva.value); f.reset(); estado('guardado'); $('[data-f=cuando]').textContent = 'hoy, ' + Number(db().HOY.slice(8)) + ' nov 2026 a las ' + hora();
      $('.aviso--ok').scrollIntoView({ block: 'nearest' });
    });
    [actual, nueva, repite].forEach((i) => i.addEventListener('input', () => { i.removeAttribute('aria-invalid'); }));
    const pills = [...document.querySelectorAll('.pills .pill')], modos = ['sistema', 'claro', 'marino'], act = GRU.tema.modo();
    pills.forEach((b, i) => { b.setAttribute('aria-pressed', modos[i] === act); b.addEventListener('click', () => { GRU.tema.fijar(modos[i]); pills.forEach((x, j) => x.setAttribute('aria-pressed', j === i)); }); });
    const salir = document.querySelector('a[href="01-ingreso.html"].btn');
    if (salir) salir.addEventListener('click', () => { sesion('gru-persona', null); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.body.dataset.vista;
    ({ ingreso, olvide, activar, cuenta })[v]();
  });
})();
