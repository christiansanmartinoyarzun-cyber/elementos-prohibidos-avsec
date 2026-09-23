'use strict';

/* =========================================================
   Elementos Prohibidos en Vuelos · Lógica de la aplicación
   Referencia: IATA DGR Tabla 8.1 (2.3.A) y normativa DGAC.
   ========================================================= */

/* ---------- Catálogos ---------- */
const CATEGORIAS = {
  todos: { nombre: 'Todos' },
  electronica: { nombre: 'Electrónica y Baterías' },
  liquidos: { nombre: 'Líquidos y Aseo' },
  herramientas: { nombre: 'Herramientas y Armas' },
  otros: { nombre: 'Otros' }
};

const ESTADOS = {
  permitido: { icono: '✅', texto: 'Permitido' },
  prohibido: { icono: '❌', texto: 'Prohibido' },
  restringido: { icono: '⚠️', texto: 'Restringido' }
};

/* ---------- Base de datos simulada ----------
   mano / bodega: 'permitido' | 'prohibido' | 'restringido'
   aprobacion: true (requiere aprobación de la aerolínea),
               false (no requiere),
               null (no aplica: el objeto no puede viajar)
------------------------------------------------ */
const elementosVuelo = [
  {
    id: 'powerbank-100',
    nombre: 'Batería portátil (powerbank) hasta 100 Wh',
    categoria: 'electronica',
    icono: '🔋',
    claves: ['powerbank', 'power bank', 'cargador portatil', 'bateria externa', 'bateria de litio', 'mah', 'celular', 'carga'],
    mano: 'restringido',
    bodega: 'prohibido',
    aprobacion: false,
    limite: 'Solo en el equipaje de mano. Hasta 100 Wh (unos 27.000 mAh). Nunca en la maleta de bodega.',
    detalle: 'Protege los contactos para evitar cortocircuitos (en su funda o con cinta en los bornes). Muchas aerolíneas no permiten usarla ni cargarla durante el vuelo y limitan cuántas puedes llevar. Para calcular: Wh = (mAh × voltaje) ÷ 1000. Si no sabes su capacidad, puede ser rechazada.',
    fuente: 'IATA Tabla 8.1: baterías de litio de repuesto y bancos de energía.'
  },
  {
    id: 'powerbank-160',
    nombre: 'Batería portátil de más de 100 Wh (hasta 160 Wh)',
    categoria: 'electronica',
    icono: '🔋',
    claves: ['powerbank', 'power bank', 'bateria grande', 'bateria de camara', 'bateria de dron', 'estacion de carga', 'mah', 'litio'],
    mano: 'restringido',
    bodega: 'prohibido',
    aprobacion: true,
    limite: 'Solo en el equipaje de mano, máximo 2 por persona y con autorización previa de la aerolínea.',
    detalle: 'Son baterías grandes, típicas de cámaras profesionales, drones o estaciones de carga. Deben ir con los contactos protegidos. Pide la autorización a la aerolínea antes del día del vuelo.',
    fuente: 'IATA Tabla 8.1: baterías de litio de repuesto sobre 100 Wh y hasta 160 Wh.'
  },
  {
    id: 'bateria-160-mas',
    nombre: 'Batería de más de 160 Wh',
    categoria: 'electronica',
    icono: '⚡',
    claves: ['bateria grande', 'estacion de energia', 'power station', 'bateria de scooter', 'bateria de bicicleta electrica', 'litio', 'mah'],
    mano: 'prohibido',
    bodega: 'prohibido',
    aprobacion: null,
    limite: 'No puede viajar como equipaje de pasajero.',
    detalle: 'Incluye estaciones de energía portátiles grandes y baterías de bicicletas o scooters eléctricos. Para enviarlas se debe usar carga aérea bajo la reglamentación de mercancías peligrosas.',
    fuente: 'IATA Tabla 8.1: baterías de litio sobre 160 Wh.'
  },
  {
    id: 'vaper',
    nombre: 'Cigarrillo electrónico (vaper)',
    categoria: 'electronica',
    icono: '💨',
    claves: ['vaper', 'vape', 'vapeador', 'pod', 'cigarrillo electronico', 'e-cigarette', 'tabaco calentado', 'iqos'],
    mano: 'restringido',
    bodega: 'prohibido',
    aprobacion: false,
    limite: 'Solo en el equipaje de mano o en tu bolsillo. Prohibido usarlo o cargarlo a bordo.',
    detalle: 'Aplica a vapeadores, pods y dispositivos de tabaco calentado. El líquido de recarga sigue la regla de líquidos de 100 ml en cabina. Las baterías de repuesto deben ir protegidas contra cortocircuito.',
    fuente: 'IATA Tabla 8.1: cigarrillos electrónicos y dispositivos de vapeo.'
  },
  {
    id: 'dispositivos',
    nombre: 'Celular, notebook, tablet o cámara',
    categoria: 'electronica',
    icono: '💻',
    claves: ['celular', 'telefono', 'notebook', 'laptop', 'computador', 'tablet', 'ipad', 'camara', 'consola', 'audifonos', 'dispositivo'],
    mano: 'permitido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'En la mano sin problema. Si va en bodega, completamente apagado y protegido.',
    detalle: 'Se pueden llevar hasta 15 dispositivos electrónicos portátiles por persona. En bodega deben ir apagados (no en suspensión) y protegidos contra encendido accidental. Lo recomendable es llevarlos contigo, así evitas daños o pérdidas.',
    fuente: 'IATA Tabla 8.1: dispositivos electrónicos portátiles con baterías de litio.'
  },
  {
    id: 'smart-bag',
    nombre: 'Maleta inteligente (smart bag) con batería extraíble',
    categoria: 'electronica',
    icono: '🧳',
    claves: ['smart bag', 'maleta inteligente', 'maleta con bateria', 'maleta con cargador', 'maleta usb', 'equipaje inteligente'],
    mano: 'permitido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'Si la documentas, saca la batería y llévala contigo en la cabina.',
    detalle: 'Si la batería no se puede retirar, la maleta no puede viajar. Ojo: si en la puerta de embarque te piden enviar tu maleta de mano a bodega, primero retira la batería y llévala contigo.',
    fuente: 'IATA Tabla 8.1: equipaje con baterías de litio instaladas.'
  },
  {
    id: 'alcohol-24-70',
    nombre: 'Bebidas alcohólicas entre 24% y 70% (pisco, whisky, ron)',
    categoria: 'liquidos',
    icono: '🍾',
    claves: ['alcohol', 'licor', 'pisco', 'whisky', 'ron', 'vodka', 'tequila', 'gin', 'botella', 'destilado'],
    mano: 'restringido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'Máximo 5 litros por persona, en envases cerrados de venta. En la mano, solo envases de hasta 100 ml o compras del duty free en bolsa sellada.',
    detalle: 'Las bebidas bajo 24% (vino, cerveza) no tienen límite como mercancía peligrosa, pero siguen las reglas de líquidos en cabina y las franquicias de aduana del destino. Sobre 70% están prohibidas. No se permite beber alcohol propio a bordo.',
    fuente: 'IATA Tabla 8.1: bebidas alcohólicas. DGAC: regla de líquidos en cabina.'
  },
  {
    id: 'alcohol-70-mas',
    nombre: 'Bebidas alcohólicas de más de 70%',
    categoria: 'liquidos',
    icono: '🚫',
    claves: ['alcohol', 'alcohol puro', 'alcohol 96', 'licor fuerte', 'absenta', 'destilado', 'botella'],
    mano: 'prohibido',
    bodega: 'prohibido',
    aprobacion: null,
    limite: 'No puede viajar en ningún equipaje.',
    detalle: 'Sobre 70% de alcohol el líquido es inflamable. Incluye el alcohol de 96° y algunos licores de alta graduación. Revisa la etiqueta antes de empacar.',
    fuente: 'IATA Tabla 8.1: bebidas alcohólicas sobre 70% de alcohol.'
  },
  {
    id: 'aerosoles',
    nombre: 'Aerosoles de aseo personal (desodorante, laca, espuma de afeitar)',
    categoria: 'liquidos',
    icono: '🧴',
    claves: ['aerosol', 'spray', 'desodorante', 'laca', 'espuma de afeitar', 'perfume en spray', 'fijador', 'bloqueador en spray'],
    mano: 'restringido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'Cada envase hasta 500 ml; en total 2 litros por persona. En la mano, solo envases de hasta 100 ml.',
    detalle: 'La válvula debe ir protegida con su tapa para evitar descargas. Los aerosoles que no son de aseo personal ni medicinales (pintura, insecticida, lubricante) están prohibidos.',
    fuente: 'IATA Tabla 8.1: artículos medicinales y de tocador no radiactivos.'
  },
  {
    id: 'liquidos',
    nombre: 'Líquidos, geles y cremas (shampoo, perfume, bloqueador)',
    categoria: 'liquidos',
    icono: '💧',
    claves: ['liquido', 'gel', 'crema', 'shampoo', 'perfume', 'bloqueador', 'agua', 'jugo', 'pasta de dientes', 'maquillaje', 'mermelada', '100 ml'],
    mano: 'restringido',
    bodega: 'permitido',
    aprobacion: false,
    limite: 'En la mano: envases de hasta 100 ml, todos juntos en una bolsa transparente de 1 litro.',
    detalle: 'Excepciones: medicamentos y alimentos para bebés en la cantidad necesaria para el viaje (te pueden pedir respaldo). Es una regla del control de seguridad del aeropuerto, no de mercancías peligrosas.',
    fuente: 'DGAC: control de seguridad AVSEC (líquidos, aerosoles y geles).'
  },
  {
    id: 'plancha-gas',
    nombre: 'Rizador o plancha de pelo a gas (butano)',
    categoria: 'liquidos',
    icono: '💇',
    claves: ['plancha de pelo', 'rizador', 'alisador', 'butano', 'gas', 'secador'],
    mano: 'restringido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'Uno por persona, con la tapa de seguridad puesta. Las recargas de gas están prohibidas.',
    detalle: 'Las planchas y rizadores eléctricos comunes no tienen restricción. Si el modelo funciona con batería de litio, aplican las reglas de dispositivos electrónicos.',
    fuente: 'IATA Tabla 8.1: rizadores de pelo que contienen gas hidrocarburo.'
  },
  {
    id: 'municiones',
    nombre: 'Municiones (cartuchos para armas de fuego)',
    categoria: 'herramientas',
    icono: '🎯',
    claves: ['municion', 'municiones', 'balas', 'cartuchos', 'arma', 'arma de fuego', 'caza', 'tiro deportivo'],
    mano: 'prohibido',
    bodega: 'restringido',
    aprobacion: true,
    limite: 'Solo en bodega, bien embaladas, máximo 5 kg por persona y con autorización de la aerolínea.',
    detalle: 'Aplica a cartuchos de uso deportivo o de caza (clase 1.4S). Las municiones explosivas o incendiarias están prohibidas. El traslado de armas de fuego tiene requisitos legales y un procedimiento especial: consulta con tu aerolínea con anticipación.',
    fuente: 'IATA Tabla 8.1: cartuchos para armas (municiones).'
  },
  {
    id: 'herramientas',
    nombre: 'Herramientas de trabajo (destornilladores, llaves, alicates)',
    categoria: 'herramientas',
    icono: '🔧',
    claves: ['herramienta', 'destornillador', 'llave', 'alicate', 'martillo', 'taladro', 'sierra', 'napoleon', 'barreta', 'caja de herramientas'],
    mano: 'restringido',
    bodega: 'permitido',
    aprobacion: false,
    limite: 'Las de más de 6 cm van en bodega. Martillos, taladros, sierras y barretas siempre en bodega.',
    detalle: 'La decisión final la toma el personal de seguridad en el control. Si la herramienta es a batería, la batería de repuesto debe ir en la mano con sus contactos protegidos.',
    fuente: 'DGAC: control de seguridad AVSEC (artículos prohibidos en cabina).'
  },
  {
    id: 'cuchillos',
    nombre: 'Cuchillos, cortaplumas y cortacartones',
    categoria: 'herramientas',
    icono: '🔪',
    claves: ['cuchillo', 'cortaplumas', 'navaja', 'cortacartones', 'cuchillo cartonero', 'tijeras', 'hoja de afeitar', 'machete', 'multiherramienta'],
    mano: 'prohibido',
    bodega: 'permitido',
    aprobacion: false,
    limite: 'Nunca en la mano. En bodega, bien envueltos para no herir a quien revise la maleta.',
    detalle: 'Las tijeras con hojas de hasta 6 cm suelen aceptarse en cabina; las más grandes van en bodega. Las hojas de afeitar sueltas tampoco pasan en cabina.',
    fuente: 'DGAC: control de seguridad AVSEC (objetos cortantes).'
  },
  {
    id: 'gas-pimienta',
    nombre: 'Gas pimienta o spray de defensa personal',
    categoria: 'herramientas',
    icono: '🧯',
    claves: ['gas pimienta', 'spray de defensa', 'gas lacrimogeno', 'defensa personal', 'mace', 'aerosol'],
    mano: 'prohibido',
    bodega: 'prohibido',
    aprobacion: null,
    limite: 'No puede viajar en ningún equipaje.',
    detalle: 'Los dispositivos que contienen sustancias irritantes o incapacitantes están prohibidos en todo el avión. Los paralizadores eléctricos (tasers) también están prohibidos.',
    fuente: 'IATA Tabla 8.1: dispositivos incapacitantes.'
  },
  {
    id: 'termometro-mercurio',
    nombre: 'Termómetro médico de mercurio',
    categoria: 'otros',
    icono: '🌡️',
    claves: ['termometro', 'mercurio', 'fiebre', 'medico', 'clinico'],
    mano: 'prohibido',
    bodega: 'restringido',
    aprobacion: false,
    limite: 'Solo en bodega: uno por persona, para uso personal y en su estuche protector.',
    detalle: 'Los termómetros digitales no tienen restricción. Los barómetros y otros instrumentos con mercurio no se permiten como equipaje de pasajero.',
    fuente: 'IATA Tabla 8.1: termómetro médico o clínico.'
  },
  {
    id: 'fosforos-encendedor',
    nombre: 'Fósforos de seguridad o encendedor pequeño',
    categoria: 'otros',
    icono: '🔥',
    claves: ['fosforos', 'cerillos', 'encendedor', 'yesquero', 'mechero', 'fumar', 'cigarros'],
    mano: 'restringido',
    bodega: 'prohibido',
    aprobacion: false,
    limite: 'Solo uno por persona y en tu bolsillo, no dentro del bolso ni de la maleta.',
    detalle: 'Prohibidos siempre: fósforos que encienden raspándolos en cualquier superficie, encendedores tipo soplete (llama azul o de chorro) y recargas de gas o bencina para encendedores.',
    fuente: 'IATA Tabla 8.1: fósforos de seguridad y encendedores pequeños.'
  },
  {
    id: 'hielo-seco',
    nombre: 'Hielo seco (para conservar alimentos)',
    categoria: 'otros',
    icono: '🧊',
    claves: ['hielo seco', 'co2', 'cooler', 'conservar', 'alimentos congelados', 'mariscos', 'refrigerar'],
    mano: 'restringido',
    bodega: 'restringido',
    aprobacion: true,
    limite: 'Máximo 2,5 kg por persona, en un envase que deje escapar el gas y rotulado.',
    detalle: 'El paquete debe indicar «Hielo seco» o «UN1845» y el peso neto. El hielo común (agua) no es mercancía peligrosa, pero en cabina sigue la regla de líquidos si se derrite.',
    fuente: 'IATA Tabla 8.1: hielo seco (dióxido de carbono sólido).'
  },
  {
    id: 'gas-camping',
    nombre: 'Gas de camping, bencina blanca o combustible para cocinillas',
    categoria: 'otros',
    icono: '⛺',
    claves: ['gas', 'camping', 'cocinilla', 'cartucho de gas', 'bencina', 'combustible', 'parafina', 'butano', 'trekking'],
    mano: 'prohibido',
    bodega: 'prohibido',
    aprobacion: null,
    limite: 'Ningún combustible ni cartucho de gas puede viajar.',
    detalle: 'Una cocinilla o botella de combustible completamente vacía y limpia (sin olor ni residuos) puede viajar en bodega solo con aprobación de la aerolínea. Compra el gas en tu destino.',
    fuente: 'IATA Tabla 8.1: equipos de camping y recipientes de combustible.'
  },
  {
    id: 'fuegos-artificiales',
    nombre: 'Fuegos artificiales y bengalas',
    categoria: 'otros',
    icono: '🎆',
    claves: ['fuegos artificiales', 'bengala', 'petardo', 'pirotecnia', 'volador', 'chispitas', 'explosivo'],
    mano: 'prohibido',
    bodega: 'prohibido',
    aprobacion: null,
    limite: 'No pueden viajar en ningún equipaje.',
    detalle: 'Incluye bengalas de mano, velas de chispas, petardos y cualquier artículo pirotécnico, aunque sea pequeño o de juguete.',
    fuente: 'IATA Tabla 8.1: explosivos y artículos pirotécnicos.'
  }
];

/* ---------- Estado de la interfaz ---------- */
const estadoUI = {
  categoria: 'todos',
  consulta: ''
};

/* ---------- Referencias al DOM ---------- */
const dom = {
  buscador: document.getElementById('buscador'),
  formBusqueda: document.getElementById('formBusqueda'),
  limpiar: document.getElementById('limpiarBusqueda'),
  chips: document.getElementById('chips'),
  lista: document.getElementById('listaResultados'),
  resumen: document.getElementById('resumen'),
  sinResultados: document.getElementById('sinResultados'),
  verTodos: document.getElementById('verTodos'),
  toggleTema: document.getElementById('toggleTema'),
  temaPerilla: document.getElementById('temaPerilla'),
  metaTema: document.querySelector('meta[name="theme-color"]')
};

/* ---------- Utilidades ---------- */
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Índice de búsqueda precalculado (nombre + sinónimos + condición + categoría) */
const indiceBusqueda = elementosVuelo.map(function (el) {
  return {
    el: el,
    texto: normalizar([el.nombre, el.claves.join(' '), el.limite, CATEGORIAS[el.categoria].nombre].join(' '))
  };
});

function coincideConsulta(item, terminos) {
  return terminos.every(function (t) {
    return item.texto.indexOf(t) !== -1;
  });
}

function obtenerTerminos() {
  return normalizar(estadoUI.consulta).split(' ').filter(Boolean);
}

function filtrarElementos() {
  const terminos = obtenerTerminos();
  return indiceBusqueda
    .filter(function (item) {
      const enCategoria = estadoUI.categoria === 'todos' || item.el.categoria === estadoUI.categoria;
      return enCategoria && coincideConsulta(item, terminos);
    })
    .map(function (item) {
      return item.el;
    });
}

/* ---------- Plantillas ---------- */
function bloqueEstado(icono, titulo, valor) {
  const e = ESTADOS[valor];
  return (
    '<div class="estado" data-estado="' + valor + '">' +
      '<span class="estado-titulo"><span aria-hidden="true">' + icono + '</span> ' + titulo + '</span>' +
      '<span class="estado-valor"><span aria-hidden="true">' + e.icono + '</span> ' + e.texto + '</span>' +
    '</div>'
  );
}

function textoAviso(aprobacion) {
  if (aprobacion === true) {
    return '<dd class="aviso-si">Requiere aprobación</dd>';
  }
  if (aprobacion === false) {
    return '<dd class="aviso-no">No requiere</dd>';
  }
  return '<dd class="aviso-na">No aplica: no puede viajar</dd>';
}

function tarjetaHTML(el) {
  const idTitulo = 't-' + el.id;
  return (
    '<li>' +
      '<article class="tarjeta" aria-labelledby="' + idTitulo + '">' +
        '<div class="flex items-start gap-3">' +
          '<span class="tarjeta-icono" aria-hidden="true">' + el.icono + '</span>' +
          '<div class="min-w-0">' +
            '<h2 id="' + idTitulo + '" class="tarjeta-titulo">' + escaparHTML(el.nombre) + '</h2>' +
            '<p class="tarjeta-categoria">' + escaparHTML(CATEGORIAS[el.categoria].nombre) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-2 mt-4">' +
          bloqueEstado('🎒', 'Equipaje de mano', el.mano) +
          bloqueEstado('🧳', 'Equipaje de bodega', el.bodega) +
        '</div>' +

        '<dl class="mt-2">' +
          '<div class="fila-aviso">' +
            '<dt><span aria-hidden="true">✈️</span> Aviso a aerolínea</dt>' +
            textoAviso(el.aprobacion) +
          '</div>' +
          '<div class="fila-limite">' +
            '<dt><span aria-hidden="true">📏</span> Condición o límite</dt>' +
            '<dd>' + escaparHTML(el.limite) + '</dd>' +
          '</div>' +
        '</dl>' +

        '<details class="detalle">' +
          '<summary>Más detalles</summary>' +
          '<div class="detalle-cuerpo">' +
            '<p>' + escaparHTML(el.detalle) + '</p>' +
            '<p class="detalle-fuente">Referencia: ' + escaparHTML(el.fuente) + '</p>' +
          '</div>' +
        '</details>' +
      '</article>' +
    '</li>'
  );
}

/* ---------- Renderizado ---------- */
function actualizarContadores() {
  const terminos = obtenerTerminos();
  const conteo = { todos: 0, electronica: 0, liquidos: 0, herramientas: 0, otros: 0 };

  indiceBusqueda.forEach(function (item) {
    if (coincideConsulta(item, terminos)) {
      conteo.todos += 1;
      conteo[item.el.categoria] += 1;
    }
  });

  dom.chips.querySelectorAll('[data-n]').forEach(function (span) {
    span.textContent = conteo[span.getAttribute('data-n')];
  });
}

function actualizarResumen(cantidad) {
  const consulta = estadoUI.consulta.trim();
  const palabra = cantidad === 1 ? 'objeto' : 'objetos';
  let texto = cantidad + ' ' + palabra;

  if (consulta) {
    texto += ' para «' + consulta + '»';
  }
  if (estadoUI.categoria !== 'todos') {
    texto += ' en ' + CATEGORIAS[estadoUI.categoria].nombre;
  }
  dom.resumen.textContent = texto;
}

function renderizar() {
  const resultados = filtrarElementos();

  dom.lista.innerHTML = resultados.map(tarjetaHTML).join('');
  dom.sinResultados.hidden = resultados.length > 0;
  dom.lista.hidden = resultados.length === 0;

  actualizarResumen(resultados.length);
  actualizarContadores();
}

/* ---------- Búsqueda ---------- */
function alEscribir() {
  estadoUI.consulta = dom.buscador.value;
  dom.limpiar.hidden = estadoUI.consulta.length === 0;
  renderizar();
}

function limpiarBusqueda(enfocar) {
  dom.buscador.value = '';
  alEscribir();
  if (enfocar) dom.buscador.focus();
}

dom.buscador.addEventListener('input', alEscribir);

dom.buscador.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') {
    limpiarBusqueda(true);
  }
});

dom.formBusqueda.addEventListener('submit', function (evento) {
  evento.preventDefault();
  dom.buscador.blur(); // oculta el teclado en móviles
});

dom.limpiar.addEventListener('click', function () {
  limpiarBusqueda(true);
});

/* ---------- Filtros por categoría ---------- */
function seleccionarCategoria(categoria) {
  estadoUI.categoria = categoria;

  dom.chips.querySelectorAll('.chip').forEach(function (chip) {
    const activo = chip.getAttribute('data-categoria') === categoria;
    chip.setAttribute('aria-pressed', String(activo));
    if (activo && typeof chip.scrollIntoView === 'function') {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  renderizar();
}

dom.chips.addEventListener('click', function (evento) {
  const chip = evento.target.closest('.chip');
  if (!chip) return;
  seleccionarCategoria(chip.getAttribute('data-categoria'));
});

dom.verTodos.addEventListener('click', function () {
  dom.buscador.value = '';
  estadoUI.consulta = '';
  dom.limpiar.hidden = true;
  seleccionarCategoria('todos');
});

/* ---------- Tema claro / oscuro ---------- */
function aplicarTema(oscuro, guardar) {
  document.documentElement.classList.toggle('dark', oscuro);
  dom.toggleTema.setAttribute('aria-checked', String(oscuro));
  dom.temaPerilla.textContent = oscuro ? '🌙' : '☀️';
  if (dom.metaTema) {
    dom.metaTema.setAttribute('content', oscuro ? '#232C3A' : '#FFC72C');
  }
  if (guardar) {
    try {
      localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
    } catch (e) {
      /* almacenamiento no disponible: el tema funciona igual en esta sesión */
    }
  }
}

dom.toggleTema.addEventListener('click', function () {
  const oscuro = !document.documentElement.classList.contains('dark');
  aplicarTema(oscuro, true);
});

/* Sigue el tema del sistema mientras el usuario no haya elegido uno */
if (window.matchMedia) {
  const consultaSistema = window.matchMedia('(prefers-color-scheme: dark)');
  const alCambiarSistema = function (e) {
    let elegido = null;
    try {
      elegido = localStorage.getItem('tema');
    } catch (err) {
      elegido = null;
    }
    if (!elegido) aplicarTema(e.matches, false);
  };
  if (typeof consultaSistema.addEventListener === 'function') {
    consultaSistema.addEventListener('change', alCambiarSistema);
  } else if (typeof consultaSistema.addListener === 'function') {
    consultaSistema.addListener(alCambiarSistema);
  }
}

/* ---------- PWA: registro del service worker ---------- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {
      /* sin service worker la app funciona igual, solo sin modo offline */
    });
  });
}

/* ---------- Inicio ---------- */
aplicarTema(document.documentElement.classList.contains('dark'), false);
renderizar();
