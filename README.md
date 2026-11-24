# Sistema de gestión GRUBORJA · Prototipo v2

HTML/CSS/JS puro, sin build. Abrir `index.html` (índice de las 30 pantallas) o `design-system.html`.

## Cómo probarlo
- **En línea** (GitHub Pages): https://jdanbo.github.io/sistema_gestion_GRUBORJA_V2/ (si ya está activado).
- **Local**: descargar el repositorio y abrir `index.html`.
- Los datos de ejemplo viven en el navegador de cada persona (localStorage): lo que se haga no se comparte ni se guarda en un servidor. «Restablecer ejemplo» en la barra negra vuelve al inicio.
- Todas las cuentas de ejemplo entran con la contraseña `demo-clave-1`.
- Estado: prototipo v2 para validar con Lucy y la oficina; no es el sistema de producción.

## Arquitectura por capas
CSS (orden de carga, cada capa solo depende de las anteriores):
1. `css/tokens.css`      — colores, espaciado, tipografía (tokens y temas claro/marino)
2. `css/base.css`        — reset y elementos HTML
3. `css/componentes.css` — botones, campos, chips, tablas, tarjetas, cifras, tabs-select…
4. `css/patrones.css`    — composiciones por pantalla (login, planos, gantt, minutas…)
5. `css/shell.css`       — cabecera, navegación, contenedor `.app`
6. `css/responsive.css`  — ajustes móvil/tablet (container queries)
7. `css/maqueta.css`     — barra de revisión (solo prototipo; se elimina en producción)
`css/ds.css` solo documenta el design system.

Datos: `js/db.js` guarda los datos de ejemplo en el navegador (localStorage) y `js/vistas/*.js` pintan cada pantalla desde ellos. La barra negra tiene «Restablecer ejemplo» y «Vaciar». Pantallas ya conectadas: 6, 7 y 8 (cabecera) y toda la ruta de planos: 10 INDEX con filtros, 11 nuevo plano (CUP automático), 12 plano y 13 nueva emisión (nombre de archivo automático y huella SHA-256 real). El resto sigue estático y se irá conectando. El proyecto en curso viaja en la dirección (`?p=CODIGO`).

JS (scripts clásicos, global `GRU`, funcionan desde file://): iconos, datos, tema, marco (cabecera), estado (hash `#estado=…&rol=…`), maqueta, comportamientos (Mostrar contraseña, selector de secciones, desplazables), app (arranque).

## Cómo agregar
- **Pantalla nueva**: copiar una de `pantallas/` con estructura similar, ajustar `data-si-estado` / `data-si-rol`, y enlazarla en `index.html`.
- **Componente nuevo**: definirlo en `componentes.css` usando solo tokens, mostrarlo en `design-system.html`, y recién entonces usarlo en pantallas.
- **Cambiar color/espacio**: solo en `tokens.css`.

## Cambios frente a la maqueta original
Ver `revision-ux-ui/plan-de-cambios-v2.md` en el Proyecto. Resumen: texto mínimo 12 px, objetivos táctiles 44 px, contraste corregido (`--color-text-soft`), Mostrar/Ocultar contraseña (sin repetir campo), cifras de Hoy enlazadas, selector desplegable de secciones en móvil, motivo del cambio como textarea, anular emisión en zona de peligro, estados con chips, tablas con etiquetas en móvil.

## Auditoría automática (557 mediciones, 30 pantallas × estados × 320/375/768/1280 × claro/marino)
0 errores JS · 0 desbordes · 0 fallos de contraste · 0 textos <12 px · 0 objetivos pequeños · 1 h1 por pantalla.
No verificado: teclado, lector de pantalla, `prefers-reduced-motion`, fuente Work Sans real, pruebas con usuarios (Lucy + 2–3 personas).
