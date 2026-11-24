/* db.js · Capa de DATOS de la maqueta: guarda en el navegador (localStorage) para que lo que se crea se vea en las demás pantallas.
   No es una base de datos real; en el sistema definitivo esto lo reemplaza la API. Las pantallas solo hablan con GRU.db. */
(function () {
  'use strict';
  window.GRU = window.GRU || {};
  const CLAVE = 'gru-db-v3';

  const SEMILLA = {
    clientes: ['Cliente Demo', 'Cliente Ejemplo, S.A.', 'Cliente Muestra'],
    proyectos: [
      { codigo: 'DEMOPX', nombre: 'Edificio Demo Plaza', cliente: 'Cliente Demo', depto: 'Guatemala', municipio: 'Guatemala', estado: 'activo', creado: '2026-03-02', prog: 62, real: 58, planos: [18, 31], atrasados: 1, hitos: 4 },
      { codigo: 'BODEGA1', nombre: 'Bodega Demo Norte', cliente: 'Cliente Ejemplo, S.A.', depto: 'Escuintla', municipio: 'Escuintla', estado: 'activo', creado: '2026-04-14', prog: 35, real: 21, planos: [9, 24], atrasados: 2, hitos: 6 },
      { codigo: 'CLINICA', nombre: 'Clínica Demo Sur', cliente: 'Cliente Muestra', depto: 'Guatemala', municipio: 'Villa Nueva', estado: 'activo', creado: '2026-01-20', prog: 80, real: 82, planos: [40, 44], atrasados: 0, hitos: 8 },
      { codigo: 'OFITEC', nombre: 'Oficinas Demo Tec', cliente: 'Cliente Demo', depto: 'Guatemala', municipio: 'Mixco', estado: 'activo', creado: '2026-11-06', prog: 0, real: 0, planos: [0, 3], atrasados: 0, hitos: 0 },
      { codigo: 'CASALAG', nombre: 'Casa Demo Lago', cliente: 'Cliente Muestra', depto: 'Sacatepéquez', municipio: 'Antigua Guatemala', estado: 'terminado', creado: '2025-05-12', prog: 100, real: 100, planos: [22, 22], atrasados: 0, hitos: 7 },
      { codigo: 'LOCAL01', nombre: 'Local Demo Centro', cliente: 'Cliente Ejemplo, S.A.', depto: 'Guatemala', municipio: 'Guatemala', estado: 'terminado', creado: '2025-08-03', prog: 100, real: 100, planos: [12, 12], atrasados: 0, hitos: 5 },
    ],
  };


  /* ---------- Catálogos y planos ---------- */
  const INST = { CON: ['CONRED', 'CONRED'], MUN: ['Municipalidad', 'MUNICIPALIDAD'], OBR: ['Obra', 'OBRA'], CLI: ['Cliente', 'CLIENTE'] };
  const DISC = { AR: ['Arquitectura', 'ARQ'], ES: ['Estructura', 'EST'], EL: ['Eléctrica', 'ELE'], HS: ['Hidrosanitaria', 'HID'] };

  /* ---------- Catálogos editables: instituciones, disciplinas y clientes ---------- */
  const INST0 = JSON.parse(JSON.stringify(INST)), DISC0 = JSON.parse(JSON.stringify(DISC));
  function copia0(o) { return JSON.parse(JSON.stringify(o)); }
  function catalogo() {
    if (!datos.catalogo) datos.catalogo = { inst: Object.fromEntries(Object.entries(INST0).map(([k, v]) => [k, { nombre: v[0], corto: v[1], activo: k !== 'CLI' }])), disc: Object.fromEntries(Object.entries(DISC0).map(([k, v]) => [k, { nombre: v[0], corto: v[1], activo: true }])), clientesOff: [] };
    return datos.catalogo;
  }
  /* INST y DISC los leen las pantallas de planos: se reconstruyen desde el catálogo. */
  function sincronizarCatalogo() {
    const c = catalogo();
    Object.keys(INST).forEach((k) => delete INST[k]); Object.keys(DISC).forEach((k) => delete DISC[k]);
    Object.entries(c.inst).forEach(([k, v]) => { INST[k] = [v.nombre, v.corto]; });
    Object.entries(c.disc).forEach(([k, v]) => { DISC[k] = [v.nombre, v.corto]; });
  }
  const USOS = ['Entrega a institución', 'Obra', 'Cotización', 'Interno', 'Consultor', 'Referencia'];
  const ESTADOS = ['ENVIADO', 'RECIBIDO', 'APROBADO', 'VIGENTE'];
  const REFERENCIA = {
    AR: ['Planta arquitectónica nivel 1', 'Planta arquitectónica nivel 2', 'Planta de techos', 'Elevaciones', 'Secciones', 'Detalles de puertas y ventanas'],
    ES: ['Planta de cimentación', 'Planta de losas', 'Detalles de vigas', 'Detalles de gradas'],
    EL: ['Planta de iluminación', 'Planta de fuerza', 'Diagrama unifilar'],
    HS: ['Planta de agua potable', 'Planta de drenajes', 'Detalle de cisterna'],
  };
  /* Planos tipo que aún no están sembrados en DEMOPX: así «Desde la lista de referencia» siempre tiene algo para marcar. */
  const REF_EXTRA = { AR: ['Cuadro de áreas', 'Planta de acabados', 'Detalles de baños'], ES: ['Detalles de columnas', 'Detalle de zapatas', 'Planta de entrepiso'], EL: ['Cuadro de cargas', 'Detalle de tableros'], HS: ['Detalle de tanque elevado', 'Isométrico de agua caliente'] };
  const REFERENCIA_UI = Object.fromEntries(Object.keys(REFERENCIA).map((d) => [d, REFERENCIA[d].concat(REF_EXTRA[d] || [])]));
  const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const ddmmmyy = (iso) => { const [y, m, d] = iso.split('-'); return d + MES[+m - 1] + y.slice(2); };
  const hash = (txt) => { let h = 2166136261 >>> 0, out = ''; for (let k = 0; k < 4; k++) { for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i) + k; h = Math.imul(h, 16777619) >>> 0; } out += h.toString(16).padStart(8, '0'); } return out.repeat(2); };

  function sembrarPlanos() {
    const planos = [];
    const cons = {};
    const mk = (inst, disc, titulo, o = {}) => {
      const k = 'DEMOPX-' + inst + disc;
      cons[k] = (cons[k] || 0) + 1;
      const cup = k + '-' + String(cons[k]).padStart(3, '0');
      const p = { proyecto: 'DEMOPX', cup, inst, disc, titulo, creadoPor: o.por || 'Diego Ortiz', creado: o.creado || '2026-10-12', terminado: !!o.terminado, anulado: o.anulado || null, emisiones: [], historial: [] };
      (o.em || []).forEach((e, i) => p.emisiones.push({ v: i + 1, fecha: e[0], estado: e[1], uso: e[2] || 'Entrega a institución', motivo: e[3] || (i ? 'Ajuste solicitado.' : 'Primera emisión.'), quien: e[4] || p.creadoPor, anulada: e[1] === 'ANULADO', final: false, hashPdf: hash(cup + i), hashEd: hash('ed' + cup + i) }));
      planos.push(p); return p;
    };
    const V = 'VIGENTE', A = 'APROBADO', R = 'RECIBIDO', E = 'ENVIADO';
    const p1 = mk('CON', 'AR', 'Planta conjunto', { em: [['2026-10-12', R, 0, 'Primera emisión.'], ['2026-10-21', R, 0, 'Ajuste de accesos.'], ['2026-10-30', 'ANULADO', 0, 'Se envió el archivo equivocado.', 'Diego Ortiz'], ['2026-11-09', E, 0, 'Se corrigió la ruta de evacuación del nivel 2 según observación de CONRED.']] });
    p1.historial = [['Diego Ortiz registró la emisión V04', '9 nov, 11:20'], ['Andrea Luna anuló la V03: «Se envió el archivo equivocado»', '31 oct, 08:40'], ['Diego Ortiz avanzó la V02 a RECIBIDO', '23 oct, 14:05']];
    mk('CON', 'AR', 'Planta de evacuación', { em: [['2026-10-28', R]] });
    mk('CON', 'ES', 'Memoria estructural, planta', { em: [['2026-10-18', A]], terminado: true });
    mk('MUN', 'AR', 'Planta arquitectónica nivel 1', { em: [['2026-10-14', A]], terminado: true });
    mk('MUN', 'AR', 'Planta de techos', { em: [['2026-10-16', A]], terminado: true });
    mk('MUN', 'AR', 'Elevaciones', { por: 'Karla Juárez', creado: '2026-10-14', em: [['2026-10-15', 'ANULADO', 0, 'Institución equivocada: debía ir a CONRED.']], anulado: { fecha: '2026-11-06', quien: 'Andrea Luna', motivo: 'Institución equivocada: debía ir a CONRED' } });
    mk('MUN', 'ES', 'Planta de losas', { em: [['2026-10-20', A]], terminado: true });
    mk('MUN', 'ES', 'Detalles de vigas', { em: [['2026-10-22', R]] });
    mk('MUN', 'ES', 'Detalles de gradas', { em: [] });
    mk('MUN', 'ES', 'Planta de cimentación', { por: 'Luis Barrios', creado: '2026-11-02' });
    mk('OBR', 'ES', 'Cimentación para obra', { em: [['2026-10-25', V, 'Obra']], terminado: true });
    mk('OBR', 'EL', 'Planta de fuerza', { em: [['2026-10-26', V, 'Obra']], terminado: true });
    mk('OBR', 'EL', 'Planta de iluminación', { em: [['2026-10-27', V, 'Obra']], terminado: true });
    mk('MUN', 'HS', 'Detalle de cisterna', { por: 'Luis Barrios', em: [['2026-10-19', 'ANULADO', 0, 'Duplicado del plano de obra.']], anulado: { fecha: '2026-10-24', quien: 'Andrea Luna', motivo: 'Duplicado del plano de obra' } });
    /* Relleno para llegar a 33 planos (2 anulados, 18 terminados): arquitectura 12, estructura 8, eléctrica 6, hidrosanitaria 5 */
    const cuenta = (d) => planos.filter((p) => p.disc === d && !p.anulado).length;
    const objetivo = { AR: [12, 9], ES: [8, 4], EL: [6, 3], HS: [5, 2] };
    Object.keys(objetivo).forEach((d) => {
      const [total, term] = objetivo[d];
      let n = 0;
      while (cuenta(d) < total) {
        const t = REFERENCIA[d][n % REFERENCIA[d].length] + (n >= REFERENCIA[d].length ? ' · tipo ' + (Math.floor(n / REFERENCIA[d].length) + 1) : ''); n++;
        const hechos = planos.filter((p) => p.disc === d && !p.anulado && p.terminado).length;
        const t1 = hechos < term;
        mk(['CON', 'MUN', 'OBR'][n % 3], d, t, { terminado: t1, em: t1 ? [['2026-10-2' + (n % 9), A]] : (n % 2 ? [['2026-11-0' + (1 + n % 8), R]] : []) });
      }
    });
    const ext = mk('CON', 'AR', 'Levantamiento topográfico', { em: [['2026-10-14', V, 'Consultor']], terminado: true });
    ext.cup = 'DEMOPX-EXT-001'; ext.externo = { archivo: 'LEVANTAMIENTO_TOPO_final_v2', consultor: 'Consultor Demo Topografía', disc: 'Topografía' }; ext.inst = 'EXT'; ext.disc = 'EXT';
    return planos;
  }
  SEMILLA.planos = sembrarPlanos();
  SEMILLA.proyectos.forEach((p) => { p.planosBase = p.codigo === 'DEMOPX' ? [0, 0] : p.planos.slice(); });

  /* ---------- Hitos, pasos y cierre ---------- */
  /* «Hoy» de la maqueta: fijo, para que los atrasos de los datos de ejemplo no cambien con el calendario real. */
  const HOY = '2026-11-09';
  const FASES = ['Diseño', 'Licencias', 'Preliminares', 'Cimentación y estructura', 'Obra civil', 'Instalaciones', 'Acabados', 'Equipamiento', 'Cierre'];
  const CAT_POR_FASE = [
    ['Anteproyecto', 'Proyecto ejecutivo de arquitectura', 'Diseño estructural', 'Diseño de instalaciones', 'Presupuesto y programa', 'Estudio de suelos', 'Topografía', 'Renders y maqueta'],
    ['Licencia municipal de construcción', 'Estudio de impacto ambiental', 'Aprobación CONRED', 'Factibilidad de servicios', 'Licencia de rotulación', 'Seguro de obra'],
    ['Trazo y nivelación', 'Limpieza y demolición', 'Instalaciones provisionales', 'Movimiento de tierras', 'Bodega y cerramiento provisional', 'Acometida provisional'],
    ['Cimentación', 'Estructura metálica', 'Losas y entrepisos', 'Muros y mampostería', 'Estructura de techo', 'Gradas', 'Muros de contención'],
    ['Repellos y cernidos', 'Cielos y tabiques', 'Obra exterior', 'Drenajes pluviales', 'Banquetas y accesos', 'Techos y cubiertas', 'Cerramientos', 'Obra de urbanización'],
    ['Instalación eléctrica', 'Instalación hidrosanitaria', 'Aire acondicionado', 'Red de voz y datos', 'Sistema contra incendios', 'Gases especiales', 'Ascensores', 'Control de acceso', 'Energía solar'],
    ['Carpintería de aluminio', 'Impermeabilización', 'Pintura', 'Pisos y azulejos', 'Cielo falso', 'Carpintería de madera', 'Herrería', 'Vidrios y espejos', 'Acabados exteriores'],
    ['Mobiliario fijo', 'Equipo de cocina', 'Equipo médico', 'Señalización', 'Jardinización', 'Iluminación decorativa', 'Equipo de seguridad', 'Mobiliario suelto'],
    ['Limpieza final', 'Planos As-Built', 'Manuales y garantías', 'Recepción final', 'Liquidación del contrato', 'Entrega al cliente'],
  ];
  const p2 = (n) => String(n).padStart(2, '0');
  const CATALOGO = [];
  CAT_POR_FASE.forEach((lista, i) => lista.forEach((nombre, j) => CATALOGO.push({ cat: p2(i + 1) + '.' + p2(j + 1), nombre, fase: i + 1 })));
  const ESTADOS_HITO = ['Pendiente de cotizar', 'Cotizando', 'En comparación', 'Adjudicado', 'Contratado', 'En ejecución', 'Terminado', 'Liquidado'];
  const ENC = { dis: 'Diego Ortiz', jp: 'Jorge Pineda', cm: 'Carlos Méndez' };
  /* Los 10 pasos tipo: [nombre, encargado, día de inicio, día de fin, depende de]. Son una propuesta que la oficina debe validar. */
  const PASOS_TIPO = [
    ['Preparar bases de cotización y planos', 'dis', 0, 4], ['Solicitar cotizaciones', 'r', 7, 9], ['Recibir cotizaciones', 'r', 10, 18], ['Comparar cotizaciones', 'r', 21, 25],
    ['Negociar condiciones', 'jp', 28, 32, 4], ['Adjudicar', 'jp', 35, 36, 5], ['Firmar contrato', 'jp', 37, 39, 6], ['Anticipo e inicio', 'r', 42, 46],
    ['Ejecución', 'cm', 49, 102], ['Entrega y recepción', 'cm', 105, 109],
  ];
  const addDias = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const difDias = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);
  const estadoAuto = (k) => (k <= 1 ? ESTADOS_HITO[0] : k === 2 ? ESTADOS_HITO[1] : k <= 5 ? ESTADOS_HITO[2] : k === 6 ? ESTADOS_HITO[3] : k === 7 ? ESTADOS_HITO[4] : ESTADOS_HITO[5]);
  const cierreVacio = () => ({ asbuilt: { adj: null, ver: null }, garantia: null, liquidacion: null, retencion: null });

  /* Fecha de inicio tal que, a «hoy», exactamente k pasos ya vencieron según el programa (o k+1 si va atrasado). */
  function inicioPara(k, tarde, idx) {
    const off = PASOS_TIPO.map((t) => t[3]);
    let h;
    if (k >= 10) h = 125 + (idx * 5) % 40;
    else if (k === 0) h = 2;
    else { const a = off[k - 1], b = off[k]; h = a + Math.ceil((b - a) / 2); }
    if (tarde && k < 10) h = off[k] + 1;
    return addDias(HOY, -h);
  }
  function crearPasos(inicio, resp, k, idx) {
    return PASOS_TIPO.map((t, i) => {
      const fin = addDias(inicio, t[3]), hecho = i < k;
      let real = null;
      if (hecho) { real = fin <= HOY ? fin : HOY; if (real < HOY && (idx * 7 + i) % 11 === 0) real = addDias(real, 1); }
      return { n: i + 1, nombre: t[0], enc: t[1] === 'r' ? resp : ENC[t[1]], ini: addDias(inicio, t[2]), fin, dep: t[4] || null, hecho, real };
    });
  }
  /* proy, cat, k pasos hechos, opciones: resp, contr, estado, tarde, inicio */
  function sembrarHito(proy, cat, k, o, idx) {
    const c = CATALOGO.find((x) => x.cat === cat);
    const resp = o.resp || 'Paola Ruiz';
    const inicio = o.inicio || inicioPara(k, o.tarde, idx);
    const estado = o.estado || estadoAuto(k);
    const h = { proyecto: proy, cat, nombre: c.nombre, fase: c.fase, estado, resp, contratista: estado === 'Pendiente de cotizar' || estado === 'Cotizando' || estado === 'En comparación' ? '' : (o.contr || 'Contratista Demo'), visible: true, pasos: crearPasos(inicio, resp, k, idx), notas: [], cierre: cierreVacio(), excepcion: null, historial: [] };
    const fin = h.pasos[9].real || h.pasos[9].fin;
    if (estado === 'Terminado' || estado === 'Liquidado') {
      h.cierre.asbuilt.adj = { nombre: 'ASBUILT_' + proy + '_' + cat.replace('.', '-') + '.pdf', hash: hash(proy + cat), por: 'Carlos Méndez', fecha: fin };
      h.cierre.asbuilt.ver = { por: 'Carlos Méndez', fecha: fin };
      h.cierre.garantia = { por: 'Carlos Méndez', fecha: fin };
    }
    if (estado === 'Liquidado') { h.cierre.liquidacion = { por: 'Mariana Solís', fecha: fin }; h.cierre.retencion = { por: 'Mariana Solís', fecha: fin }; }
    return h;
  }
  function sembrarHitos() {
    const L = 'Liquidado', T = 'Terminado';
    const spec = {
      DEMOPX: [['01.01', 10, { estado: L }], ['01.02', 10, { estado: T }], ['02.01', 10, { estado: T, resp: 'Sofía Cabrera' }], ['02.02', 10, { estado: T, resp: 'Sofía Cabrera' }], ['02.03', 10, { estado: T, resp: 'Sofía Cabrera' }],
        ['03.01', 10, { estado: L, resp: 'Carlos Méndez' }], ['03.02', 10, { estado: T, resp: 'Carlos Méndez' }],
        ['04.01', 10, { estado: L, resp: 'Carlos Méndez', contr: 'Constructora Demo Uno' }], ['04.02', 3, { tarde: true, inicio: '2026-10-12' }], ['04.03', 8, { resp: 'Carlos Méndez', contr: 'Constructora Demo Uno' }],
        ['04.04', 10, { estado: T, resp: 'Carlos Méndez', contr: 'Constructora Demo Uno' }], ['04.05', 9, { resp: 'Carlos Méndez', contr: 'Estructuras Demo' }],
        ['05.01', 10, { estado: T, contr: 'Acabados Demo' }], ['05.02', 4, { inicio: '2026-10-14' }],
        ['06.01', 7, { resp: 'Jorge Pineda', contr: 'Eléctricos Demo' }], ['06.02', 6, { resp: 'Jorge Pineda', contr: 'Hidráulica Demo' }], ['06.03', 0, { resp: 'Jorge Pineda' }], ['06.04', 0, { resp: 'Jorge Pineda' }],
        ['07.01', 2, {}], ['07.02', 5, { inicio: '2026-10-08' }], ['07.03', 0, {}], ['07.04', 0, {}], ['07.05', 0, {}], ['07.06', 0, {}]],
      BODEGA1: [['01.01', 10, { estado: L }], ['02.01', 10, { estado: T }], ['03.01', 10, { estado: T }], ['04.01', 6, { tarde: true, contr: 'Constructora Demo Dos' }], ['04.02', 3, { tarde: true }], ['06.01', 0, { resp: 'Jorge Pineda' }]],
      CLINICA: [['01.01', 10, { estado: L }], ['02.01', 10, { estado: L }], ['02.03', 10, { estado: L }], ['03.01', 10, { estado: L }], ['04.01', 10, { estado: L }], ['04.02', 10, { estado: T }], ['06.01', 9, { resp: 'Jorge Pineda', contr: 'Eléctricos Demo' }], ['07.01', 7, { contr: 'Aluminios Demo' }]],
      CASALAG: ['01.01', '02.01', '03.01', '04.01', '05.01', '07.01', '07.03'].map((c) => [c, 10, { estado: L }]),
      LOCAL01: ['01.01', '02.01', '04.01', '05.01', '07.01'].map((c) => [c, 10, { estado: L }]),
    };
    const out = []; let idx = 0;
    Object.keys(spec).forEach((proy) => spec[proy].forEach(([cat, k, o]) => out.push(sembrarHito(proy, cat, k, o, idx++))));
    out.filter((h) => h.proyecto === 'DEMOPX' && h.cat === '04.02').forEach((h) => {
      h.notas = [
        { por: 'Paola Ruiz', texto: 'Llegaron 3 cotizaciones; una no incluye montaje. Pedí aclaración.', fecha: '2026-11-03', hora: '10:12', origen: '' },
        { por: 'Jorge Pineda', texto: 'El cliente pide que la estructura quede vista en el lobby. Revisar acabado con Arquitectura.', fecha: '2026-10-28', hora: '16:40', origen: 'de la minuta del 28 oct' },
      ];
      h.pasos[1].real = '2026-10-22';
    });
    return out;
  }
  SEMILLA.hitos = sembrarHitos();

  /* ---------- Definiciones del cliente y enlaces para compartir ---------- */
  SEMILLA.definiciones = [
    { id: 'D1', proyecto: 'DEMOPX', titulo: 'Acabado de fachada', detalle: 'Panel compuesto o repello con pintura', afecta: ['07.03', '07.05'], decide: 'Cliente Demo', limite: '2026-11-12', estado: 'pendiente', decision: null },
    { id: 'D2', proyecto: 'DEMOPX', titulo: 'Marca de luminarias del lobby', detalle: '', afecta: ['06.01'], decide: 'Cliente Demo', limite: '2026-11-02', estado: 'pendiente', decision: null },
    { id: 'D3', proyecto: 'DEMOPX', titulo: 'Estructura vista en el lobby', detalle: '', afecta: ['04.02'], decide: 'Cliente Demo', limite: '2026-10-30', estado: 'decidida', decision: { texto: 'Sí, queda vista con pintura intumescente.', por: 'Jorge Pineda', fecha: '2026-10-29' } },
  ];
  SEMILLA.enlaces = [
    { id: 'E1', proyecto: 'DEMOPX', creado: '2026-11-02', por: 'Jorge Pineda', vence: '2026-11-09', visitas: 5, ultima: '2026-11-08', revocado: false, token: 'a7q2-m9zx-31kd-w8le' },
    { id: 'E2', proyecto: 'DEMOPX', creado: '2026-10-19', por: 'Mariana Solís', vence: '2026-10-26', visitas: 3, ultima: '2026-10-24', revocado: false, token: 'k3vn-0pcj-82ru-h5ta' },
    { id: 'E3', proyecto: 'DEMOPX', creado: '2026-10-12', por: 'Mariana Solís', vence: '2026-10-19', visitas: 1, ultima: '2026-10-13', revocado: true, token: 'z9ms-4dqe-17yb-c6ow' },
  ];
  SEMILLA.proyectos.forEach((p) => { p.creadoPor = 'Mariana Solís'; if (p.estado === 'terminado') { p.terminadoFecha = '2026-10-30'; p.terminadoPor = 'Mariana Solís'; } });
  SEMILLA.hitos.filter((h) => h.proyecto === 'DEMOPX' && h.cat === '04.02').forEach((h) => { h.historial = [['Paola Ruiz marcó hecho el paso 2 «Solicitar cotizaciones»', 'Ayer, 16:45']]; });


  /* ---------- Minutas y bitácora (historial) ---------- */
  const cm = (id, texto, enc, fecha, estado) => ({ id, texto, enc, fecha, estado });
  SEMILLA.minutas = [
    { id: 'M3', proyecto: 'DEMOPX', nombre: 'Reunión semanal de obra', fecha: '2026-11-04', por: 'Jorge Pineda', asistentes: 6, temas: [
      { id: 'M3T1', nombre: 'Estructura metálica', hito: '04.02', comentarios: [cm('M3T1C1', 'Confirmar plazo de entrega con el proveedor', 'Paola Ruiz', '2026-11-13', 'abierto'), cm('M3T1C2', 'Enviar al cliente la comparación de alternativas', 'Jorge Pineda', '2026-11-06', 'cerrado'), cm('M3T1C3', 'Revisar acabado visto en el lobby', 'Andrea Luna', '2026-11-05', 'cerrado')] },
      { id: 'M3T2', nombre: 'Fachada', hito: '07.03', comentarios: [cm('M3T2C1', 'Presentar muestras de acabado al cliente', 'Andrea Luna', '2026-11-06', 'abierto'), cm('M3T2C2', 'Registrar la definición del cliente sobre el acabado', 'Jorge Pineda', '2026-11-12', 'abierto')] },
      { id: 'M3T3', nombre: 'Seguridad en obra', hito: null, comentarios: [cm('M3T3C1', 'Colocar señalización provisional en el nivel 2', 'Mario Tello', '2026-11-05', 'cerrado')] } ] },
    { id: 'M2', proyecto: 'DEMOPX', nombre: 'Reunión con el cliente', fecha: '2026-10-28', por: 'Mariana Solís', asistentes: 4, temas: [
      { id: 'M2T1', nombre: 'Estructura vista en el lobby', hito: '04.02', comentarios: [cm('M2T1C1', 'Pedir al cliente la decisión por escrito', 'Jorge Pineda', '2026-10-30', 'cerrado')] },
      { id: 'M2T2', nombre: 'Acabados del lobby', hito: null, comentarios: [cm('M2T2C1', 'Enviar catálogo de pisos', 'Andrea Luna', '2026-10-31', 'cerrado'), cm('M2T2C2', 'Definir color de carpintería', 'Diego Ortiz', '2026-11-12', 'abierto')] },
      { id: 'M2T3', nombre: 'Calendario de entregas', hito: null, comentarios: [cm('M2T3C1', 'Compartir el cronograma actualizado', 'Mariana Solís', '2026-10-29', 'cerrado')] },
      { id: 'M2T4', nombre: 'Permisos', hito: null, comentarios: [cm('M2T4C1', 'Confirmar fecha de la licencia municipal', 'Paola Ruiz', '2026-10-30', 'cerrado')] } ] },
    { id: 'M1', proyecto: 'DEMOPX', nombre: 'Reunión semanal de obra', fecha: '2026-10-21', por: 'Jorge Pineda', asistentes: 5, temas: [
      { id: 'M1T1', nombre: 'Cimentación', hito: null, comentarios: [cm('M1T1C1', 'Entregar el informe de suelos', 'Carlos Méndez', '2026-10-24', 'cerrado')] },
      { id: 'M1T2', nombre: 'Seguridad en obra', hito: null, comentarios: [cm('M1T2C1', 'Revisar el plan de seguridad', 'Mario Tello', '2026-10-25', 'cerrado')] } ] },
    { id: 'M4', proyecto: 'CLINICA', nombre: 'Reunión de coordinación', fecha: '2026-11-04', por: 'Carlos Méndez', asistentes: 4, temas: [
      { id: 'M4T1', nombre: 'Barandas', hito: null, comentarios: [cm('M4T1C1', 'Revisar detalle de barandas', 'Diego Ortiz', '2026-11-13', 'abierto')] } ] },
  ];
  /* Bitácora: lo que no vive dentro de un hito o un plano (minutas, cuentas, definiciones…). cuando = «Hoy, 16:52» | «Ayer, …» | «6 nov, …» */
  const ev = (cuando, txt, cambio, tipo, proy) => ({ cuando, txt, cambio: cambio || '', tipo, proy: proy || '' });
  SEMILLA.bitacora = [
    ev('Hoy, 16:52', 'Mariana Solís invitó a Ana Morales', 'cuenta · rol: Equipo · puesto: Arquitecta de proyectos', 'Cuentas'),
    ev('6 nov, 09:10', 'Karla Juárez anuló el plano DEMOPX-MUNAR-003', 'motivo: «Institución equivocada: debía ir a CONRED»', 'Planos y emisiones', 'DEMOPX'),
    ev('4 nov, 17:30', 'Jorge Pineda guardó la minuta «Reunión semanal de obra»', '3 temas · 6 comentarios', 'Minutas', 'DEMOPX'),
    ev('4 nov, 17:05', 'Carlos Méndez guardó la minuta «Reunión de coordinación»', '1 tema · 1 comentario', 'Minutas', 'CLINICA'),
    ev('30 oct, 18:02', 'Carlos Méndez desactivó la cuenta de Byron Ajú', 'motivo: «Terminó su contrato»', 'Cuentas'),
    ev('30 oct, 12:15', 'Jorge Pineda registró la decisión del cliente «Estructura vista en el lobby»', 'decisión: Sí, queda vista con pintura intumescente', 'Definiciones del cliente', 'DEMOPX'),
    ev('28 oct, 17:40', 'Mariana Solís guardó la minuta «Reunión con el cliente»', '4 temas · 5 comentarios', 'Minutas', 'DEMOPX'),
  ];

  /* ---------- Usuarios (cuentas) ---------- */
  const us = (id, nombre, puesto, area, rol, ultimo, o) => Object.assign({ id, nombre, correo: id + '@demo.test', puesto, area, rol, estado: 'activa', ultimo, desde: '2026-09-14', invitadoPor: 'Mariana Solís', invitacion: null, baja: null }, o || {});
  SEMILLA.usuarios = [
    us('ana', 'Ana Morales', 'Arquitecta de proyectos', 'Arquitectura', 'equipo', 'Aún no entra', { estado: 'pendiente', desde: '2026-11-09', invitacion: { enviada: '2026-11-09', caduca: '2026-11-16', por: 'Mariana Solís' } }),
    us('roberto', 'Roberto Castañeda', 'Fundador', 'Dirección', 'gerencia', 'Ayer, 17:40', { desde: '2026-08-01' }),
    us('mariana', 'Mariana Solís', 'Gerente General', 'Dirección', 'gerencia', 'Hoy, 08:12', { desde: '2026-08-01' }),
    us('jorge', 'Jorge Pineda', 'Gerente de Presupuestos', 'Presupuestos', 'gerencia', 'Hoy, 07:55', { desde: '2026-08-01' }),
    us('andrea', 'Andrea Luna', 'Gerente de Arquitectura', 'Arquitectura', 'gerencia', 'Hoy, 09:03', { desde: '2026-08-01' }),
    us('carlos', 'Carlos Méndez', 'Gerente de Supervisión', 'Supervisión', 'gerencia', '6 nov 2026', { desde: '2026-08-01' }),
    us('paola', 'Paola Ruiz', 'Gestión de presupuestos', 'Presupuestos', 'equipo', 'Hoy, 08:30'),
    us('sofia', 'Sofía Cabrera', 'Gestión de licencias', 'Presupuestos', 'equipo', 'Hoy, 10:15'),
    us('diego', 'Diego Ortiz', 'Arquitecto diseñador', 'Arquitectura', 'equipo', 'Hoy, 08:02', { desde: '2026-10-12' }),
    us('luis', 'Luis Barrios', 'Arquitecto de proyectos', 'Arquitectura', 'equipo', 'Ayer, 16:20'),
    us('karla', 'Karla Juárez', 'Arquitecta de proyectos', 'Arquitectura', 'equipo', 'Hoy, 11:47'),
    us('mario', 'Mario Tello', 'Auxiliar de supervisión', 'Supervisión', 'equipo', 'Hoy, 06:58'),
    us('soporte', 'Soporte Demo', 'Soporte técnico', 'Sistemas', 'soporte', 'Hoy, 16:22', { desde: '2026-08-01' }),
    us('byron', 'Byron Ajú', 'Auxiliar de supervisión', 'Supervisión', 'equipo', '30 oct 2026', { estado: 'desactivada', baja: { por: 'Carlos Méndez', fecha: '2026-10-30', motivo: 'Terminó su contrato' } }),
  ];

  SEMILLA.avisos = [
    { id: 'av1', cuando: 'Faltan 15 días para la fecha contratada y el hito sigue pendiente de cotizar', quien: 'Responsable y Gerente de Presupuestos', como: 'En Hoy y por correo', activo: true },
    { id: 'av2', cuando: 'El día que vence un paso o un comentario de minuta', quien: 'Encargado', como: 'En Hoy', activo: true },
    { id: 'av3', cuando: '3 días antes de la fecha límite de una definición del cliente', quien: 'Quien la registró', como: 'En Hoy y por correo', activo: true },
    { id: 'av4', cuando: 'Resumen semanal, lunes 7:00', quien: 'Gerencia', como: 'Por correo', activo: false },
  ];
  const copia = (o) => JSON.parse(JSON.stringify(o));
  let datos;
  function cargar() {
    try { const t = localStorage.getItem(CLAVE); if (t) return JSON.parse(t); } catch (e) { /* sin almacenamiento: usa memoria */ }
    return copia(SEMILLA);
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* igual */ } }
  datos = cargar();
  if (!datos.planos) datos.planos = copia(SEMILLA.planos);
  if (!datos.hitos) datos.hitos = copia(SEMILLA.hitos);
  if (!datos.definiciones) datos.definiciones = copia(SEMILLA.definiciones);
  if (!datos.enlaces) datos.enlaces = copia(SEMILLA.enlaces);
  if (!datos.usuarios) datos.usuarios = copia(SEMILLA.usuarios);
  if (!datos.avisos) datos.avisos = copia(SEMILLA.avisos);
  if (!datos.minutas) datos.minutas = copia(SEMILLA.minutas);
  if (!datos.bitacora) datos.bitacora = copia(SEMILLA.bitacora);


  const quitarTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  GRU.db = {
    clientes: () => datos.clientes.filter((c) => !catalogo().clientesOff.includes(c)),
    proyectos: () => datos.proyectos.slice(),
    proyecto: (codigo) => datos.proyectos.find((p) => p.codigo === codigo),
    /* Código propuesto desde el nombre: mayúsculas, sin tildes ni símbolos, hasta 8 caracteres. */
    proponerCodigo(nombre) {
      const palabras = quitarTildes(nombre).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
      let c = palabras.length > 1 ? palabras.map((w) => w.slice(0, 3)).join('') : (palabras[0] || '');
      return c.slice(0, 8);
    },
    codigoValido: (c) => /^[A-Z0-9]{2,8}$/.test(c),
    codigoExiste: (c) => datos.proyectos.some((p) => p.codigo === c),
    crearProyecto({ nombre, codigo, cliente, depto, municipio, direccion }) {
      const hoy = new Date().toISOString().slice(0, 10);
      const p = { codigo, nombre, cliente, depto, municipio, direccion: direccion || '', estado: 'activo', creado: hoy, prog: 0, real: 0, planos: [0, 0], planosBase: [0, 0], atrasados: 0, hitos: 0 };
      datos.proyectos.unshift(p);
      if (cliente && !datos.clientes.includes(cliente)) datos.clientes.push(cliente);
      guardar();
      return p;
    },

    /* ---------- Planos y emisiones ---------- */
    INST, DISC, USOS, ESTADOS, REFERENCIA: REFERENCIA_UI,
    planos: (proy) => datos.planos.filter((p) => p.proyecto === proy),
    plano: (cup) => datos.planos.find((p) => p.cup === cup),
    ultima(p) { const v = p.emisiones.filter((e) => !e.anulada); return v[v.length - 1] || null; },
    /* Estado visible de un plano: ANULADO, SIN EMISIÓN o el de su última emisión vigente. */
    estadoPlano(p) { if (p.anulado) return 'ANULADO'; const u = this.ultima(p); return u ? u.estado : 'SIN EMISIÓN'; },
    avance(proy) {
      const vivos = datos.planos.filter((p) => p.proyecto === proy && !p.anulado && !p.externo);   /* los planos de consultores se catalogan aparte */
      const por = {};
      vivos.forEach((p) => { const k = p.disc === 'EXT' ? 'Consultores' : DISC[p.disc][0]; por[k] = por[k] || [0, 0]; por[k][1]++; if (p.terminado) por[k][0]++; });
      return { hechos: vivos.filter((p) => p.terminado).length, total: vivos.length, anulados: datos.planos.filter((p) => p.proyecto === proy && p.anulado && !p.externo).length, porDisciplina: por };
    },
    /* El CUP se reserva por proyecto + institución + disciplina y NUNCA se reutiliza (los anulados siguen contando). */
    siguienteCup(proy, inst, disc) {
      const pref = proy + '-' + inst + disc + '-';
      const n = datos.planos.filter((p) => p.cup.startsWith(pref)).length + 1;
      return pref + String(n).padStart(3, '0');
    },
    siguienteCupExterno(proy) { return proy + '-EXT-' + String(datos.planos.filter((p) => p.cup.startsWith(proy + '-EXT-')).length + 1).padStart(3, '0'); },
    evento(p, txt) { p.historial.unshift([txt, 'Hoy, ' + new Date().toTimeString().slice(0, 5), Date.now()]); },
    crearPlano({ proyecto, inst, disc, titulo, por }) {
      const p = { proyecto, cup: this.siguienteCup(proyecto, inst, disc), inst, disc, titulo, creadoPor: por, creado: new Date().toISOString().slice(0, 10), terminado: false, anulado: null, emisiones: [], historial: [] };
      this.evento(p, por + ' creó el plano'); datos.planos.push(p); this.recalcular(proyecto); guardar(); return p;
    },
    crearPlanoExterno({ proyecto, archivo, consultor, disc, por }) {
      const p = { proyecto, cup: this.siguienteCupExterno(proyecto), inst: 'EXT', disc: 'EXT', titulo: archivo, externo: { archivo, consultor, disc }, creadoPor: por, creado: new Date().toISOString().slice(0, 10), terminado: false, anulado: null, emisiones: [], historial: [] };
      this.evento(p, por + ' registró el plano externo'); datos.planos.push(p); this.recalcular(proyecto); guardar(); return p;
    },
    guardarTitulo(p, titulo) { if (p.emisiones.length) return false; p.titulo = titulo; guardar(); return true; },
    marcarTerminado(p, v) { p.terminado = !!v; this.recalcular(p.proyecto); guardar(); },
    /* Nombre del PDF según el Manual: CODIGO_INSTITUCION_ABREV_TITULO_V##_DDMMMYY_ESTADO.pdf (mayúsculas, sin tildes, espacios a _). */
    nombreArchivo(p, v, fechaIso, estado, ext) {
      const limpio = (t) => sinTildes(t).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
      return [p.proyecto, INST[p.inst][1], DISC[p.disc][1], limpio(p.titulo), 'V' + String(v).padStart(2, '0'), ddmmmyy(fechaIso), estado].join('_') + '.' + (ext || 'pdf');
    },
    registrarEmision(p, { fecha, uso, motivo, final, hashPdf, hashEd, por }) {
      const v = p.emisiones.length + 1;
      const e = { v, fecha, estado: 'ENVIADO', uso, motivo, quien: por, anulada: false, final: !!final, hashPdf, hashEd: hashEd || '' };
      if (e.final) p.emisiones.forEach((x) => { x.final = false; });
      p.emisiones.push(e); this.evento(p, por + ' registró la emisión V' + String(v).padStart(2, '0')); guardar(); return e;
    },
    avanzarEstado(p, e, estado, por) { e.estado = estado; this.evento(p, por + ' avanzó la V' + String(e.v).padStart(2, '0') + ' a ' + estado); guardar(); },
    anularEmision(p, e, motivo, por) { e.estado = 'ANULADO'; e.anulada = true; this.evento(p, por + ' anuló la V' + String(e.v).padStart(2, '0') + ': «' + motivo + '»'); guardar(); },
    /* El resumen de planos de cada proyecto sale de sus planos reales cuando los tiene. */
    recalcular(proy) { const p = datos.proyectos.find((x) => x.codigo === proy); if (!p) return; const a = this.avance(proy), b = p.planosBase || [0, 0]; p.planos = [b[0] + a.hechos, b[1] + a.total]; },
    ddmmmyy,
    /* ---------- Proyecto: ficha, cierre ---------- */
    guardarDrive(proy, url) { const p = this.proyecto(proy); p.drive = url; this.bitacora('Se agregó el enlace de Drive de ' + proy, '', 'Proyectos', proy); guardar(); },
    editarFicha(proy, { nombre, direccion }) { const p = this.proyecto(proy); p.nombre = nombre; p.direccion = direccion; this.bitacora('Se editó la ficha de ' + proy, 'nombre: ' + nombre, 'Proyectos', proy); guardar(); },
    /* Lo que falta para dar por terminado un proyecto. */
    faltasProyecto(proy) {
      const hs = this.hitos(proy), pl = datos.planos.filter((x) => x.proyecto === proy && !x.anulado && !x.externo);
      return { hitos: hs.filter((h) => !this.cerrado(h)).length, planos: pl.filter((x) => !x.terminado).length, sinHitos: hs.length === 0 };
    },
    terminarProyecto(proy, por) { const p = this.proyecto(proy); p.estado = 'terminado'; p.terminadoFecha = HOY; p.terminadoPor = por; this.bitacora(por + ' dio por terminado el proyecto ' + proy, '', 'Proyectos', proy); guardar(); },
    reabrirProyecto(proy) { const p = this.proyecto(proy); p.estado = 'activo'; delete p.terminadoFecha; delete p.terminadoPor; this.bitacora('Se reabrió el proyecto ' + proy, '', 'Proyectos', proy); guardar(); },

    /* ---------- Definiciones del cliente ---------- */
    definiciones: (proy) => datos.definiciones.filter((d) => d.proyecto === proy).sort((a, b) => (a.estado === b.estado ? a.limite.localeCompare(b.limite) : a.estado === 'pendiente' ? -1 : 1)),
    pendientesDef(proy) { return this.definiciones(proy).filter((d) => d.estado === 'pendiente'); },
    /* Días que faltan para la fecha límite (negativo = vencida). */
    diasDef(d) { return this.difDias(HOY, d.limite); },
    crearDefinicion(proy, { titulo, limite, decide, afecta, detalle }, por) {
      const d = { id: 'D' + (datos.definiciones.length + 1) + Date.now().toString(36), proyecto: proy, titulo, detalle: detalle || '', afecta: afecta || [], decide, limite, estado: 'pendiente', decision: null, creadaPor: por };
      datos.definiciones.push(d); this.bitacora(por + ' creó la definición del cliente «' + titulo + '»', 'límite: ' + limite + ' · decide: ' + decide, 'Definiciones del cliente', proy); guardar(); return d;
    },
    /* Una decisión registrada no se edita. */
    registrarDecision(id, texto, por) { const d = datos.definiciones.find((x) => x.id === id); if (!d || d.estado === 'decidida') return false; d.estado = 'decidida'; d.decision = { texto, por, fecha: HOY }; this.bitacora(por + ' registró la decisión del cliente «' + d.titulo + '»', 'decisión: ' + texto, 'Definiciones del cliente', d.proyecto); guardar(); return true; },

    /* ---------- Enlaces para compartir ---------- */
    enlaces: (proy) => datos.enlaces.filter((e) => e.proyecto === proy).sort((a, b) => b.creado.localeCompare(a.creado) || b.id.localeCompare(a.id)),
    estadoEnlace: (e) => (e.revocado ? 'REVOCADO' : e.vence < HOY ? 'VENCIDO' : 'ACTIVO'),
    crearEnlace(proy, dias, por) {
      const bloque = () => Math.random().toString(36).slice(2, 6).padEnd(4, '0');
      const e = { id: 'E' + Date.now().toString(36), proyecto: proy, creado: HOY, hora: new Date().toTimeString().slice(0, 5), por, vence: addDias(HOY, dias), visitas: 0, ultima: null, revocado: false, token: [bloque(), bloque(), bloque(), bloque()].join('-') };
      datos.enlaces.push(e); this.bitacora(por + ' creó un enlace para compartir', 'vence ' + e.vence, 'Cuentas y enlaces', proy); guardar(); return e;
    },
    revocarEnlace(id) { const e = datos.enlaces.find((x) => x.id === id); if (e) { e.revocado = true; this.bitacora('Se revocó un enlace para compartir', 'creado el ' + e.creado + ' por ' + e.por, 'Cuentas y enlaces', e.proyecto); guardar(); } },
    enlacePorToken: (t) => datos.enlaces.find((e) => e.token === t),
    /* Alguien abre el enlace: cuenta la visita solo si sigue activo. */
    visitar(token) { const e = this.enlacePorToken(token); if (e && this.estadoEnlace(e) === 'ACTIVO') { e.visitas++; e.ultima = HOY; guardar(); } return e; },
    /* Lo que ve el cliente: solo hitos visibles y planos aprobados o vigentes de uso externo. */
    planosParaCliente(proy) {
      return datos.planos.filter((x) => x.proyecto === proy && !x.anulado && !x.externo).map((x) => ({ x, u: this.ultima(x) }))
        .filter(({ u }) => u && (u.estado === 'APROBADO' || u.estado === 'VIGENTE') && (u.uso === 'Entrega a institución' || u.uso === 'Obra'));
    },
    /* ---------- Hitos, pasos y cierre ---------- */
    HOY, FASES, CATALOGO, ESTADOS_HITO, RESPONSABLES: ['Paola Ruiz', 'Jorge Pineda', 'Carlos Méndez', 'Sofía Cabrera'], addDias, difDias, estadoAuto,
    hitos: (proy) => datos.hitos.filter((h) => h.proyecto === proy).sort((a, b) => a.cat.localeCompare(b.cat)),
    hito: (proy, cat) => datos.hitos.find((h) => h.proyecto === proy && h.cat === cat),
    hechos: (h) => h.pasos.filter((p) => p.hecho).length,
    cerrado: (h) => h.estado === 'Terminado' || h.estado === 'Liquidado',
    /* El avance NO se escribe: sale de los pasos hechos (todos pesan igual). Un hito terminado vale 100. */
    avanceHito(h) { return this.cerrado(h) ? 100 : Math.round(this.hechos(h) / h.pasos.length * 100); },
    programadoHito(h) { if (this.cerrado(h)) return 100; const f = h.pasos.filter((p) => p.fin); return f.length ? Math.round(f.filter((p) => p.fin <= HOY).length / h.pasos.length * 100) : 0; },
    tieneFechas: (h) => h.pasos.some((p) => p.fin),
    fechaContratada: (h) => (h.pasos[6] && h.pasos[6].fin) || null,
    finPrevisto: (h) => h.pasos.reduce((m, p) => (p.fin && (!m || p.fin > m) ? p.fin : m), null),
    inicioPrevisto: (h) => h.pasos.reduce((m, p) => (p.ini && (!m || p.ini < m) ? p.ini : m), null),
    /* Primer paso sin hacer cuya fecha ya pasó. */
    pasoAtrasado(h) {
      if (this.cerrado(h)) return null;
      const p = h.pasos.find((x) => !x.hecho && x.fin && x.fin < HOY);
      return p ? { paso: p, dias: difDias(p.fin, HOY) } : null;
    },
    alerta(h) {
      if (this.cerrado(h)) return null;
      if (this.pasoAtrasado(h)) return 'ATRASADO';
      const fc = this.fechaContratada(h);
      if (fc && ESTADOS_HITO.indexOf(h.estado) < 4 && difDias(HOY, fc) >= 0 && difDias(HOY, fc) <= 15) return 'POR VENCER';
      return null;
    },
    resumenHitos(proy) {
      const hs = this.hitos(proy), n = hs.length, suma = (f) => hs.reduce((a, h) => a + f(h), 0);
      return { n, terminados: hs.filter((h) => this.cerrado(h)).length, real: n ? Math.round(suma((h) => this.avanceHito(h)) / n) : 0, prog: n ? Math.round(suma((h) => this.programadoHito(h)) / n) : 0,
        atrasados: hs.filter((h) => this.alerta(h) === 'ATRASADO').length, porVencer: hs.filter((h) => this.alerta(h) === 'POR VENCER').length, pendientes: hs.filter((h) => h.estado === 'Pendiente de cotizar').length };
    },
    /* Los números de la tarjeta del proyecto salen de sus hitos reales. */
    recalcularHitos(proy) { const p = datos.proyectos.find((x) => x.codigo === proy); if (!p) return; const r = this.resumenHitos(proy); p.hitos = r.n; p.prog = r.prog; p.real = r.real; p.atrasados = r.atrasados; },
    evH(h, txt) { h.historial.unshift([txt, 'Hoy, ' + new Date().toTimeString().slice(0, 5), Date.now()]); },
    agregarHitos(proy, cats, por) {
      const nuevos = [];
      cats.forEach((cat) => {
        const c = CATALOGO.find((x) => x.cat === cat); if (!c || this.hito(proy, cat)) return;
        const h = { proyecto: proy, cat, nombre: c.nombre, fase: c.fase, estado: ESTADOS_HITO[0], resp: 'Sin asignar', contratista: '', visible: true,
          pasos: PASOS_TIPO.map((t, i) => ({ n: i + 1, nombre: t[0], enc: t[1] === 'r' ? 'Sin asignar' : ENC[t[1]], ini: null, fin: null, dep: t[4] || null, hecho: false, real: null })), notas: [], cierre: cierreVacio(), excepcion: null, historial: [] };
        this.evH(h, por + ' agregó el hito'); datos.hitos.push(h); nuevos.push(h);
      });
      this.recalcularHitos(proy); guardar(); return nuevos;
    },
    /* Calcula las fechas de los pasos tipo a partir de un día de inicio. */
    programarHito(h, inicio, por) {
      h.pasos.forEach((p, i) => { if (PASOS_TIPO[i]) { p.ini = addDias(inicio, PASOS_TIPO[i][2]); p.fin = addDias(inicio, PASOS_TIPO[i][3]); } });
      this.evH(h, por + ' programó los pasos desde el ' + inicio); this.recalcularHitos(h.proyecto); guardar();
    },
    /* Personas que pueden ser responsables: cuentas activas de Gerencia y Equipo, más quien ya figure en algún hito. */
    responsables() {
      const act = datos.usuarios.filter((u) => u.estado === 'activa' && u.rol !== 'soporte').map((u) => u.nombre);
      const en = datos.hitos.map((h) => h.resp).filter((n) => n && n !== 'Sin asignar');
      return [...new Set(this.RESPONSABLES.concat(act, en))].sort((a, b) => a.localeCompare(b, 'es'));
    },
    PRIORIDADES: ['Alta', 'Normal', 'Baja'],
    marcarPaso(h, n, hecho, por) {
      if (this.cerrado(h)) return false;
      const p = h.pasos.find((x) => x.n === n); if (!p) return false;
      p.hecho = !!hecho; p.real = hecho ? HOY : null;
      h.estado = estadoAuto(this.hechos(h));
      this.evH(h, por + (hecho ? ' marcó hecho' : ' reabrió') + ' el paso ' + n); this.recalcularHitos(h.proyecto); guardar(); return true;
    },
    /* Pasos que dependen (directa o indirectamente) del paso n. */
    dependientes(h, n) { const out = []; let cambio = true; while (cambio) { cambio = false; h.pasos.forEach((p) => { if (p.dep && (p.dep === n || out.includes(p.dep)) && !out.includes(p.n)) { out.push(p.n); cambio = true; } }); } return out.sort((a, b) => a - b); },
    /* Mueve un paso (conserva su duración). Si recorrer, también mueve a los que dependen de él. */
    moverPaso(h, n, nuevaFin, enc, recorrer, por) {
      const p = h.pasos.find((x) => x.n === n); if (!p) return;
      const antes = this.fechaContratada(h);
      if (enc) p.enc = enc;
      if (nuevaFin && p.fin && nuevaFin !== p.fin) {
        const d = difDias(p.fin, nuevaFin), lista = [n].concat(recorrer ? this.dependientes(h, n) : []);
        h.pasos.filter((x) => lista.includes(x.n)).forEach((x) => { x.ini = addDias(x.ini, d); x.fin = addDias(x.fin, d); });
        this.evH(h, por + ' movió el paso ' + n + ' ' + (d > 0 ? '+' : '') + d + ' días' + (recorrer && lista.length > 1 ? ' y recorrió ' + (lista.length - 1) + ' dependientes' : ''));
      } else if (nuevaFin && !p.fin) { p.ini = nuevaFin; p.fin = nuevaFin; }
      this.recalcularHitos(h.proyecto); guardar(); return { antes, despues: this.fechaContratada(h) };
    },
    agregarPaso(h, { nombre, enc, fin }, por) {
      h.pasos.push({ n: h.pasos.length + 1, nombre, enc, ini: fin || null, fin: fin || null, dep: null, hecho: false, real: null });
      if (!this.cerrado(h)) h.estado = estadoAuto(this.hechos(h)) === ESTADOS_HITO[5] && this.hechos(h) < h.pasos.length - 1 ? h.estado : h.estado;
      this.evH(h, por + ' agregó el paso «' + nombre + '»'); this.recalcularHitos(h.proyecto); guardar();
    },
    agregarNota(h, texto, por, origen) { const d = new Date(); h.notas.unshift({ por, texto, fecha: HOY, hora: d.toTimeString().slice(0, 5), origen: origen || '' }); this.evH(h, por + (origen ? ' registró ' + origen.toLowerCase() : ' agregó una nota')); guardar(); },
    guardarFicha(h, { contratista, resp, visible, prioridad }, por) {
      if (prioridad && prioridad !== (h.prioridad || 'Normal')) { this.evH(h, por + ' cambió la prioridad a ' + prioridad); h.prioridad = prioridad; }
      if (resp !== h.resp) h.pasos.forEach((p) => { if (p.enc === h.resp) p.enc = resp; });
      Object.assign(h, { contratista, resp, visible: !!visible }); this.evH(h, por + ' guardó la ficha'); this.recalcularHitos(h.proyecto); guardar();
    },
    /* Lo que falta para pasar a Terminado o a Liquidado. Vacío = se puede. */
    faltasCierre(h, destino) {
      const f = [], c = h.cierre;
      const pend = h.pasos.filter((p) => !p.hecho);
      if (pend.length) f.push(pend.length === 1 ? 'Falta el paso «' + pend[0].nombre + '».' : 'Faltan ' + pend.length + ' pasos por hacer.');
      if (!c.asbuilt.adj) f.push('Falta el As-Built con su editable final. Complétalo en «Cierre documental».');
      else if (!c.asbuilt.ver) f.push('El As-Built ya está adjunto, pero el Gerente de Supervisión debe verificarlo.');
      if (destino === 'Liquidado') [['garantia', 'la garantía'], ['liquidacion', 'la liquidación'], ['retencion', 'la retención']].forEach(([k, t]) => { if (!c[k]) f.push('Falta verificar ' + t + '.'); });
      return f;
    },
    cambiarEstado(h, estado, por) {
      if (estado === h.estado) return { ok: true };
      if (estado === 'Terminado' || estado === 'Liquidado') { const f = this.faltasCierre(h, estado); if (f.length) return { ok: false, faltas: f }; }
      h.estado = estado; this.evH(h, por + ' cambió el estado a ' + estado); this.recalcularHitos(h.proyecto); guardar(); return { ok: true };
    },
    adjuntarAsBuilt(h, { nombre, hash: hx }, por) { h.cierre.asbuilt.adj = { nombre, hash: hx, por, fecha: HOY }; h.cierre.asbuilt.ver = null; this.evH(h, por + ' adjuntó el As-Built «' + nombre + '»'); guardar(); },
    verificarCierre(h, clave, valor, por) {
      const c = h.cierre;
      if (this.cerrado(h) && clave === 'asbuilt') return false;
      if (clave === 'asbuilt') { if (!c.asbuilt.adj) return false; c.asbuilt.ver = valor ? { por, fecha: HOY } : null; }
      else c[clave] = valor ? { por, fecha: HOY } : null;
      this.evH(h, por + (valor ? ' verificó ' : ' quitó la verificación de ') + clave); guardar(); return true;
    },
    terminarConExcepcion(h, motivo, por) { h.estado = 'Terminado'; h.excepcion = { motivo, por, fecha: HOY }; this.evH(h, por + ' terminó el hito con excepción: «' + motivo + '»'); this.recalcularHitos(h.proyecto); guardar(); },
    /* Para la barra de la maqueta */

    /* ---------- Cronología del proyecto (sale de lo registrado, no se escribe a mano) ---------- */
    /* opc: { desde, hasta, entregas, hitos, decisiones, reuniones, quien } → [{ fecha, txt }] de más viejo a más nuevo */
    cronologia(proy, opc) {
      const ev = [], en = (f) => f >= opc.desde && f <= opc.hasta, por = (n) => (opc.quien && n ? ' (registró ' + n + ')' : '');
      if (opc.entregas) datos.planos.filter((p) => p.proyecto === proy && !p.externo).forEach((p) => {
        const inst = INST[p.inst] ? INST[p.inst][0] : p.inst;
        p.emisiones.filter((e) => !e.anulada).forEach((e) => {
          if (!en(e.fecha)) return;
          if (e.uso === 'Entrega a institución') ev.push({ fecha: e.fecha, txt: 'Se entregó a ' + inst + ' el plano «' + p.titulo + '», versión ' + e.v + (e.estado === 'APROBADO' || e.estado === 'VIGENTE' ? ' (aprobada)' : '') + '.' + por(e.quien) });
          else if (e.uso === 'Obra') ev.push({ fecha: e.fecha, txt: 'Se emitió para obra «' + p.titulo + '», versión ' + e.v + '.' + por(e.quien) });
        });
        if (p.anulado && en(p.anulado.fecha)) ev.push({ fecha: p.anulado.fecha, txt: 'Se anuló el plano «' + p.titulo + '»' + (p.anulado.motivo ? ': ' + p.anulado.motivo.replace(/\.$/, '') : '') + '.' + por(p.anulado.quien) });
      });
      if (opc.hitos) datos.hitos.filter((h) => h.proyecto === proy).forEach((h) => {
        const c = h.pasos[6];
        if (c && c.hecho && c.real && en(c.real)) ev.push({ fecha: c.real, txt: 'Se contrató el hito «' + h.nombre + '»' + (h.contratista ? ' con ' + h.contratista : '') + '.' + por(c.enc) });
        if (this.cerrado(h)) { const f = h.pasos.filter((p) => p.real).map((p) => p.real).sort().pop(); if (f && en(f)) ev.push({ fecha: f, txt: 'Se terminó el hito «' + h.nombre + '»' + (h.cierre.asbuilt.adj ? ', con planos As-Built' : '') + '.' + por(h.cierre.asbuilt.adj && h.cierre.asbuilt.adj.por) }); }
      });
      if (opc.decisiones) datos.definiciones.filter((d) => d.proyecto === proy && d.estado === 'decidida' && d.decision && en(d.decision.fecha)).forEach((d) => ev.push({ fecha: d.decision.fecha, txt: 'El cliente decidió sobre «' + d.titulo + '»: ' + d.decision.texto.replace(/\.$/, '') + '.' + por(d.decision.por) }));
      if (opc.reuniones) datos.minutas.filter((m) => m.proyecto === proy && en(m.fecha)).forEach((m) => ev.push({ fecha: m.fecha, txt: 'Reunión «' + m.nombre + '». Temas: ' + m.temas.map((t) => t.nombre.toLowerCase()).join(', ') + '.' + por(m.por) }));
      ev.forEach((x) => { x.txt = x.txt.replace(/\.( \(registró [^)]*\))$/, '$1.'); });
      return ev.sort((a, b) => a.fecha.localeCompare(b.fecha));
    },

    /* ---------- Tablero de oficina ---------- */
    tablero() {
      return datos.proyectos.filter((p) => p.estado === 'activo').map((p) => {
        const r = this.resumenHitos(p.codigo), hs = this.hitos(p.codigo);
        return { p, atrasados: r.atrasados, porVencer: r.porVencer, sinCotizar: hs.filter((h) => !this.cerrado(h) && h.estado === 'Pendiente de cotizar').length, sinEmision: datos.planos.filter((x) => x.proyecto === p.codigo && !x.anulado && !x.emisiones.length).length, defsVencidas: this.pendientesDef(p.codigo).filter((d) => this.diasDef(d) < 0).length };
      }).sort((a, b) => (b.atrasados + b.defsVencidas) - (a.atrasados + a.defsVencidas) || b.porVencer - a.porVencer || b.sinEmision - a.sinEmision);
    },
    cargaPorPersona() {
      const m = {}; this.pendientes().forEach((x) => { const o = m[x.persona] || (m[x.persona] = { persona: x.persona, n: 0, atrasados: 0 }); o.n++; if (x.atraso) o.atrasados++; });
      return Object.values(m).sort((a, b) => b.n - a.n || a.persona.localeCompare(b.persona));
    },
    /* Últimos 7 días contando hoy */
    planosSemana() {
      const desde = addDias(HOY, -6), en = (f) => f && f >= desde && f <= HOY, ems = datos.planos.flatMap((p) => p.emisiones.filter((e) => !e.anulada).map((e) => ({ p, e })));
      return { emisiones: ems.filter(({ e }) => en(e.fecha)).length, anulados: datos.planos.filter((p) => p.anulado && en(p.anulado.fecha)).length, porResponder: ems.filter(({ e }) => e.uso === 'Entrega a institución' && (e.estado === 'ENVIADO' || e.estado === 'RECIBIDO')).length };
    },
    avisos: () => datos.avisos,
    alternarAviso(id, activo, por) { const a = datos.avisos.find((x) => x.id === id); a.activo = activo; this.bitacora(por + (activo ? ' activó' : ' desactivó') + ' el aviso: ' + a.cuando, '', 'Avisos'); guardar(); },

    /* ---------- Usuarios ---------- */
    usuarios: () => datos.usuarios.slice(),
    usuario: (id) => datos.usuarios.find((u) => u.id === id),
    usuarioPorNombre: (n) => datos.usuarios.find((u) => u.nombre === n),
    usuariosActivos: () => datos.usuarios.filter((u) => u.estado === 'activa'),
    AREAS: ['Dirección', 'Presupuestos', 'Arquitectura', 'Supervisión', 'Sistemas'],
    correoRepetido: (correo, salvoId) => datos.usuarios.find((u) => u.correo.toLowerCase() === correo.toLowerCase() && u.id !== salvoId),
    /* Lo que una cuenta tiene a su nombre: se conserva aunque se desactive. */
    huellaUsuario(nombre) {
      return { planos: datos.planos.filter((p) => p.creadoPor === nombre).length, emisiones: datos.planos.reduce((a, p) => a + p.emisiones.filter((e) => e.quien === nombre).length, 0), pendientes: this.pendientes().filter((x) => x.persona === nombre).length };
    },
    invitar({ nombre, correo, puesto, area, rol }, por) {
      const base = correo.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''); let id = base, n = 2; while (this.usuario(id)) id = base + n++;
      const u = { id, nombre, correo, puesto, area, rol, estado: 'pendiente', ultimo: 'Aún no entra', desde: HOY, invitadoPor: por, invitacion: { enviada: HOY, caduca: addDias(HOY, 7), por }, baja: null };
      datos.usuarios.unshift(u); this.bitacora(por + ' invitó a ' + nombre, 'cuenta · rol: ' + GRU.datos.nombreRol[rol] + ' · puesto: ' + puesto, 'Cuentas'); guardar(); return u;
    },
    /* Cambiar el nombre no rompe nada: las referencias a esa persona se actualizan. */
    renombrarPersona(a, b) {
      datos.hitos.forEach((h) => { if (h.resp === a) h.resp = b; h.pasos.forEach((p) => { if (p.enc === a) p.enc = b; }); });
      datos.planos.forEach((p) => { if (p.creadoPor === a) p.creadoPor = b; p.emisiones.forEach((e) => { if (e.quien === a) e.quien = b; }); });
      datos.minutas.forEach((m) => { if (m.por === a) m.por = b; m.temas.forEach((t) => t.comentarios.forEach((c) => { if (c.enc === a) c.enc = b; })); });
    },
    editarUsuario(id, campos, por) {
      const u = this.usuario(id), cambios = [];
      if (campos.nombre !== u.nombre) this.renombrarPersona(u.nombre, campos.nombre);
      ['nombre', 'correo', 'puesto', 'area', 'rol'].forEach((k) => { if (campos[k] !== u[k]) cambios.push(k + ': ' + (k === 'rol' ? GRU.datos.nombreRol[u[k]] + ' → ' + GRU.datos.nombreRol[campos[k]] : u[k] + ' → ' + campos[k])); u[k] = campos[k]; });
      if (cambios.length) this.bitacora(por + ' editó la cuenta de ' + u.nombre, cambios.join(' · '), 'Cuentas');
      guardar(); return cambios.length;
    },
    desactivarUsuario(id, motivo, por) {
      const u = this.usuario(id); u.estado = 'desactivada'; u.baja = { por, fecha: HOY, motivo: motivo || '' };
      this.bitacora(por + ' desactivó la cuenta de ' + u.nombre, motivo ? 'motivo: «' + motivo + '»' : '', 'Cuentas'); guardar();
    },
    reactivarUsuario(id, por) { const u = this.usuario(id); u.estado = 'activa'; u.baja = null; this.bitacora(por + ' reactivó la cuenta de ' + u.nombre, '', 'Cuentas'); guardar(); },
    reenviarInvitacion(id, por) { const u = this.usuario(id); u.invitacion = { enviada: HOY, caduca: addDias(HOY, 7), por }; this.bitacora(por + ' reenvió la invitación a ' + u.nombre, 'caduca ' + u.invitacion.caduca, 'Cuentas'); guardar(); },
    cancelarInvitacion(id, por) { const u = this.usuario(id); datos.usuarios = datos.usuarios.filter((x) => x.id !== id); this.bitacora(por + ' canceló la invitación de ' + u.nombre, '', 'Cuentas'); guardar(); },

    /* Contraseñas de la maqueta: todas parten de demo-clave-1. */
    CLAVE_DEMO: 'demo-clave-1',
    claveDe(u) { return u.clave || 'demo-clave-1'; },
    usuarioPorCorreo: (c) => datos.usuarios.find((u) => u.correo.toLowerCase() === String(c).trim().toLowerCase()),
    registrarIngreso(id) { const u = this.usuario(id); if (u) { u.ultimo = 'Hoy, ' + new Date().toTimeString().slice(0, 5); guardar(); } },
    cambiarClave(id, nueva) { const u = this.usuario(id); u.clave = nueva; this.bitacora(u.nombre + ' cambió su contraseña', '', 'Cuentas'); guardar(); },
    activarCuenta(id, clave) { const u = this.usuario(id); u.estado = 'activa'; u.clave = clave; u.invitacion = null; this.bitacora(u.nombre + ' activó su cuenta', 'rol: ' + GRU.datos.nombreRol[u.rol], 'Cuentas'); guardar(); },
    pedirRestablecer(correo) { const u = this.usuarioPorCorreo(correo); if (u && u.estado === 'activa') { this.bitacora('Se pidió restablecer la contraseña de ' + u.nombre, '', 'Cuentas'); guardar(); } return u; },

    /* ---------- Catálogos ---------- */
    catInst: () => Object.entries(catalogo().inst).map(([cod, v]) => Object.assign({ cod }, v)),
    catDisc: () => Object.entries(catalogo().disc).map(([cod, v]) => Object.assign({ cod }, v)),
    catClientes: () => datos.clientes.map((nombre, i) => ({ n: i + 1, nombre, activo: !catalogo().clientesOff.includes(nombre) })),
    instActivas() { return Object.fromEntries(Object.entries(catalogo().inst).filter(([, v]) => v.activo).map(([k, v]) => [k, [v.nombre, v.corto]])); },
    discActivas() { return Object.fromEntries(Object.entries(catalogo().disc).filter(([, v]) => v.activo).map(([k, v]) => [k, [v.nombre, v.corto]])); },
    usoCatalogo(tipo, clave) {
      if (tipo === 'inst') return datos.planos.filter((p) => p.inst === clave).length;
      if (tipo === 'disc') return datos.planos.filter((p) => p.disc === clave).length;
      if (tipo === 'clientes') return datos.proyectos.filter((p) => p.cliente === clave).length;
      if (tipo === 'hitos') return new Set(datos.hitos.filter((h) => h.cat === clave).map((h) => h.proyecto)).size;
      return new Set(datos.planos.filter((p) => p.titulo === clave).map((p) => p.proyecto)).size;
    },
    /* tipo: 'inst' | 'disc' */
    agregarCatalogo(tipo, cod, nombre, por) {
      const c = catalogo()[tipo]; c[cod] = { nombre, corto: nombre.slice(0, 3).toUpperCase(), activo: true }; sincronizarCatalogo();
      this.bitacora(por + ' agregó ' + (tipo === 'inst' ? 'la institución ' : 'la disciplina ') + nombre + ' (' + cod + ') al catálogo', '', 'Catálogos'); guardar();
    },
    editarCatalogo(tipo, cod, nombre, por) {
      const c = catalogo()[tipo][cod], antes = c.nombre; c.nombre = nombre; sincronizarCatalogo();
      this.bitacora(por + ' cambió el nombre en el catálogo', cod + ': ' + antes + ' → ' + nombre, 'Catálogos'); guardar();
    },
    activarCatalogo(tipo, cod, activo, por) {
      const c = catalogo()[tipo][cod]; c.activo = activo; this.bitacora(por + (activo ? ' reactivó ' : ' desactivó ') + c.nombre + ' (' + cod + ') en el catálogo', '', 'Catálogos'); guardar();
    },
    agregarCliente(nombre, por) { datos.clientes.push(nombre); this.bitacora(por + ' agregó al cliente ' + nombre, '', 'Catálogos'); guardar(); },
    editarCliente(antes, nombre, por) {
      const i = datos.clientes.indexOf(antes); datos.clientes[i] = nombre; const off = catalogo().clientesOff, j = off.indexOf(antes); if (j >= 0) off[j] = nombre;
      datos.proyectos.forEach((p) => { if (p.cliente === antes) p.cliente = nombre; }); datos.definiciones.forEach((d) => { if (d.decide === antes) d.decide = nombre; });
      this.bitacora(por + ' cambió el nombre de un cliente', antes + ' → ' + nombre, 'Catálogos'); guardar();
    },
    activarCliente(nombre, activo, por) {
      const off = catalogo().clientesOff, j = off.indexOf(nombre); if (activo && j >= 0) off.splice(j, 1); if (!activo && j < 0) off.push(nombre);
      this.bitacora(por + (activo ? ' reactivó al cliente ' : ' desactivó al cliente ') + nombre, '', 'Catálogos'); guardar();
    },

    /* ---------- Minutas ---------- */
    minutas: (proy) => datos.minutas.filter((m) => m.proyecto === proy).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)),
    minuta: (id) => datos.minutas.find((m) => m.id === id),
    /* Un comentario abierto con fecha anterior a hoy está atrasado. */
    estadoComentario: (c) => (c.estado === 'cerrado' ? 'CERRADO' : c.fecha < HOY ? 'ATRASADO' : 'ABIERTO'),
    resumenTema(t) {
      const ab = t.comentarios.filter((c) => c.estado !== 'cerrado'), atr = ab.filter((c) => c.fecha < HOY).length;
      return { n: t.comentarios.length, abiertos: ab.length, atrasados: atr, cerrado: !ab.length };
    },
    resumenMinuta(m) { const t = m.temas.map((x) => this.resumenTema(x)); return { temas: m.temas.length, comentarios: m.temas.reduce((a, x) => a + x.comentarios.length, 0), abiertos: t.reduce((a, x) => a + x.abiertos, 0), atrasados: t.reduce((a, x) => a + x.atrasados, 0) }; },
    /* temas: [{ nombre, hito|null, comentarios:[{ texto, enc, fecha }] }] */
    crearMinuta(proy, { nombre, fecha, temas }, por) {
      const id = 'M' + (datos.minutas.length + 1) + Date.now().toString(36);
      const m = { id, proyecto: proy, nombre, fecha, por, asistentes: 0, temas: temas.map((t, i) => ({ id: id + 'T' + (i + 1), nombre: t.nombre, hito: t.hito || null, comentarios: t.comentarios.map((c, j) => ({ id: id + 'T' + (i + 1) + 'C' + (j + 1), texto: c.texto, enc: c.enc, fecha: c.fecha, estado: 'abierto' })) })) };
      datos.minutas.push(m); const r = this.resumenMinuta(m);
      this.bitacora(por + ' guardó la minuta «' + nombre + '»', r.temas + (r.temas === 1 ? ' tema · ' : ' temas · ') + r.comentarios + (r.comentarios === 1 ? ' comentario' : ' comentarios'), 'Minutas', proy);
      guardar(); return m;
    },
    agregarTema(minutaId, { nombre, hito, comentarios }, por) {
      const m = this.minuta(minutaId); if (!m) return null;
      const i = m.temas.length + 1, t = { id: m.id + 'T' + i, nombre, hito: hito || null, comentarios: comentarios.map((c, j) => ({ id: m.id + 'T' + i + 'C' + (j + 1), texto: c.texto, enc: c.enc, fecha: c.fecha, estado: 'abierto' })) };
      m.temas.push(t); this.bitacora(por + ' agregó el tema «' + nombre + '» a la minuta «' + m.nombre + '»', comentarios.length + (comentarios.length === 1 ? ' comentario' : ' comentarios'), 'Minutas', m.proyecto); guardar(); return t;
    },
    cambiarComentario(id, cerrado, por) {
      for (const m of datos.minutas) for (const t of m.temas) for (const c of t.comentarios) if (c.id === id) {
        c.estado = cerrado ? 'cerrado' : 'abierto';
        this.bitacora(por + (cerrado ? ' cerró' : ' reabrió') + ' el comentario «' + c.texto + '»', 'minuta «' + m.nombre + '» · tema «' + t.nombre + '» · estado: ' + (cerrado ? 'ABIERTO → CERRADO' : 'CERRADO → ABIERTO'), 'Minutas', m.proyecto);
        guardar(); return true;
      }
      return false;
    },
    /* Las notas escritas dentro de un hito, para verlas junto a las minutas. */
    notasDeHitos: (proy) => datos.hitos.filter((h) => h.proyecto === proy && h.notas.length).flatMap((h) => h.notas.map((n) => ({ h, n }))).sort((a, b) => (b.n.fecha + b.n.hora).localeCompare(a.n.fecha + a.n.hora)),

    /* ---------- Bitácora e historial global ---------- */
    bitacora(txt, cambio, tipo, proy) { datos.bitacora.unshift({ cuando: 'Hoy, ' + new Date().toTimeString().slice(0, 5), txt, cambio: cambio || '', tipo, proy: proy || '', ts: Date.now() }); },
    /* «Hoy, 16:52» → { dia: '2026-11-09', hora: '16:52' } */
    cuandoA(c) {
      const [d, h] = String(c).split(', '); const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      let dia = HOY; if (d === 'Ayer') dia = addDias(HOY, -1); else if (d !== 'Hoy') { const [n, m] = d.split(' '); dia = '2026-' + String(MES.indexOf(m) + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0'); }
      return { dia, hora: h || '00:00' };
    },
    /* Todo lo que ha pasado, de lo más nuevo a lo más viejo. */
    historialGlobal() {
      const todo = [];
      const nombre = (t) => (t.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/) || [, ''])[1];
      const pon = (txt, cuando, ts, tipo, proy, cambio) => { const w = this.cuandoA(cuando); todo.push({ txt, cuando, ts: ts || 0, dia: w.dia, hora: w.hora, tipo, proy, cambio: cambio || '', quien: nombre(txt) }); };
      datos.hitos.forEach((h) => h.historial.forEach(([t, c, ts]) => pon(t, c, ts, 'Hitos y pasos', h.proyecto, h.proyecto + ' · hito ' + h.cat + ' ' + h.nombre)));
      datos.planos.forEach((p) => p.historial.forEach(([t, c, ts]) => pon(t, c, ts, 'Planos y emisiones', p.proyecto, p.proyecto + ' · ' + p.cup)));
      datos.bitacora.forEach((b) => pon(b.txt, b.cuando, b.ts, b.tipo, b.proy, b.cambio));
      return todo.sort((a, b) => b.dia.localeCompare(a.dia) || ((b.ts ? 1 : 0) - (a.ts ? 1 : 0)) || (b.ts && a.ts ? b.ts - a.ts : b.hora.localeCompare(a.hora)));
    },

    /* ---------- Pendientes por persona ---------- */
    /* Lo abierto que alguien tiene que hacer: el siguiente paso de cada hito, comentarios de minuta y planos sin primera emisión. */
    pendientes() {
      const out = [], activo = (c) => { const p = this.proyecto(c); return p && p.estado === 'activo'; };
      const fila = (o) => { o.atraso = o.fecha && o.fecha < HOY ? this.difDias(o.fecha, HOY) : 0; o.dias = o.fecha ? this.difDias(HOY, o.fecha) : null; out.push(o); };
      datos.hitos.filter((h) => activo(h.proyecto) && !this.cerrado(h)).forEach((h) => {
        const s = h.pasos.find((x) => !x.hecho); if (!s || !s.enc || s.enc === 'Sin asignar') return;
        fila({ tipo: 'paso', persona: s.enc, proyecto: h.proyecto, titulo: s.nombre, detalle: 'Paso · ' + h.nombre, fecha: s.fin || null, pag: '16-hito.html', extra: '&h=' + h.cat });
      });
      datos.minutas.filter((m) => activo(m.proyecto)).forEach((m) => m.temas.forEach((t) => t.comentarios.filter((c) => c.estado !== 'cerrado').forEach((c) => {
        const [, mm, dd] = m.fecha.split('-').map(Number); fila({ tipo: 'minuta', persona: c.enc, proyecto: m.proyecto, titulo: c.texto, detalle: 'Minuta del ' + dd + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][mm - 1], fecha: c.fecha, pag: '19-minutas.html', extra: '&m=' + m.id });
      })));
      datos.planos.filter((x) => activo(x.proyecto) && !x.anulado && !x.emisiones.length).forEach((x) => fila({ tipo: 'plano', persona: x.creadoPor, proyecto: x.proyecto, titulo: 'Registrar la primera emisión', detalle: 'Plano · ' + x.cup + ' · ' + x.titulo, fecha: null, pag: '12-plano.html', extra: '&c=' + x.cup }));
      return out.sort((a, b) => (b.atraso ? 1 : 0) - (a.atraso ? 1 : 0) || (a.fecha || '9').localeCompare(b.fecha || '9'));
    },

    restablecer() { datos = copia(SEMILLA); sincronizarCatalogo(); this.recalcularTodo(); guardar(); },
    recalcularTodo() { datos.proyectos.forEach((p) => this.recalcularHitos(p.codigo)); },
    vaciar() { datos = { clientes: datos.clientes, proyectos: [], planos: [], hitos: [], definiciones: [], enlaces: [], minutas: [], bitacora: [], usuarios: datos.usuarios }; sincronizarCatalogo(); guardar(); },
  };
  sincronizarCatalogo();
  GRU.db.recalcularTodo();
})();
