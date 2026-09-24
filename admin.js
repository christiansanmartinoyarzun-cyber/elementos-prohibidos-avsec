'use strict';

/* =========================================================
   Elementos Prohibidos en Vuelos · Mantenedor de contenidos
   - Edita un BORRADOR guardado en este navegador (localStorage).
   - Para publicar: Exportar JSON → subir catalogo.json al repositorio.
   Requiere data.js (objeto global EPV).
   ========================================================= */

(function () {

  var $ = function (id) { return document.getElementById(id); };
  var esc = EPV.escaparHTML;

  var ETIQUETA_ESTADO = { permitido: 'Permitido', restringido: 'Restringido', prohibido: 'Prohibido' };
  var ETIQUETA_ORIGEN = { tabla81: 'Tabla 8-1', no_listado: 'No listado', avsec: 'AVSEC · validar' };

  var estado = {
    publicado: null,      // catálogo publicado (o semilla)
    origenPublicado: '',  // 'publicado' | 'semilla'
    catalogo: null,       // catálogo en edición
    editandoId: null
  };

  var dom = {
    contador: $('contador'),
    estadoFuente: $('estadoFuente'),
    estadoCambios: $('estadoCambios'),
    cuerpo: $('tablaCuerpo'),
    vacia: $('tablaVacia'),
    buscar: $('adminBuscar'),
    filtroCat: $('adminCategoria'),
    filtroOrigen: $('adminOrigen'),
    dialogo: $('dialogo'),
    form: $('formElemento'),
    titulo: $('dialogoTitulo'),
    errores: $('formErrores'),
    toast: $('toast'),
    archivo: $('archivoImportar')
  };

  /* ---------- Utilidades ---------- */
  function toast(msg) {
    dom.toast.textContent = msg;
    dom.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { dom.toast.hidden = true; }, 3200);
  }

  function hoy() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function slug(texto) {
    return EPV.normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'elemento';
  }

  function idUnico(base) {
    var ids = estado.catalogo.elementos.map(function (e) { return e.id; });
    var id = base, n = 2;
    while (ids.indexOf(id) !== -1) { id = base + '-' + n; n += 1; }
    return id;
  }

  function lineas(texto) {
    return String(texto || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function comas(texto) {
    return String(texto || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function hayCambios() {
    return JSON.stringify(estado.catalogo.elementos) !== JSON.stringify(estado.publicado.elementos);
  }

  function guardarBorrador() {
    estado.catalogo.actualizado = hoy();
    estado.catalogo.esquema = EPV.ESQUEMA;
    try {
      if (hayCambios()) {
        localStorage.setItem(EPV.CLAVE_BORRADOR, JSON.stringify(estado.catalogo));
      } else {
        localStorage.removeItem(EPV.CLAVE_BORRADOR);
      }
    } catch (e) {
      toast('No se pudo guardar el borrador en este navegador. Exporta el JSON para no perder los cambios.');
    }
    render();
  }

  /* ---------- Render ---------- */
  function badge(valor) {
    return '<span class="badge-estado" data-estado="' + valor + '">' + ETIQUETA_ESTADO[valor] + '</span>';
  }

  function textoAprobacion(v) {
    if (v === true) return '<span class="badge-aprob si">Requiere</span>';
    if (v === false) return '<span class="badge-aprob">No</span>';
    return '<span class="badge-aprob na">No aplica</span>';
  }

  function render() {
    var q = EPV.normalizar(dom.buscar.value);
    var cat = dom.filtroCat.value;
    var org = dom.filtroOrigen.value;

    var lista = estado.catalogo.elementos.filter(function (e) {
      if (cat && e.categoria !== cat) return false;
      if (org && e.origen !== org) return false;
      if (!q) return true;
      var txt = EPV.normalizar([e.id, e.nombre.es, e.nombre.en, e.claves.es.join(' '), e.claves.en.join(' ')].join(' '));
      return q.split(' ').every(function (t) { return txt.indexOf(t) !== -1; });
    });

    dom.cuerpo.innerHTML = lista.map(function (e) {
      var c = EPV.categoria(e.categoria);
      return '<div class="tabla-admin-fila" role="row">' +
        '<span role="cell" class="celda-elemento">' +
          '<span class="celda-icono" aria-hidden="true">' + esc(e.icono || c.icono) + '</span>' +
          '<span class="min-w-0"><strong>' + esc(e.nombre.es) + '</strong>' +
          '<span class="celda-sub">' + esc(e.nombre.en) + '</span>' +
          '<span class="badge-origen" data-origen="' + esc(e.origen || '') + '">' + esc(ETIQUETA_ORIGEN[e.origen] || 'Sin origen') + '</span></span>' +
        '</span>' +
        '<span role="cell" class="celda-cat"><span class="etiqueta-movil">Categoría</span>' + c.icono + ' ' + esc(c.es) + '</span>' +
        '<span role="cell"><span class="etiqueta-movil">Cabina</span>' + badge(e.mano) + '</span>' +
        '<span role="cell"><span class="etiqueta-movil">Bodega</span>' + badge(e.bodega) + '</span>' +
        '<span role="cell"><span class="etiqueta-movil">Aprobación</span>' + textoAprobacion(e.aprobacion) + '</span>' +
        '<span role="cell" class="celda-acciones">' +
          '<button type="button" class="btn-icono" data-editar="' + esc(e.id) + '" aria-label="Editar ' + esc(e.nombre.es) + '">✏️</button>' +
          '<button type="button" class="btn-icono peligro" data-eliminar="' + esc(e.id) + '" aria-label="Eliminar ' + esc(e.nombre.es) + '">🗑️</button>' +
        '</span>' +
      '</div>';
    }).join('');

    dom.vacia.hidden = lista.length > 0;
    dom.contador.textContent = '· ' + estado.catalogo.elementos.length + ' elementos';

    var cambios = hayCambios();
    dom.estadoCambios.hidden = !cambios;
    dom.estadoFuente.textContent = cambios
      ? 'Editando un borrador local.'
      : (estado.origenPublicado === 'publicado'
        ? 'Mostrando el catálogo publicado (catalogo.json).'
        : 'Mostrando el catálogo semilla (no se encontró catalogo.json).');
  }

  /* ---------- Formulario ---------- */
  function llenarSelectCategorias(select, conTodas) {
    select.innerHTML = (conTodas ? '<option value="">Todas las categorías</option>' : '') +
      EPV.CATEGORIAS.map(function (c) {
        return '<option value="' + c.id + '">' + c.icono + ' ' + esc(c.es) + '</option>';
      }).join('');
  }

  function abrirFormulario(el) {
    estado.editandoId = el ? el.id : null;
    dom.titulo.textContent = el ? 'Editar elemento' : 'Nuevo elemento';
    dom.errores.hidden = true;

    var e = el || {
      id: '', categoria: 'otros', icono: '', origen: 'tabla81',
      mano: 'permitido', bodega: 'permitido', aprobacion: false,
      nombre: { es: '', en: '' }, limite: { es: '', en: '' },
      detalle: { es: [], en: [] }, claves: { es: [], en: [] }, fuente: { es: '', en: '' }
    };

    $('f_id').value = e.id || '(se genera al guardar)';
    $('f_categoria').value = e.categoria;
    $('f_icono').value = e.icono || '';
    $('f_origen').value = e.origen || 'tabla81';
    $('f_mano').value = e.mano;
    $('f_bodega').value = e.bodega;
    $('f_aprobacion').value = String(e.aprobacion);
    ['es', 'en'].forEach(function (l) {
      $('f_nombre_' + l).value = e.nombre[l] || '';
      $('f_limite_' + l).value = e.limite[l] || '';
      $('f_detalle_' + l).value = (e.detalle[l] || []).join('\n');
      $('f_claves_' + l).value = (e.claves[l] || []).join(', ');
      $('f_fuente_' + l).value = e.fuente[l] || '';
    });

    if (typeof dom.dialogo.showModal === 'function') dom.dialogo.showModal();
    else dom.dialogo.setAttribute('open', '');
    $('f_nombre_es').focus();
  }

  function cerrarFormulario() {
    if (typeof dom.dialogo.close === 'function') dom.dialogo.close();
    else dom.dialogo.removeAttribute('open');
  }

  function leerFormulario() {
    var apr = $('f_aprobacion').value;
    var el = {
      id: estado.editandoId,
      categoria: $('f_categoria').value,
      icono: $('f_icono').value.trim(),
      origen: $('f_origen').value,
      nombre: { es: $('f_nombre_es').value.trim(), en: $('f_nombre_en').value.trim() },
      claves: { es: comas($('f_claves_es').value), en: comas($('f_claves_en').value) },
      mano: $('f_mano').value,
      bodega: $('f_bodega').value,
      aprobacion: apr === 'true' ? true : (apr === 'false' ? false : null),
      limite: { es: $('f_limite_es').value.trim(), en: $('f_limite_en').value.trim() },
      detalle: { es: lineas($('f_detalle_es').value), en: lineas($('f_detalle_en').value) },
      fuente: { es: $('f_fuente_es').value.trim(), en: $('f_fuente_en').value.trim() }
    };
    if (!el.id) el.id = idUnico(slug(el.nombre.es || el.nombre.en));
    return el;
  }

  function validarElemento(el) {
    var err = [];
    if (!el.nombre.es) err.push('Falta el nombre en español.');
    if (!el.nombre.en) err.push('Falta el nombre en inglés.');
    if (!el.limite.es) err.push('Falta la condición breve en español.');
    if (!el.limite.en) err.push('Falta la condición breve en inglés.');
    if (!el.fuente.es || !el.fuente.en) err.push('Falta la referencia normativa en ambos idiomas.');
    if (el.mano === 'prohibido' && el.bodega === 'prohibido' && el.aprobacion !== null) {
      err.push('Si está prohibido en cabina y en bodega, la aprobación debe ser «No aplica».');
    }
    if (el.aprobacion === null && !(el.mano === 'prohibido' && el.bodega === 'prohibido')) {
      err.push('«No aplica» solo corresponde cuando el elemento está prohibido en cabina y en bodega.');
    }
    return err;
  }

  dom.form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var el = leerFormulario();
    var err = validarElemento(el);
    if (err.length) {
      dom.errores.innerHTML = err.map(esc).join('<br>');
      dom.errores.hidden = false;
      dom.errores.scrollIntoView({ block: 'nearest' });
      return;
    }
    var lista = estado.catalogo.elementos;
    var idx = -1;
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === el.id) { idx = i; break; } }
    if (idx >= 0) lista[idx] = el; else lista.unshift(el);
    cerrarFormulario();
    guardarBorrador();
    toast(idx >= 0 ? 'Elemento actualizado en el borrador.' : 'Elemento agregado al borrador.');
  });

  dom.dialogo.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-cerrar]')) cerrarFormulario();
  });

  /* ---------- Acciones de la tabla ---------- */
  dom.cuerpo.addEventListener('click', function (ev) {
    var bE = ev.target.closest('[data-editar]');
    var bD = ev.target.closest('[data-eliminar]');
    if (bE) {
      var id = bE.getAttribute('data-editar');
      var el = estado.catalogo.elementos.filter(function (x) { return x.id === id; })[0];
      if (el) abrirFormulario(EPV.clonar(el));
    }
    if (bD) {
      var idD = bD.getAttribute('data-eliminar');
      var elD = estado.catalogo.elementos.filter(function (x) { return x.id === idD; })[0];
      if (elD && window.confirm('¿Eliminar «' + elD.nombre.es + '» del borrador?')) {
        estado.catalogo.elementos = estado.catalogo.elementos.filter(function (x) { return x.id !== idD; });
        guardarBorrador();
        toast('Elemento eliminado del borrador.');
      }
    }
  });

  [dom.buscar, dom.filtroCat, dom.filtroOrigen].forEach(function (n) {
    n.addEventListener('input', render);
    n.addEventListener('change', render);
  });

  /* ---------- Barra de herramientas ---------- */
  $('btnNuevo').addEventListener('click', function () { abrirFormulario(null); });

  $('btnVista').addEventListener('click', function () {
    try { localStorage.setItem(EPV.CLAVE_BORRADOR, JSON.stringify(estado.catalogo)); } catch (e) {}
    window.open('./index.html?vista=borrador', '_blank');
  });

  $('btnExportar').addEventListener('click', function () {
    var datos = EPV.clonar(estado.catalogo);
    datos.esquema = EPV.ESQUEMA;
    datos.actualizado = hoy();
    var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Se descargó catalogo.json. Súbelo al repositorio para publicarlo.');
  });

  $('btnImportar').addEventListener('click', function () { dom.archivo.click(); });

  dom.archivo.addEventListener('change', function () {
    var f = dom.archivo.files && dom.archivo.files[0];
    if (!f) return;
    var lector = new FileReader();
    lector.onload = function () {
      var cat;
      try { cat = JSON.parse(lector.result); } catch (e) {
        window.alert('El archivo no es un JSON válido.');
        return;
      }
      var v = EPV.validarCatalogo(cat);
      if (!v.ok) {
        window.alert('No se puede importar. Problemas encontrados:\n\n- ' + v.errores.join('\n- '));
        return;
      }
      if (window.confirm('Se reemplazará el borrador actual por ' + cat.elementos.length + ' elementos del archivo. ¿Continuar?')) {
        estado.catalogo = cat;
        guardarBorrador();
        toast('Catálogo importado como borrador.');
      }
    };
    lector.readAsText(f);
    dom.archivo.value = '';
  });

  $('btnDescartar').addEventListener('click', function () {
    if (!hayCambios()) { toast('No hay cambios sin publicar.'); return; }
    if (window.confirm('¿Descartar todos los cambios del borrador y volver al catálogo publicado?')) {
      estado.catalogo = EPV.clonar(estado.publicado);
      try { localStorage.removeItem(EPV.CLAVE_BORRADOR); } catch (e) {}
      render();
      toast('Cambios descartados.');
    }
  });

  $('btnSemilla').addEventListener('click', function () {
    if (window.confirm('¿Reemplazar el borrador por el catálogo semilla original (Tabla 8-1 y Adenda 1)?')) {
      estado.catalogo = EPV.clonar(EPV.SEMILLA);
      guardarBorrador();
      toast('Borrador restaurado a la semilla original.');
    }
  });

  /* ---------- Inicio ---------- */
  llenarSelectCategorias($('f_categoria'), false);
  llenarSelectCategorias(dom.filtroCat, true);

  EPV.cargarPublicado().then(function (r) {
    estado.publicado = r.catalogo;
    estado.origenPublicado = r.origen;
    var borrador = EPV.leerBorrador();
    estado.catalogo = borrador || EPV.clonar(r.catalogo);
    render();
  });
})();
