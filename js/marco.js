/* marco.js · Componente "cabecera de la app": logo, navegación principal, cuenta y tema.
   UN solo lugar para la cabecera: las pantallas solo declaran data-marco="hoy|proyectos|pendientes|mas". */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const NAV = [
    ['hoy', 'Hoy', '05-hoy.html'],
    ['proyectos', 'Proyectos', '06-proyectos.html'],
    ['pendientes', 'Pendientes', '18-pendientes.html'],
    ['mas', 'Más', '00-mas.html'],
  ];
  GRU.marco = function (activo) {
    const enlaces = NAV.map(([id, texto, href]) =>
      `<a class="nav__enlace" data-nav="${id}" href="${href}"${id === activo ? ' aria-current="page"' : ''}><span>${texto}</span></a>`).join('\n    ');
    return `<header class="marco__barra" id="marco">
  <a class="marco__logo" href="05-hoy.html" aria-label="GRUBORJA, ir al inicio">
    <img class="logo logo--claro" src="../img/logo-claro.png" alt="GRUBORJA" width="684" height="120">
    <img class="logo logo--marino" src="../img/logo-marino.png" alt="GRUBORJA" width="683" height="120">
  </a>
  <nav class="nav" aria-label="Principal">
    ${enlaces}
  </nav>
  <a class="marco__cuenta" href="09-mi-cuenta.html" id="marco-cuenta"></a>
  <button class="tema-btn" type="button"></button>
</header>`;
  };
})();
