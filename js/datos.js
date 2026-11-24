/* datos.js · Capa de datos de DEMOSTRACIÓN (personas y roles ficticios).
   En el sistema real esto lo entrega la base de datos; las pantallas solo leen GRU.datos. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  GRU.datos = {
    personas: {
      gerencia: { nombre: 'Mariana Solís', puesto: 'Gerente General', iniciales: 'MS' },
      equipo: { nombre: 'Diego Ortiz', puesto: 'Arquitecto diseñador', iniciales: 'DO' },
      soporte: { nombre: 'Soporte Demo', puesto: 'Soporte técnico', iniciales: 'SD' },
    },
    nombreRol: { gerencia: 'Gerencia', equipo: 'Equipo', soporte: 'Soporte técnico' },
  };
  /* Quien inició sesión en la pantalla de ingreso reemplaza a la persona de demostración de su rol. */
  try { const g = JSON.parse(sessionStorage.getItem('gru-persona') || 'null'); if (g && GRU.datos.personas[g.rol]) GRU.datos.personas[g.rol] = { nombre: g.nombre, puesto: g.puesto, iniciales: g.iniciales }; } catch (e) { /* igual */ }
})();
