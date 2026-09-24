'use strict';

/* =========================================================
   Elementos Prohibidos en Vuelos · Portal público
   Requiere data.js (objeto global EPV).
   ========================================================= */

(function () {

  /* ---------- Textos de la interfaz ---------- */
  var I18N = {
    es: {
      app: 'Elementos Prohibidos en Vuelos',
      saltar: 'Saltar a los resultados',
      titulo: '¿Qué quieres llevar en tu viaje?',
      subtitulo: 'Busca un objeto y te decimos si puede viajar contigo.',
      buscarEtiqueta: 'Buscar un objeto',
      buscarPlaceholder: 'Ej.: power bank, perfume, encendedor',
      borrarBusqueda: 'Borrar búsqueda',
      filtrarCategoria: 'Filtrar por categoría',
      filtrarEstado: 'Filtrar por dónde puede viajar',
      limpiarFiltros: 'Limpiar filtros',
      todos: 'Todos',
      fCabina: 'Permitido en cabina',
      fBodega: 'Permitido en bodega',
      fCondiciones: 'Restringido con condiciones',
      fProhibido: 'Prohibido',
      permitido: 'Permitido',
      restringido: 'Restringido',
      prohibido: 'Prohibido',
      leyendaRestringido: 'Restringido: con condiciones',
      equipajeMano: 'Equipaje de mano',
      equipajeBodega: 'Equipaje de bodega',
      avisoAerolinea: 'Aviso a aerolínea',
      requiereAprobacion: 'Requiere aprobación',
      noRequiere: 'No requiere',
      noAplica: 'No aplica: no puede viajar',
      condicion: 'Condición o límite',
      masDetalles: 'Más detalles',
      referencia: 'Referencia',
      objeto: 'objeto',
      objetos: 'objetos',
      para: 'para',
      en: 'en',
      cargando: 'Cargando catálogo…',
      vacioTitulo: 'No encontramos ese objeto',
      vacioTexto: 'Prueba con otra palabra, por ejemplo «batería», «perfume» o «cuchillo». Si no aparece, consulta directamente con tu aerolínea antes de viajar.',
      verTodos: 'Ver todos los objetos',
      adendaTitulo: 'Nuevo desde el 27 de marzo de 2026',
      adendaTexto: 'Máximo 2 power banks por persona, solo en cabina. No se pueden recargar a bordo.',
      adendaVer: 'Ver reglas de power banks',
      cerrarAviso: 'Cerrar aviso',
      vistaBorrador: 'Vista previa del borrador del mantenedor (no publicado).',
      salirVista: 'Salir de la vista previa',
      legal: 'Esta herramienta es una guía referencial basada en la Tabla 8-1 del Doc 9284 de la OACI (Ed. 2025–2026 y Adenda 1) y normativas DGAC. Ante la duda, consulta siempre con tu aerolínea.',
      normativa: 'Normativa vigente: ',
      actualizado: 'Actualizado: ',
      mantenedor: '⚙️ Mantenedor',
      modoOscuro: 'Modo oscuro',
      anteriores: 'Ver anteriores',
      siguientes: 'Ver más'
    },
    en: {
      app: 'Prohibited Items on Flights',
      saltar: 'Skip to results',
      titulo: 'What can you take on your trip?',
      subtitulo: "Search for an item and we'll tell you if it can fly.",
      buscarEtiqueta: 'Search for an item',
      buscarPlaceholder: 'E.g.: power bank, perfume, lighter',
      borrarBusqueda: 'Clear search',
      filtrarCategoria: 'Filter by category',
      filtrarEstado: 'Filter by where it can travel',
      limpiarFiltros: 'Clear filters',
      todos: 'All',
      fCabina: 'Allowed in cabin',
      fBodega: 'Allowed in checked baggage',
      fCondiciones: 'Restricted with conditions',
      fProhibido: 'Forbidden',
      permitido: 'Allowed',
      restringido: 'Restricted',
      prohibido: 'Forbidden',
      leyendaRestringido: 'Restricted: with conditions',
      equipajeMano: 'Carry-on baggage',
      equipajeBodega: 'Checked baggage',
      avisoAerolinea: 'Airline approval',
      requiereAprobacion: 'Approval required',
      noRequiere: 'Not required',
      noAplica: 'N/A: cannot travel',
      condicion: 'Condition or limit',
      masDetalles: 'More details',
      referencia: 'Reference',
      objeto: 'item',
      objetos: 'items',
      para: 'for',
      en: 'in',
      cargando: 'Loading catalogue…',
      vacioTitulo: "We couldn't find that item",
      vacioTexto: 'Try another word, for example "battery", "perfume" or "knife". If it does not appear, check directly with your airline before travelling.',
      verTodos: 'See all items',
      adendaTitulo: 'New since 27 March 2026',
      adendaTexto: 'Maximum 2 power banks per person, cabin only. They may not be recharged on board.',
      adendaVer: 'See power bank rules',
      cerrarAviso: 'Close notice',
      vistaBorrador: 'Preview of the maintenance draft (not published).',
      salirVista: 'Exit preview',
      legal: 'This tool is a reference guide based on Table 8-1 of ICAO Doc 9284 (2025–2026 Ed. and Addendum 1) and DGAC regulations. If in doubt, always check with your airline.',
      normativa: 'Regulations in force: ',
      actualizado: 'Updated: ',
      mantenedor: '⚙️ Maintenance',
      modoOscuro: 'Dark mode',
      anteriores: 'Show previous',
      siguientes: 'Show more'
    }
  };

  var ESTADOS_UI = {
    permitido: { icono: '✅', clave: 'permitido' },
    restringido: { icono: '⚠️', clave: 'restringido' },
    prohibido: { icono: '❌', clave: 'prohibido' }
  };

  /* Las 4 categorías del proyecto (filtros por dónde puede viajar) */
  var FILTROS_ESTADO = [
    { id: 'cabina', clave: 'fCabina', punto: 'ok', prueba: function (e) { return e.mano !== 'prohibido'; } },
    { id: 'bodega', clave: 'fBodega', punto: 'ok', prueba: function (e) { return e.bodega !== 'prohibido'; } },
    { id: 'condiciones', clave: 'fCondiciones', punto: 'warn', prueba: function (e) { return e.mano === 'restringido' || e.bodega === 'restringido' || e.aprobacion === true; } },
    { id: 'prohibido', clave: 'fProhibido', punto: 'no', prueba: function (e) { return e.mano === 'prohibido' && e.bodega === 'prohibido'; } }
  ];

  /* ---------- Estado ---------- */
  var estado = {
    lang: document.documentElement.lang === 'en' ? 'en' : 'es',
    categoria: 'todos',
    filtro: null,
    consulta: '',
    catalogo: null,
    indice: []
  };

  var $ = function (id) { return document.getElementById(id); };
  var dom = {
    buscador: $('buscador'),
    form: $('formBusqueda'),
    limpiar: $('limpiarBusqueda'),
    chipsCat: $('chipsCategorias'),
    chipsEst: $('chipsEstado'),
    limpiarFiltros: $('limpiarFiltros'),
    lista: $('listaResultados'),
    resumen: $('resumen'),
    cargando: $('cargando'),
    sinResultados: $('sinResultados'),
    verTodos: $('verTodos'),
    toggleTema: $('toggleTema'),
    temaPerilla: $('temaPerilla'),
    metaTema: document.querySelector('meta[name="theme-color"]'),
    avisoAdenda: $('avisoAdenda'),
    cerrarAdenda: $('cerrarAdenda'),
    verPowerBanks: $('verPowerBanks'),
    avisoBorrador: $('avisoBorrador'),
    normativa: $('normativaVigente')
  };

  function t(clave) {
    return (I18N[estado.lang] && I18N[estado.lang][clave]) || I18N.es[clave] || clave;
  }

  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ }
  }

  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }

  var esc = EPV.escaparHTML;

  /* ---------- Índice de búsqueda (ambos idiomas) ---------- */
  function construirIndice() {
    estado.indice = estado.catalogo.elementos.map(function (el) {
      var cat = EPV.categoria(el.categoria);
      var partes = [
        el.nombre.es, el.nombre.en,
        (el.claves.es || []).join(' '), (el.claves.en || []).join(' '),
        el.limite.es, el.limite.en,
        cat.es, cat.en
      ];
      return { el: el, texto: EPV.normalizar(partes.join(' ')) };
    });
  }

  function terminos() {
    return EPV.normalizar(estado.consulta).split(' ').filter(Boolean);
  }

  function coincideTexto(item, ts) {
    return ts.every(function (x) { return item.texto.indexOf(x) !== -1; });
  }

  function filtroActual() {
    for (var i = 0; i < FILTROS_ESTADO.length; i++) {
      if (FILTROS_ESTADO[i].id === estado.filtro) return FILTROS_ESTADO[i];
    }
    return null;
  }

  function filtrar(opciones) {
    var ts = terminos();
    var usarCat = !opciones || opciones.categoria !== false;
    var usarEst = !opciones || opciones.estado !== false;
    var f = filtroActual();
    return estado.indice.filter(function (item) {
      if (!coincideTexto(item, ts)) return false;
      if (usarCat && estado.categoria !== 'todos' && item.el.categoria !== estado.categoria) return false;
      if (usarEst && f && !f.prueba(item.el)) return false;
      return true;
    });
  }

  /* ---------- Chips ---------- */
  function construirChips() {
    var htmlCat = '<button type="button" class="chip" data-categoria="todos">' +
      esc(t('todos')) + ' <span class="chip-n" data-n="todos"></span></button>';
    EPV.CATEGORIAS.forEach(function (c) {
      htmlCat += '<button type="button" class="chip" data-categoria="' + c.id + '">' +
        '<span aria-hidden="true">' + c.icono + '</span> ' + esc(c[estado.lang]) +
        ' <span class="chip-n" data-n="' + c.id + '"></span></button>';
    });
    dom.chipsCat.innerHTML = htmlCat;

    dom.chipsEst.innerHTML = FILTROS_ESTADO.map(function (f) {
      return '<button type="button" class="chip chip-estado" data-filtro="' + f.id + '">' +
        '<span class="punto punto-' + f.punto + '" aria-hidden="true"></span>' +
        esc(t(f.clave)) + ' <span class="chip-n" data-nf="' + f.id + '"></span></button>';
    }).join('');

    marcarChips();
    actualizarFlechas();
  }

  /* ---------- Flechas para desplazar las filas de chips ---------- */
  function iniciarFlechas() {
    document.querySelectorAll('.chips-contenedor').forEach(function (c) {
      var tira = c.querySelector('.chips');
      var izq = c.querySelector('.chips-flecha.izq');
      var der = c.querySelector('.chips-flecha.der');
      c._actualizar = function () {
        var max = tira.scrollWidth - tira.clientWidth;
        var hayIzq = tira.scrollLeft > 4;
        var hayDer = tira.scrollLeft < max - 4;
        izq.hidden = !hayIzq;
        der.hidden = !hayDer;
        c.classList.toggle('hay-izq', hayIzq);
        c.classList.toggle('hay-der', hayDer);
      };
      tira.addEventListener('scroll', c._actualizar, { passive: true });
      izq.addEventListener('click', function () { tira.scrollBy({ left: -tira.clientWidth * 0.7, behavior: 'smooth' }); });
      der.addEventListener('click', function () { tira.scrollBy({ left: tira.clientWidth * 0.7, behavior: 'smooth' }); });
    });
    window.addEventListener('resize', actualizarFlechas);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(actualizarFlechas);
  }

  function actualizarFlechas() {
    document.querySelectorAll('.chips-contenedor').forEach(function (c) {
      if (c._actualizar) c._actualizar();
    });
  }

  function marcarChips() {
    dom.chipsCat.querySelectorAll('.chip').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-categoria') === estado.categoria));
    });
    dom.chipsEst.querySelectorAll('.chip').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filtro') === estado.filtro));
    });
    dom.limpiarFiltros.hidden = !(estado.categoria !== 'todos' || estado.filtro || estado.consulta.trim());
  }

  function actualizarContadores() {
    var baseCat = filtrar({ categoria: false });
    var conteo = { todos: baseCat.length };
    baseCat.forEach(function (it) { conteo[it.el.categoria] = (conteo[it.el.categoria] || 0) + 1; });
    dom.chipsCat.querySelectorAll('[data-n]').forEach(function (s) {
      s.textContent = conteo[s.getAttribute('data-n')] || 0;
    });

    var baseEst = filtrar({ estado: false });
    dom.chipsEst.querySelectorAll('[data-nf]').forEach(function (s) {
      var id = s.getAttribute('data-nf');
      var f = FILTROS_ESTADO.filter(function (x) { return x.id === id; })[0];
      s.textContent = baseEst.filter(function (it) { return f.prueba(it.el); }).length;
    });
  }

  /* ---------- Tarjetas ---------- */
  function bloqueEstado(icono, titulo, valor) {
    var e = ESTADOS_UI[valor];
    return '<div class="estado" data-estado="' + valor + '">' +
      '<span class="estado-titulo"><span aria-hidden="true">' + icono + '</span> ' + esc(titulo) + '</span>' +
      '<span class="estado-valor"><span aria-hidden="true">' + e.icono + '</span> ' + esc(t(e.clave)) + '</span>' +
      '</div>';
  }

  function textoAviso(aprobacion) {
    if (aprobacion === true) return '<dd class="aviso-si">' + esc(t('requiereAprobacion')) + '</dd>';
    if (aprobacion === false) return '<dd class="aviso-no">' + esc(t('noRequiere')) + '</dd>';
    return '<dd class="aviso-na">' + esc(t('noAplica')) + '</dd>';
  }

  function tarjetaHTML(el) {
    var L = estado.lang;
    var cat = EPV.categoria(el.categoria);
    var idT = 't-' + esc(el.id);
    var detalle = (el.detalle[L] || []).filter(Boolean);

    return '<li><article class="tarjeta" aria-labelledby="' + idT + '">' +
      '<div class="flex items-start gap-3">' +
        '<span class="tarjeta-icono" aria-hidden="true">' + EPV.iconoHTML(el.icono, cat.icono) + '</span>' +
        '<div class="min-w-0">' +
          '<h2 id="' + idT + '" class="tarjeta-titulo">' + esc(el.nombre[L]) + '</h2>' +
          '<p class="tarjeta-categoria">' + esc(cat[L]) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2 mt-4">' +
        bloqueEstado('🎒', t('equipajeMano'), el.mano) +
        bloqueEstado('🧳', t('equipajeBodega'), el.bodega) +
      '</div>' +
      '<dl class="mt-2">' +
        '<div class="fila-aviso"><dt><span aria-hidden="true">✈️</span> ' + esc(t('avisoAerolinea')) + '</dt>' + textoAviso(el.aprobacion) + '</div>' +
        '<div class="fila-limite"><dt><span aria-hidden="true">📏</span> ' + esc(t('condicion')) + '</dt><dd>' + esc(el.limite[L]) + '</dd></div>' +
      '</dl>' +
      '<details class="detalle"><summary>' + esc(t('masDetalles')) + '</summary>' +
        '<div class="detalle-cuerpo">' +
          (detalle.length ? '<ul class="detalle-lista">' + detalle.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') +
          '<p class="detalle-fuente">' + esc(t('referencia')) + ': ' + esc(el.fuente[L]) + '</p>' +
        '</div>' +
      '</details>' +
    '</article></li>';
  }

  /* ---------- Render ---------- */
  function actualizarResumen(n) {
    var txt = n + ' ' + (n === 1 ? t('objeto') : t('objetos'));
    var q = estado.consulta.trim();
    if (q) txt += ' ' + t('para') + ' ' + (estado.lang === 'en' ? '“' + q + '”' : '«' + q + '»');
    if (estado.categoria !== 'todos') txt += ' ' + t('en') + ' ' + EPV.categoria(estado.categoria)[estado.lang];
    var f = filtroActual();
    if (f) txt += ' · ' + t(f.clave);
    dom.resumen.textContent = txt;
  }

  function renderizar() {
    if (!estado.catalogo) return;
    var res = filtrar().map(function (it) { return it.el; });
    dom.lista.innerHTML = res.map(tarjetaHTML).join('');
    dom.lista.hidden = res.length === 0;
    dom.sinResultados.hidden = res.length > 0;
    actualizarResumen(res.length);
    actualizarContadores();
    marcarChips();
    actualizarFlechas();
  }

  /* ---------- Idioma ---------- */
  function aplicarIdioma(lang, guardarPref) {
    estado.lang = lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = estado.lang === 'en' ? 'en' : 'es-CL';
    document.title = t('app');

    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (n) {
      n.setAttribute('placeholder', t(n.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (n) {
      n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('.idioma-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === estado.lang));
    });

    if (estado.catalogo && estado.catalogo.normativa) {
      dom.normativa.textContent = t('normativa') + estado.catalogo.normativa[estado.lang] +
        (estado.catalogo.actualizado ? ' · ' + t('actualizado') + estado.catalogo.actualizado : '');
    }

    if (guardarPref) guardar('epv-lang', estado.lang);
    construirChips();
    renderizar();
  }

  document.querySelectorAll('.idioma-btn').forEach(function (b) {
    b.addEventListener('click', function () { aplicarIdioma(b.getAttribute('data-lang'), true); });
  });

  /* ---------- Búsqueda ---------- */
  function alEscribir() {
    estado.consulta = dom.buscador.value;
    dom.limpiar.hidden = estado.consulta.length === 0;
    renderizar();
  }

  function limpiarBusqueda(enfocar) {
    dom.buscador.value = '';
    alEscribir();
    if (enfocar) dom.buscador.focus();
  }

  dom.buscador.addEventListener('input', alEscribir);
  dom.buscador.addEventListener('keydown', function (e) { if (e.key === 'Escape') limpiarBusqueda(true); });
  dom.form.addEventListener('submit', function (e) { e.preventDefault(); dom.buscador.blur(); });
  dom.limpiar.addEventListener('click', function () { limpiarBusqueda(true); });

  /* ---------- Filtros ---------- */
  dom.chipsCat.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    estado.categoria = b.getAttribute('data-categoria');
    if (b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    renderizar();
  });

  dom.chipsEst.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    var id = b.getAttribute('data-filtro');
    estado.filtro = estado.filtro === id ? null : id;
    renderizar();
  });

  function limpiarTodo() {
    estado.categoria = 'todos';
    estado.filtro = null;
    dom.buscador.value = '';
    estado.consulta = '';
    dom.limpiar.hidden = true;
    renderizar();
  }

  dom.limpiarFiltros.addEventListener('click', limpiarTodo);
  dom.verTodos.addEventListener('click', limpiarTodo);

  /* ---------- Aviso Adenda 1 ---------- */
  if (leer('epv-aviso-adenda1') !== 'cerrado') dom.avisoAdenda.hidden = false;

  dom.cerrarAdenda.addEventListener('click', function () {
    dom.avisoAdenda.hidden = true;
    guardar('epv-aviso-adenda1', 'cerrado');
  });

  dom.verPowerBanks.addEventListener('click', function () {
    estado.categoria = 'todos';
    estado.filtro = null;
    dom.buscador.value = 'power bank';
    alEscribir();
    dom.lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- Tema ---------- */
  function aplicarTema(oscuro, guardarPref) {
    document.documentElement.classList.toggle('dark', oscuro);
    dom.toggleTema.setAttribute('aria-checked', String(oscuro));
    dom.temaPerilla.textContent = oscuro ? '🌙' : '☀️';
    if (dom.metaTema) dom.metaTema.setAttribute('content', oscuro ? '#232C3A' : '#FFC72C');
    if (guardarPref) guardar('tema', oscuro ? 'oscuro' : 'claro');
  }

  dom.toggleTema.addEventListener('click', function () {
    aplicarTema(!document.documentElement.classList.contains('dark'), true);
  });

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var alCambiar = function (e) { if (!leer('tema')) aplicarTema(e.matches, false); };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
    else if (mq.addListener) mq.addListener(alCambiar);
  }

  /* ---------- Carga del catálogo ---------- */
  function iniciarCatalogo(cat) {
    estado.catalogo = cat;
    construirIndice();
    dom.cargando.hidden = true;
    aplicarIdioma(estado.lang, false);
  }

  iniciarFlechas();
  aplicarTema(document.documentElement.classList.contains('dark'), false);
  aplicarIdioma(estado.lang, false);

  var params = new URLSearchParams(location.search);
  var borrador = params.get('vista') === 'borrador' ? EPV.leerBorrador() : null;

  if (borrador) {
    dom.avisoBorrador.hidden = false;
    iniciarCatalogo(borrador);
  } else {
    EPV.cargarPublicado().then(function (r) { iniciarCatalogo(r.catalogo); });
  }

  /* ---------- PWA ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
