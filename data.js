'use strict';

/* =========================================================
   Elementos Prohibidos en Vuelos · Datos compartidos
   Lo usan el portal público (script.js) y el mantenedor (admin.js).

   Normativa base:
   - OACI Doc 9284, Instrucciones Técnicas, Ed. 2025–2026 (edición DGAC),
     Parte 8, Tabla 8-1.
   - Adenda 1 (vigente desde el 27/3/2026): nuevas reglas de baterías
     de litio y bancos de energía (power banks).
   - Elementos de seguridad de la aviación (AVSEC) no cubiertos por la
     Tabla 8-1 (líquidos, cortopunzantes, etc.) se marcan con
     origen "avsec" para su validación por el área técnica.
   ========================================================= */

window.EPV = window.EPV || {};

EPV.ESQUEMA = 2;
EPV.CLAVE_BORRADOR = 'epv-borrador';
EPV.RUTA_CATALOGO = './catalogo.json';

/* ---------- Categorías (fijas) ---------- */
EPV.CATEGORIAS = [
  { id: 'liquidos',       icono: '🧴', es: 'Líquidos y geles',        en: 'Liquids & gels' },
  { id: 'electronica',    icono: '🔋', es: 'Electrónica y baterías',  en: 'Electronics & batteries' },
  { id: 'cortopunzantes', icono: '✂️', es: 'Cortopunzantes',          en: 'Sharp objects' },
  { id: 'armas',          icono: '🎯', es: 'Armas y municiones',      en: 'Weapons & ammunition' },
  { id: 'inflamables',    icono: '🔥', es: 'Inflamables y químicos',  en: 'Flammables & chemicals' },
  { id: 'deportivos',     icono: '⛷️', es: 'Artículos deportivos',    en: 'Sporting goods' },
  { id: 'salud',          icono: '💊', es: 'Salud y medicamentos',    en: 'Health & medicines' },
  { id: 'alimentos',      icono: '🍎', es: 'Alimentos',               en: 'Food' },
  { id: 'otros',          icono: '📦', es: 'Otros',                   en: 'Other' }
];

EPV.ESTADOS = ['permitido', 'restringido', 'prohibido'];

/* ---------- Íconos propios (SVG) ----------
   En el campo "icono" se puede usar un emoji o "svg:<nombre>". */
EPV.ICONOS_SVG = {
  'arma-fuego': '<svg class="icono-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M2.2 6.4h16.9l.6-.9h2.1v4.6c0 .5-.4.9-.9.9h-8.6l-.9 2.2a1 1 0 0 1-.9.6H9.1l1.2 5.4a.8.8 0 0 1-.8 1H5.6a.8.8 0 0 1-.8-.6L2.9 11.5 2.2 10.9Z"/>' +
    '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M11 11.2c0 1.9 1 2.6 2.6 2.4v-2.3"/>' +
    '</svg>',
  'spray-defensa': '<svg class="icono-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect fill="currentColor" x="4.5" y="9.4" width="8" height="12" rx="1.6"/>' +
    '<path fill="currentColor" d="M5.4 9.6c0-1.7 1.4-2.6 3.1-2.6s3.1.9 3.1 2.6Z"/>' +
    '<rect fill="currentColor" x="7.1" y="3.6" width="2.8" height="3.4" rx=".5"/>' +
    '<rect fill="currentColor" x="9.9" y="4.3" width="1.9" height="1.3" rx=".4"/>' +
    '<g fill="#D1344B"><circle cx="14.6" cy="5" r=".95"/><circle cx="17.3" cy="3.4" r=".95"/><circle cx="17.3" cy="6.6" r=".95"/>' +
    '<circle cx="20.1" cy="2.2" r=".95"/><circle cx="20.1" cy="5" r=".95"/><circle cx="20.1" cy="7.8" r=".95"/></g>' +
    '</svg>'
};

EPV.iconoHTML = function (icono, respaldo) {
  var v = icono || respaldo || '';
  if (typeof v === 'string' && v.indexOf('svg:') === 0 && EPV.ICONOS_SVG[v.slice(4)]) {
    return EPV.ICONOS_SVG[v.slice(4)];
  }
  return EPV.escaparHTML(v);
};

EPV.ORIGENES = {
  tabla81:    { es: 'Tabla 8-1 (OACI Doc 9284)',               en: 'Table 8-1 (ICAO Doc 9284)' },
  no_listado: { es: 'No figura en Tabla 8-1 (no autorizado)',  en: 'Not listed in Table 8-1 (not permitted)' },
  avsec:      { es: 'Seguridad AVSEC (validar con DGAC)',      en: 'AVSEC security (to be validated by DGAC)' }
};

/* ---------- Referencias normativas reutilizables ---------- */
function ref(item, detalleEs, detalleEn, adenda) {
  var es = 'OACI Doc 9284 (Ed. 2025–2026), Tabla 8-1, ítem ' + item + (detalleEs ? ' ' + detalleEs : '');
  var en = 'ICAO Doc 9284 (2025–2026 Ed.), Table 8-1, item ' + item + (detalleEn ? ' ' + detalleEn : '');
  if (adenda) {
    es += ', modificado por la Adenda 1 (vigente desde el 27/3/2026)';
    en += ', as amended by Addendum 1 (applicable from 27 March 2026)';
  }
  return { es: es + '.', en: en + '.' };
}

var REF_NO_LISTADO = {
  es: 'OACI Doc 9284, Parte 8: no figura en la Tabla 8-1, por lo que no está autorizado como equipaje de pasajero.',
  en: 'ICAO Doc 9284, Part 8: not listed in Table 8-1, therefore not permitted in passenger baggage.'
};

var REF_AVSEC = {
  es: 'Seguridad de la aviación (AVSEC), DGAC: control de seguridad de pasajeros y equipaje de mano.',
  en: 'Aviation security (AVSEC), DGAC: passenger and cabin baggage screening.'
};

/* ---------- Catálogo semilla ----------
   mano / bodega: 'permitido' | 'restringido' | 'prohibido'
   aprobacion: true (requiere aprobación del explotador) | false | null (no aplica)
   origen: 'tabla81' | 'no_listado' | 'avsec'
--------------------------------------------------------- */
EPV.SEMILLA = {
  esquema: 2,
  actualizado: '2026-09-23',
  normativa: {
    es: 'OACI Doc 9284 (Ed. 2025–2026), Tabla 8-1 y Adenda 1 (vigente desde el 27/3/2026).',
    en: 'ICAO Doc 9284 (2025–2026 Ed.), Table 8-1 and Addendum 1 (applicable from 27 March 2026).'
  },
  elementos: [

    /* ===================== ELECTRÓNICA Y BATERÍAS ===================== */
    {
      id: 'power-bank',
      categoria: 'electronica',
      icono: '🔋',
      origen: 'tabla81',
      nombre: { es: 'Banco de energía (power bank)', en: 'Power bank' },
      claves: {
        es: ['power bank', 'powerbank', 'banco de energia', 'bateria externa', 'cargador portatil', 'mah', 'celular'],
        en: ['power bank', 'portable charger', 'external battery', 'battery pack', 'mah', 'phone']
      },
      mano: 'restringido',
      bodega: 'prohibido',
      aprobacion: false,
      limite: {
        es: 'Solo en cabina, hasta 100 Wh y máximo 2 por persona. No se recargan a bordo y la aerolínea puede prohibirlos.',
        en: 'Cabin only, up to 100 Wh and no more than 2 per person. No recharging on board, and the airline may forbid them.'
      },
      detalle: {
        es: [
          'Capacidad máxima por unidad: 100 Wh (ion litio) o 2 g de litio (metal litio). Entre 100 y 160 Wh requiere aprobación de la aerolínea.',
          'No pueden transportarse más de 2 bancos de energía por persona.',
          'Deben ir en el equipaje de mano. Están prohibidos en el equipaje facturado (bodega).',
          'No deben recargarse mientras estén a bordo y no deberían usarse para recargar otros aparatos durante el vuelo.',
          'Cada uno debe ir protegido contra cortocircuitos cuando no se use: en su embalaje original, con cinta adhesiva sobre los bornes o en una bolsa o funda individual.',
          'Los explotadores aéreos pueden prohibir el transporte de estas baterías, bancos de energía o power bank, por lo que se recomienda tomar contacto con el operador aéreo antes de viajar.',
          'Para calcular los Wh: mAh × voltaje ÷ 1000 (ej.: 20.000 mAh a 3,7 V = 74 Wh).'
        ],
        en: [
          'Maximum per unit: 100 Wh (lithium ion) or 2 g of lithium (lithium metal). Between 100 and 160 Wh requires airline approval.',
          'No more than 2 power banks may be carried per person.',
          'They must be carried in cabin baggage. They are forbidden in checked baggage.',
          'They must not be recharged while on board and should not be used to recharge other devices during the flight.',
          'Each one must be protected from short circuit when not in use: in its original retail packaging, with tape over the terminals, or in an individual bag or pouch.',
          'Air operators may forbid the carriage of these batteries and power banks, so it is recommended to contact the airline before travelling.',
          'To calculate Wh: mAh × voltage ÷ 1000 (e.g. 20,000 mAh at 3.7 V = 74 Wh).'
        ]
      },
      fuente: ref('1', 'b), c) e i)', 'b), c) and i)', true)
    },
    {
      id: 'bateria-100-160',
      categoria: 'electronica',
      icono: '🔋',
      origen: 'tabla81',
      nombre: { es: 'Batería de ion litio de más de 100 Wh y hasta 160 Wh', en: 'Lithium ion battery over 100 Wh and up to 160 Wh' },
      claves: {
        es: ['bateria grande', 'bateria de camara', 'bateria de dron', 'drone', '160 wh', 'power bank grande', 'litio'],
        en: ['large battery', 'camera battery', 'drone battery', '160 wh', 'large power bank', 'lithium']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Requiere aprobación de la aerolínea. Si es de repuesto, solo en cabina y máximo 2 por persona.',
        en: 'Requires airline approval. If it is a spare, cabin only and no more than 2 per person.'
      },
      detalle: {
        es: [
          'Son típicas de equipos profesionales: cámaras de video, drones o notebooks de alto rendimiento.',
          'Instalada en un aparato: preferentemente en cabina. Si va en bodega, el aparato debe ir completamente apagado y protegido contra daños.',
          'De repuesto: solo en equipaje de mano, máximo 2 por persona y cada una protegida contra cortocircuitos.',
          'Si es un banco de energía, además rigen sus reglas: máximo 2 por persona y sin recargarlo a bordo.',
          'Los explotadores aéreos pueden prohibir el transporte de estas baterías, bancos de energía o power bank, por lo que se recomienda tomar contacto con el operador aéreo antes de viajar.'
        ],
        en: [
          'Typical of professional equipment: video cameras, drones or high-performance laptops.',
          'Installed in a device: preferably in the cabin. If checked, the device must be completely switched off and protected from damage.',
          'As a spare: cabin baggage only, no more than 2 per person, each protected from short circuit.',
          'If it is a power bank, its own rules also apply: no more than 2 per person and no recharging on board.',
          'Air operators may forbid the carriage of these batteries and power banks, so it is recommended to contact the airline before travelling.'
        ]
      },
      fuente: ref('1', 'c), e), f) y h)', 'c), e), f) and h)', true)
    },
    {
      id: 'baterias-repuesto',
      categoria: 'electronica',
      icono: '🪫',
      origen: 'tabla81',
      nombre: { es: 'Baterías de litio de repuesto (cámara, notebook, dron)', en: 'Spare lithium batteries (camera, laptop, drone)' },
      claves: {
        es: ['bateria de repuesto', 'bateria suelta', 'bateria de litio', 'pila de litio', 'bateria camara', 'bateria notebook'],
        en: ['spare battery', 'loose battery', 'lithium battery', 'lithium cell', 'camera battery', 'laptop battery']
      },
      mano: 'restringido',
      bodega: 'prohibido',
      aprobacion: false,
      limite: {
        es: 'Solo en cabina, cada una protegida contra cortocircuitos. Máximo 2 por persona.',
        en: 'Cabin only, each protected from short circuit. No more than 2 per person.'
      },
      detalle: {
        es: [
          'Hasta 100 Wh (ion litio) o 2 g de litio (metal litio) por batería.',
          'Deben transportarse en el equipaje de mano. Están prohibidas en el equipaje facturado.',
          'No pueden transportarse más de 2 baterías de repuesto por persona.',
          'Deben ir individualmente protegidas: en su embalaje original, con cinta adhesiva sobre los bornes o en una bolsa plástica o funda protectora.',
          'Los explotadores aéreos pueden prohibir el transporte de estas baterías, bancos de energía o power bank, por lo que se recomienda tomar contacto con el operador aéreo antes de viajar.'
        ],
        en: [
          'Up to 100 Wh (lithium ion) or 2 g of lithium (lithium metal) per battery.',
          'They must be carried in cabin baggage. They are forbidden in checked baggage.',
          'No more than 2 spare batteries may be carried per person.',
          'Each must be individually protected: in its original retail packaging, with tape over the terminals, or in a plastic bag or protective pouch.',
          'Air operators may forbid the carriage of these batteries and power banks, so it is recommended to contact the airline before travelling.'
        ]
      },
      fuente: {
        es: 'OACI Doc 9284 (Ed. 2025–2026), Tabla 8-1, ítem 1 b), e) y h), modificado por la Adenda 1 (vigente desde el 27/3/2026); criterio de cantidad según orientación DGAC para pasajeros.',
        en: 'ICAO Doc 9284 (2025–2026 Ed.), Table 8-1, item 1 b), e) and h), as amended by Addendum 1 (applicable from 27 March 2026); quantity criterion per DGAC passenger guidance.'
      }
    },
    {
      id: 'dispositivos-electronicos',
      categoria: 'electronica',
      icono: '💻',
      origen: 'tabla81',
      nombre: { es: 'Celular, notebook, tablet o cámara', en: 'Phone, laptop, tablet or camera' },
      claves: {
        es: ['celular', 'telefono', 'notebook', 'computador', 'laptop', 'tablet', 'ipad', 'camara', 'consola', 'audifonos', 'reloj inteligente'],
        en: ['phone', 'mobile', 'cell phone', 'laptop', 'computer', 'notebook', 'tablet', 'camera', 'console', 'headphones', 'smartwatch']
      },
      mano: 'permitido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Mejor en cabina. En bodega: completamente apagado (no en reposo) y protegido contra daños.',
        en: 'Best in the cabin. In checked baggage: completely switched off (not in sleep mode) and protected from damage.'
      },
      detalle: {
        es: [
          'Sus baterías no deben superar 100 Wh (ion litio) o 2 g de litio (metal litio).',
          'Toma medidas para evitar que se enciendan accidentalmente y protégelos contra daños.',
          'Deberían transportarse en el equipaje de mano.',
          'Si van en equipaje facturado deben ir completamente apagados, no en modo de reposo ni hibernación. La Tabla 8-1 asocia a este caso los criterios de 0,3 g de litio (metal litio) o 2,7 Wh (ion litio) por aparato: ante la duda, llévalos en cabina.',
          'Los explotadores aéreos pueden prohibir el transporte de estas baterías, bancos de energía o power bank, por lo que se recomienda tomar contacto con el operador aéreo antes de viajar.'
        ],
        en: [
          'Their batteries must not exceed 100 Wh (lithium ion) or 2 g of lithium (lithium metal).',
          'Take measures to prevent accidental activation and protect them from damage.',
          'They should be carried in cabin baggage.',
          'If checked, they must be completely switched off, not in sleep or hibernation mode. Table 8-1 links this case to criteria of 0.3 g of lithium (lithium metal) or 2.7 Wh (lithium ion) per device: if in doubt, carry them in the cabin.',
          'Air operators may forbid the carriage of these batteries and power banks, so it is recommended to contact the airline before travelling.'
        ]
      },
      fuente: ref('1', 'b) y f)', 'b) and f)', true)
    },
    {
      id: 'vaper',
      categoria: 'electronica',
      icono: '💨',
      origen: 'tabla81',
      nombre: { es: 'Cigarrillo electrónico o vaporizador (vaper)', en: 'E-cigarette or vaporiser (vape)' },
      claves: {
        es: ['vaper', 'vape', 'vapeador', 'vaporizador', 'pod', 'cigarrillo electronico', 'pipa electronica', 'nicotina', 'iqos'],
        en: ['vape', 'vaper', 'vaporiser', 'vaporizer', 'pod', 'e-cigarette', 'electronic cigarette', 'e-pipe', 'nicotine']
      },
      mano: 'restringido',
      bodega: 'prohibido',
      aprobacion: false,
      limite: {
        es: 'Solo en cabina. Ni el aparato ni sus baterías pueden recargarse a bordo.',
        en: 'Cabin only. Neither the device nor its batteries may be recharged on board.'
      },
      detalle: {
        es: [
          'Incluye cigarrillos y cigarros electrónicos, pipas electrónicas, vaporizadores personales y sistemas electrónicos de administración de nicotina.',
          'Están prohibidos en el equipaje facturado.',
          'Sus baterías de litio deben cumplir los límites de 100 Wh o 2 g de litio, y las de repuesto deben ir protegidas contra cortocircuitos.',
          'Deben tomarse medidas para impedir la activación accidental del elemento calefactor.',
          'En vuelos a Estados Unidos, el líquido de recarga en cabina debe ir en envases de hasta 100 ml.'
        ],
        en: [
          'Includes electronic cigarettes and cigars, e-pipes, personal vaporisers and electronic nicotine delivery systems.',
          'They are forbidden in checked baggage.',
          'Their lithium batteries must meet the 100 Wh or 2 g lithium limits, and spares must be protected from short circuit.',
          'Measures must be taken to prevent accidental activation of the heating element.',
          'On flights to the United States, cabin refill liquid must be in containers of up to 100 ml.'
        ]
      },
      fuente: ref('3', '', '', false)
    },
    {
      id: 'maleta-inteligente',
      categoria: 'electronica',
      icono: '🧳',
      origen: 'tabla81',
      nombre: { es: 'Maleta inteligente (smart bag) con batería de litio', en: 'Smart bag with lithium battery' },
      claves: {
        es: ['smart bag', 'maleta inteligente', 'maleta con bateria', 'maleta con cargador', 'maleta usb', 'equipaje inteligente'],
        en: ['smart bag', 'smart luggage', 'suitcase with battery', 'suitcase charger', 'usb suitcase']
      },
      mano: 'permitido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Si la documentas, retira la batería y llévala contigo en cabina.',
        en: 'If you check it in, remove the battery and carry it with you in the cabin.'
      },
      detalle: {
        es: [
          'Si sus baterías superan 0,3 g de litio (metal litio) o 2,7 Wh (ion litio), la maleta debe ir como equipaje de mano, salvo que se extraigan las baterías.',
          'La batería extraída viaja como batería de repuesto: en cabina y protegida contra cortocircuitos.',
          'Si en la puerta de embarque te piden enviar tu maleta a bodega, retira antes la batería.'
        ],
        en: [
          'If its batteries exceed 0.3 g of lithium (lithium metal) or 2.7 Wh (lithium ion), the bag must travel as cabin baggage unless the batteries are removed.',
          'The removed battery travels as a spare battery: in the cabin and protected from short circuit.',
          'If you are asked to check your bag at the gate, remove the battery first.'
        ]
      },
      fuente: ref('1', 'h) y j)', 'h) and j)', true)
    },
    {
      id: 'aparatos-calor',
      categoria: 'electronica',
      icono: '🔦',
      origen: 'tabla81',
      nombre: { es: 'Aparatos que pueden generar calor extremo (linternas de buceo, soldadores portátiles)', en: 'Devices capable of generating extreme heat (diving lamps, portable soldering irons)' },
      claves: {
        es: ['linterna de buceo', 'soldador', 'cautin', 'elemento calefactor', 'calor extremo'],
        en: ['diving lamp', 'dive torch', 'soldering iron', 'heating element', 'extreme heat']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Retira la batería o el elemento calefactor antes de empacar.',
        en: 'Remove the battery or the heating element before packing.'
      },
      detalle: {
        es: [
          'Aplica a aparatos a batería capaces de generar calor extremo que pueda causar un incendio si se activan.',
          'Debe aislarse el elemento calefactor o la batería, extrayendo el componente del aparato.',
          'Las baterías de litio extraídas siguen las reglas de baterías de repuesto: solo en cabina y protegidas.'
        ],
        en: [
          'Applies to battery-powered devices capable of generating extreme heat that could cause a fire if activated.',
          'The heating element or the battery must be isolated by removing the component from the device.',
          'Removed lithium batteries follow spare battery rules: cabin only and protected.'
        ]
      },
      fuente: {
        es: 'OACI Doc 9284 (Ed. 2025–2026), Tabla 8-1, ítem 1 g) (modificado por la Adenda 1) e ítem 2 c).',
        en: 'ICAO Doc 9284 (2025–2026 Ed.), Table 8-1, item 1 g) (as amended by Addendum 1) and item 2 c).'
      }
    },
    {
      id: 'pilas-comunes',
      categoria: 'electronica',
      icono: '🔌',
      origen: 'tabla81',
      nombre: { es: 'Pilas alcalinas y recargables de níquel (AA, AAA, NiMH)', en: 'Alkaline and nickel rechargeable batteries (AA, AAA, NiMH)' },
      claves: {
        es: ['pilas', 'pila aa', 'pila aaa', 'alcalinas', 'recargables', 'nimh', 'baterias secas'],
        en: ['batteries', 'aa', 'aaa', 'alkaline', 'rechargeable', 'nimh', 'dry cells']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidas en cabina y bodega. Protege los bornes de las pilas sueltas.',
        en: 'Allowed in cabin and checked baggage. Protect the terminals of loose batteries.'
      },
      detalle: {
        es: [
          'Incluye baterías secas y de níquel-hidruro metálico que cumplen las Disposiciones especiales A123 o A199.',
          'Las baterías de litio tienen reglas propias: búscalas por separado.'
        ],
        en: [
          'Includes dry batteries and nickel-metal hydride batteries meeting Special Provisions A123 or A199.',
          'Lithium batteries have their own rules: search for them separately.'
        ]
      },
      fuente: ref('2', 'b)', 'b)', false)
    },
    {
      id: 'baterias-inderramables',
      categoria: 'electronica',
      icono: '🔋',
      origen: 'tabla81',
      nombre: { es: 'Baterías inderramables de electrolito líquido (tipo gel o AGM)', en: 'Non-spillable wet batteries (gel or AGM type)' },
      claves: {
        es: ['bateria de gel', 'agm', 'acumulador', 'bateria inderramable', 'bateria sellada'],
        en: ['gel battery', 'agm', 'accumulator', 'non-spillable battery', 'sealed battery']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Máximo 12 V y 100 Wh cada una; hasta 2 de repuesto por persona.',
        en: 'Maximum 12 V and 100 Wh each; up to 2 spares per person.'
      },
      detalle: {
        es: [
          'Deben cumplir la Disposición especial A67.',
          'Cada acumulador debe protegerse contra cortocircuitos, aislando los bornes expuestos.',
          'Si van instaladas en un equipo, protégelo contra activación accidental o desconecta la batería y aísla sus bornes.'
        ],
        en: [
          'They must meet Special Provision A67.',
          'Each battery must be protected from short circuit by insulating exposed terminals.',
          'If installed in equipment, protect it from accidental activation or disconnect the battery and insulate its terminals.'
        ]
      },
      fuente: ref('2', 'a)', 'a)', false)
    },
    {
      id: 'pila-combustible',
      categoria: 'electronica',
      icono: '⚗️',
      origen: 'tabla81',
      nombre: { es: 'Cargador de pila de combustible y cartuchos de repuesto', en: 'Fuel cell charger and spare cartridges' },
      claves: {
        es: ['pila de combustible', 'cartucho de combustible', 'cargador de hidrogeno', 'fuel cell'],
        en: ['fuel cell', 'fuel cell cartridge', 'hydrogen charger']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'La pila con combustible, solo en cabina. Máximo 2 cartuchos de repuesto por pasajero.',
        en: 'A fuel cell containing fuel, cabin only. No more than 2 spare cartridges per passenger.'
      },
      detalle: {
        es: [
          'Cantidad máxima por pila o cartucho: 200 ml (líquidos), 200 g (sólidos) o 120 ml de gas licuado (200 ml si son metálicos).',
          'No se permite rellenarlas a bordo, salvo la instalación de un cartucho de repuesto.',
          'Deben cumplir la norma CEI 62282-6-100 y llevar la marca "APROBADO PARA SU TRANSPORTE EN LA CABINA DE LA AERONAVE ÚNICAMENTE".',
          'Los cartuchos de repuesto pueden ir en cabina o en bodega.'
        ],
        en: [
          'Maximum per fuel cell or cartridge: 200 ml (liquids), 200 g (solids) or 120 ml of liquefied gas (200 ml if metallic).',
          'Refilling on board is not permitted, except to install a spare cartridge.',
          'They must meet standard IEC 62282-6-100 and bear the marking "APPROVED FOR CARRIAGE IN AIRCRAFT CABIN ONLY".',
          'Spare cartridges may travel in the cabin or in checked baggage.'
        ]
      },
      fuente: ref('8', '', '', false)
    },
    {
      id: 'bateria-mas-160',
      categoria: 'electronica',
      icono: '⚡',
      origen: 'tabla81',
      nombre: { es: 'Batería de litio de más de 160 Wh (estación de energía, scooter o bicicleta eléctrica)', en: 'Lithium battery over 160 Wh (power station, e-scooter or e-bike)' },
      claves: {
        es: ['estacion de energia', 'power station', 'bateria scooter', 'bateria bicicleta electrica', 'bateria grande', 'mas de 160 wh'],
        en: ['power station', 'e-scooter battery', 'e-bike battery', 'large battery', 'over 160 wh']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'No puede viajar como equipaje de pasajero.',
        en: 'It cannot travel as passenger baggage.'
      },
      detalle: {
        es: [
          'La Tabla 8-1 solo autoriza baterías de ion litio de hasta 160 Wh (sobre 100 Wh, con aprobación de la aerolínea).',
          'Excepción: las baterías de sillas de ruedas y ayudas motrices tienen reglas propias.',
          'Para enviarla debe usarse carga aérea conforme a la reglamentación de mercancías peligrosas.'
        ],
        en: [
          'Table 8-1 only allows lithium ion batteries up to 160 Wh (above 100 Wh, with airline approval).',
          'Exception: wheelchair and mobility aid batteries have their own rules.',
          'To ship it, air cargo must be used under the dangerous goods regulations.'
        ]
      },
      fuente: ref('1', 'b) y c)', 'b) and c)', true)
    },

    /* ===================== LÍQUIDOS Y GELES ===================== */
    {
      id: 'liquidos-100ml',
      categoria: 'liquidos',
      icono: '💧',
      origen: 'avsec',
      nombre: { es: 'Líquidos, geles y cremas (agua, shampoo, cremas, pasta dental)', en: 'Liquids, gels and creams (water, shampoo, lotions, toothpaste)' },
      claves: {
        es: ['liquido', 'liquidos', 'gel', 'crema', 'shampoo', 'agua', 'jugo', 'pasta de dientes', 'maquillaje', 'bloqueador', '100 ml', 'estados unidos'],
        en: ['liquid', 'liquids', 'gel', 'cream', 'lotion', 'shampoo', 'water', 'juice', 'toothpaste', 'makeup', 'sunscreen', '100 ml', 'united states', 'usa']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos en cabina y bodega. En vuelos a Estados Unidos, en cabina solo envases de hasta 100 ml.',
        en: 'Allowed in the cabin and in checked baggage. On flights to the United States, cabin containers of up to 100 ml only.'
      },
      detalle: {
        es: [
          'En vuelos con destino a Estados Unidos, los líquidos en cabina deben ir en envases de hasta 100 ml, todos dentro de una bolsa transparente de 1 litro.',
          'En esos vuelos se exceptúan los medicamentos y alimentos para bebés en la cantidad necesaria para el viaje.',
          'Los productos inflamables, los aerosoles y las bebidas alcohólicas tienen reglas propias: búscalos por separado.'
        ],
        en: [
          'On flights to the United States, cabin liquids must be in containers of up to 100 ml, all inside one transparent 1-litre bag.',
          'On those flights, medicines and baby food in the quantity needed for the trip are exempt.',
          'Flammable products, aerosols and alcoholic beverages have their own rules: search for them separately.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'articulos-tocador',
      categoria: 'liquidos',
      icono: '🧴',
      origen: 'tabla81',
      nombre: { es: 'Artículos de tocador y aerosoles (perfume, desodorante, laca, espuma de afeitar)', en: 'Toiletries and aerosols (perfume, deodorant, hairspray, shaving foam)' },
      claves: {
        es: ['aerosol', 'spray', 'perfume', 'colonia', 'desodorante', 'laca', 'espuma de afeitar', 'fijador', 'tocador'],
        en: ['aerosol', 'spray', 'perfume', 'cologne', 'deodorant', 'hairspray', 'shaving foam', 'toiletries']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Cada envase hasta 0,5 kg o 0,5 L; en total 2 kg o 2 L por persona.',
        en: 'Each item up to 0.5 kg or 0.5 L; 2 kg or 2 L in total per person.'
      },
      detalle: {
        es: [
          'Incluye artículos medicinales y de tocador (también en aerosol) y aerosoles de la División 2.2 sin peligro secundario.',
          'Las válvulas de los aerosoles deben ir protegidas con una tapa u otro medio que impida la liberación del contenido.',
          'Los aerosoles inflamables que no sean de tocador ni medicinales (pintura en spray, insecticida, lubricante) no están autorizados.',
          'En vuelos a Estados Unidos, en cabina aplica además el límite de 100 ml por envase.'
        ],
        en: [
          'Includes medicinal and toilet articles (including aerosols) and Division 2.2 aerosols with no subsidiary hazard.',
          'Aerosol release valves must be protected by a cap or other means to prevent release of the contents.',
          'Flammable aerosols that are not toiletries or medicines (spray paint, insecticide, lubricant) are not permitted.',
          'On flights to the United States, the 100 ml per container cabin limit also applies.'
        ]
      },
      fuente: ref('17', '', '', false)
    },
    {
      id: 'alcohol-24-70',
      categoria: 'liquidos',
      icono: '🍾',
      origen: 'tabla81',
      nombre: { es: 'Bebidas alcohólicas de más de 24% y menos de 70% (pisco, whisky, ron)', en: 'Alcoholic beverages over 24% and under 70% (pisco, whisky, rum)' },
      claves: {
        es: ['alcohol', 'licor', 'pisco', 'whisky', 'ron', 'vodka', 'tequila', 'gin', 'destilado', 'botella'],
        en: ['alcohol', 'liquor', 'spirits', 'pisco', 'whisky', 'rum', 'vodka', 'tequila', 'gin', 'bottle']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Máximo 5 litros por persona, en envases de venta al detalle.',
        en: 'Maximum 5 litres per person, in retail packaging.'
      },
      detalle: {
        es: [
          'Deben ir en embalajes de venta al detalle (envase comercial).',
          'Cantidad neta total: no más de 5 L por persona.',
          'En vuelos a Estados Unidos, en cabina solo se permiten envases de hasta 100 ml o compras en tiendas libres de impuestos en bolsa sellada.'
        ],
        en: [
          'They must be in retail packaging.',
          'Total net quantity: no more than 5 L per person.',
          'On flights to the United States, only containers of up to 100 ml or duty-free purchases in a sealed bag are allowed in the cabin.'
        ]
      },
      fuente: ref('6', '', '', false)
    },
    {
      id: 'alcohol-menos-24',
      categoria: 'liquidos',
      icono: '🍷',
      origen: 'tabla81',
      nombre: { es: 'Vino, cerveza y bebidas con menos de 24% de alcohol', en: 'Wine, beer and beverages under 24% alcohol' },
      claves: {
        es: ['vino', 'cerveza', 'chicha', 'espumante', 'sidra', 'alcohol'],
        en: ['wine', 'beer', 'sparkling wine', 'cider', 'alcohol']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Sin restricción como mercancía peligrosa.',
        en: 'Not restricted as dangerous goods.'
      },
      detalle: {
        es: [
          'La Tabla 8-1 indica que las bebidas con menos de 24% de alcohol no están sujetas a ninguna restricción.',
          'En vuelos a Estados Unidos, en cabina solo envases de hasta 100 ml.',
          'Revisa las franquicias de aduana del país de destino.'
        ],
        en: [
          'Table 8-1 states that beverages under 24% alcohol are not subject to any restriction.',
          'On flights to the United States, cabin containers of up to 100 ml only.',
          'Check the customs allowances of your destination country.'
        ]
      },
      fuente: ref('6', '(nota)', '(note)', false)
    },
    {
      id: 'alcohol-mas-70',
      categoria: 'liquidos',
      icono: '🚫',
      origen: 'no_listado',
      nombre: { es: 'Bebidas alcohólicas de 70% o más (alcohol de 96°, licores de muy alta graduación)', en: 'Alcoholic beverages of 70% or more (96% alcohol, very high-proof spirits)' },
      claves: {
        es: ['alcohol puro', 'alcohol 96', 'alcohol etilico', 'licor fuerte', 'absenta'],
        en: ['pure alcohol', 'rectified spirit', 'ethanol', 'high proof', 'absinthe']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'No puede viajar en ningún equipaje.',
        en: 'It cannot travel in any baggage.'
      },
      detalle: {
        es: [
          'La Tabla 8-1 solo autoriza bebidas alcohólicas de más de 24% y menos de 70% de alcohol.',
          'Revisa la etiqueta antes de empacar.'
        ],
        en: [
          'Table 8-1 only allows alcoholic beverages over 24% and under 70% alcohol.',
          'Check the label before packing.'
        ]
      },
      fuente: REF_NO_LISTADO
    },

    /* ===================== CORTOPUNZANTES ===================== */
    {
      id: 'cuchillos',
      categoria: 'cortopunzantes',
      icono: '🔪',
      origen: 'avsec',
      nombre: { es: 'Cuchillos, navajas y cortaplumas', en: 'Knives, blades and pocket knives' },
      claves: {
        es: ['cuchillo', 'navaja', 'cortaplumas', 'machete', 'multiherramienta', 'cuchillo cocina', 'cortopunzante', 'hoja'],
        en: ['knife', 'blade', 'pocket knife', 'penknife', 'machete', 'multitool', 'sharp object']
      },
      mano: 'restringido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'En cabina solo con hojas de hasta 4 cm. Si la hoja supera los 4 cm, va en bodega y bien envuelta.',
        en: 'In the cabin only with blades up to 4 cm. Blades over 4 cm go in checked baggage, well wrapped.'
      },
      detalle: {
        es: [
          'Se prohíben en cabina los objetos cortopunzantes con hojas de longitud superior a 4 cm.',
          'En bodega, envuélvelos para que no hieran a quien revise el equipaje.',
          'La decisión final en el control la toma el personal de seguridad.'
        ],
        en: [
          'Sharp objects with blades longer than 4 cm are forbidden in the cabin.',
          'In checked baggage, wrap them so they cannot injure baggage screeners.',
          'The final decision at screening rests with security staff.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'cortacartones',
      categoria: 'cortopunzantes',
      icono: '🪒',
      origen: 'avsec',
      nombre: { es: 'Cortacartones, hojas de afeitar sueltas y bisturís', en: 'Box cutters, loose razor blades and scalpels' },
      claves: {
        es: ['cortacartones', 'cuchillo cartonero', 'hoja de afeitar', 'gillette', 'bisturi', 'cutter'],
        en: ['box cutter', 'utility knife', 'razor blade', 'scalpel', 'cutter']
      },
      mano: 'prohibido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Nunca en cabina. En bodega, con las hojas protegidas.',
        en: 'Never in the cabin. In checked baggage, with blades protected.'
      },
      detalle: {
        es: ['Las máquinas de afeitar con cartucho o desechables suelen aceptarse en cabina.'],
        en: ['Cartridge or disposable razors are usually accepted in the cabin.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'tijeras',
      categoria: 'cortopunzantes',
      icono: '✂️',
      origen: 'avsec',
      nombre: { es: 'Tijeras', en: 'Scissors' },
      claves: {
        es: ['tijeras', 'tijera de uñas', 'tijera escolar'],
        en: ['scissors', 'nail scissors']
      },
      mano: 'restringido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'En cabina solo con hojas de hasta 4 cm. Las más grandes, en bodega.',
        en: 'In the cabin only with blades up to 4 cm. Larger ones in checked baggage.'
      },
      detalle: {
        es: ['La hoja se mide desde el punto de unión (eje) hasta la punta.'],
        en: ['The blade is measured from the pivot point to the tip.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'herramientas',
      categoria: 'cortopunzantes',
      icono: '🔧',
      origen: 'avsec',
      nombre: { es: 'Herramientas (brocas, alicates de punta, martillos, llaves inglesas, destornilladores)', en: 'Tools (drill bits, needle-nose pliers, hammers, adjustable wrenches, screwdrivers)' },
      claves: {
        es: ['herramienta', 'broca', 'alicate', 'alicate de punta', 'martillo', 'llave inglesa', 'llave', 'destornillador', 'destornillador de precision', 'taladro'],
        en: ['tool', 'drill bit', 'pliers', 'needle-nose pliers', 'hammer', 'adjustable wrench', 'wrench', 'spanner', 'screwdriver', 'precision screwdriver', 'drill']
      },
      mano: 'prohibido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Prohibidas en cabina: van en bodega. Se exceptúan los destornilladores de precisión de menor tamaño.',
        en: 'Forbidden in the cabin: pack them in checked baggage. Small precision screwdrivers are excepted.'
      },
      detalle: {
        es: [
          'Prohibidos en cabina: brocas, alicates con punta, martillos, llaves inglesas y destornilladores.',
          'Excepción: los destornilladores de precisión de menor tamaño pueden ir en cabina.',
          'La decisión final la toma el personal de seguridad en el control.',
          'Si la herramienta es a batería, la batería de repuesto va en cabina y protegida contra cortocircuitos.'
        ],
        en: [
          'Forbidden in the cabin: drill bits, needle-nose pliers, hammers, adjustable wrenches and screwdrivers.',
          'Exception: small precision screwdrivers may be carried in the cabin.',
          'The final decision rests with security staff at screening.',
          'If the tool is battery-powered, the spare battery goes in the cabin, protected from short circuit.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'palillos-tejer',
      categoria: 'cortopunzantes',
      icono: '🧶',
      origen: 'avsec',
      nombre: { es: 'Palillos para tejer', en: 'Knitting needles' },
      claves: {
        es: ['palillos', 'palillos para tejer', 'agujas de tejer', 'crochet', 'tejido', 'lana'],
        en: ['knitting needles', 'needles', 'crochet', 'knitting', 'yarn']
      },
      mano: 'restringido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'En cabina solo de hasta 15 cm. Los más largos, en bodega.',
        en: 'In the cabin only up to 15 cm. Longer ones in checked baggage.'
      },
      detalle: {
        es: ['Se prohíben en cabina los palillos para tejer que superen los 15 cm de largo.'],
        en: ['Knitting needles longer than 15 cm are forbidden in the cabin.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'pie-de-metro',
      categoria: 'cortopunzantes',
      icono: '📏',
      origen: 'avsec',
      nombre: { es: 'Pie de metro (calibrador)', en: 'Vernier caliper' },
      claves: {
        es: ['pie de metro', 'calibrador', 'vernier', 'pie de rey', 'instrumento de medicion'],
        en: ['caliper', 'vernier caliper', 'measuring tool']
      },
      mano: 'restringido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'En cabina solo de hasta 20 cm. Los más largos, en bodega.',
        en: 'In the cabin only up to 20 cm. Longer ones in checked baggage.'
      },
      detalle: {
        es: ['Se prohíbe en cabina el pie de metro de longitud superior a 20 cm.'],
        en: ['Calipers longer than 20 cm are forbidden in the cabin.']
      },
      fuente: REF_AVSEC
    },

    /* ===================== ARMAS Y MUNICIONES ===================== */
    {
      id: 'municiones',
      categoria: 'armas',
      icono: '🎯',
      origen: 'tabla81',
      nombre: { es: 'Municiones (cartuchos para armas, División 1.4S)', en: 'Ammunition (cartridges for weapons, Division 1.4S)' },
      claves: {
        es: ['municion', 'municiones', 'balas', 'cartuchos', 'caza', 'tiro deportivo'],
        en: ['ammunition', 'ammo', 'bullets', 'cartridges', 'hunting', 'sport shooting']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Solo en bodega, bien embaladas, máximo 5 kg por persona, con aprobación de la aerolínea y la documentación necesaria para su traslado.',
        en: 'Checked baggage only, securely packed, maximum 5 kg per person, with airline approval and the documentation required for transport.'
      },
      detalle: {
        es: [
          'Debes contar con la documentación necesaria para su traslado.',
          'Solo cartuchos ONU 0012 u ONU 0014 (División 1.4S).',
          'Máximo 5 kg de masa bruta por persona.',
          'No se permiten municiones con proyectiles explosivos o incendiarios.',
          'Las cantidades de varias personas no pueden combinarse en uno o más bultos.'
        ],
        en: [
          'You must have the documentation required for their transport.',
          'Only cartridges UN 0012 or UN 0014 (Division 1.4S).',
          'Maximum 5 kg gross mass per person.',
          'Ammunition with explosive or incendiary projectiles is not allowed.',
          'Allowances for more than one person must not be combined into one or more packages.'
        ]
      },
      fuente: ref('19', '', '', false)
    },
    {
      id: 'armas-fuego',
      categoria: 'armas',
      icono: 'svg:arma-fuego',
      origen: 'avsec',
      nombre: { es: 'Armas de fuego', en: 'Firearms' },
      claves: {
        es: ['arma', 'arma de fuego', 'pistola', 'revolver', 'escopeta', 'rifle'],
        en: ['weapon', 'firearm', 'gun', 'pistol', 'revolver', 'shotgun', 'rifle']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Nunca en cabina. En bodega, solo con autorización y el procedimiento de la aerolínea y la autoridad competente.',
        en: 'Never in the cabin. In checked baggage only with authorisation and following the airline and competent authority procedure.'
      },
      detalle: {
        es: [
          'Deben ir descargadas y en un contenedor adecuado, según las condiciones de la aerolínea.',
          'Las municiones tienen reglas propias.',
          'Consulta con anticipación los requisitos legales para portar y trasladar armas.'
        ],
        en: [
          'They must be unloaded and in a suitable container, as required by the airline.',
          'Ammunition has its own rules.',
          'Check the legal requirements for carrying and transporting weapons well in advance.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'gas-pimienta',
      categoria: 'armas',
      icono: 'svg:spray-defensa',
      origen: 'no_listado',
      nombre: { es: 'Gas pimienta y sprays de defensa personal', en: 'Pepper spray and self-defence sprays' },
      claves: {
        es: ['gas pimienta', 'spray de defensa', 'gas lacrimogeno', 'defensa personal', 'aerosol irritante'],
        en: ['pepper spray', 'mace', 'self-defence spray', 'tear gas', 'irritant spray']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'No puede viajar en ningún equipaje.',
        en: 'It cannot travel in any baggage.'
      },
      detalle: {
        es: ['Los dispositivos con sustancias irritantes o incapacitantes no figuran en la Tabla 8-1.'],
        en: ['Devices containing irritant or incapacitating substances are not listed in Table 8-1.']
      },
      fuente: REF_NO_LISTADO
    },

    /* ===================== INFLAMABLES Y QUÍMICOS ===================== */
    {
      id: 'encendedor-fosforos',
      categoria: 'inflamables',
      icono: '🔥',
      origen: 'tabla81',
      nombre: { es: 'Encendedor de cigarrillos o paquete pequeño de fósforos de seguridad', en: 'Cigarette lighter or small packet of safety matches' },
      claves: {
        es: ['encendedor', 'fosforos', 'cerillos', 'yesquero', 'mechero', 'fumar'],
        en: ['lighter', 'matches', 'safety matches', 'smoking']
      },
      mano: 'restringido',
      bodega: 'prohibido',
      aprobacion: false,
      limite: {
        es: 'Solo uno por persona y llevado sobre ti (bolsillo), no en el bolso ni en la maleta.',
        en: 'Only one per person, carried on your person (pocket), not in a bag or suitcase.'
      },
      detalle: {
        es: [
          'No más de uno por persona: un encendedor o un paquete pequeño de fósforos de seguridad.',
          'No debe contener combustible líquido no absorbido (que no sea gas licuado).',
          'Prohibido en equipaje facturado.',
          'Si funciona con batería de litio, esta debe cumplir las reglas de baterías y no puede recargarse a bordo.'
        ],
        en: [
          'No more than one per person: one lighter or one small packet of safety matches.',
          'It must not contain unabsorbed liquid fuel (other than liquefied gas).',
          'Forbidden in checked baggage.',
          'If it runs on a lithium battery, the battery must meet the battery rules and must not be recharged on board.'
        ]
      },
      fuente: ref('5', '', '', false)
    },
    {
      id: 'plancha-gas',
      categoria: 'inflamables',
      icono: '💇',
      origen: 'tabla81',
      nombre: { es: 'Rizador o plancha de pelo a gas (butano)', en: 'Gas-powered hair curler or straightener (butane)' },
      claves: {
        es: ['plancha de pelo', 'rizador', 'alisador', 'butano', 'gas'],
        en: ['hair straightener', 'curling iron', 'hair curler', 'butane', 'gas']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Uno por persona, con la cubierta de seguridad puesta. Sin cartuchos de repuesto.',
        en: 'One per person, with the safety cover fitted. No spare cartridges.'
      },
      detalle: {
        es: [
          'La cubierta de seguridad debe cubrir el elemento calefactor.',
          'Las planchas y rizadores eléctricos comunes no tienen esta restricción.'
        ],
        en: [
          'The safety cover must be fitted over the heating element.',
          'Regular electric straighteners and curlers are not subject to this restriction.'
        ]
      },
      fuente: ref('11', '', '', false)
    },
    {
      id: 'motores-combustion',
      categoria: 'inflamables',
      icono: '⚙️',
      origen: 'tabla81',
      nombre: { es: 'Motores de combustión interna (desmalezadora, motor fuera de borda)', en: 'Internal combustion engines (brush cutter, outboard motor)' },
      claves: {
        es: ['motor', 'motor a combustion', 'desmalezadora', 'motor fuera de borda', 'motosierra', 'generador'],
        en: ['engine', 'combustion engine', 'brush cutter', 'outboard motor', 'chainsaw', 'generator']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Solo en bodega y sin riesgo: sin combustible y limpios.',
        en: 'Checked baggage only and made safe: no fuel and cleaned.'
      },
      detalle: {
        es: ['Deben tomarse medidas para anular el peligro, según la Disposición especial A70.'],
        en: ['Measures must be taken to neutralise the hazard, as per Special Provision A70.']
      },
      fuente: ref('7', '', '', false)
    },
    {
      id: 'gas-camping',
      categoria: 'inflamables',
      icono: '⛺',
      origen: 'no_listado',
      nombre: { es: 'Gas de camping, bencina blanca y combustibles para cocinillas', en: 'Camping gas, white gas and stove fuels' },
      claves: {
        es: ['gas', 'camping', 'cocinilla', 'cartucho de gas', 'bencina', 'parafina', 'combustible', 'trekking'],
        en: ['gas', 'camping', 'stove', 'gas canister', 'white gas', 'kerosene', 'fuel', 'trekking']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'Ningún combustible ni cartucho de gas puede viajar.',
        en: 'No fuel or gas canister may travel.'
      },
      detalle: {
        es: ['Compra el combustible en tu destino.'],
        en: ['Buy fuel at your destination.']
      },
      fuente: REF_NO_LISTADO
    },
    {
      id: 'liquidos-inflamables',
      categoria: 'inflamables',
      icono: '🛢️',
      origen: 'no_listado',
      nombre: { es: 'Pinturas, diluyentes, bencina y otros líquidos inflamables', en: 'Paints, thinners, petrol and other flammable liquids' },
      claves: {
        es: ['pintura', 'diluyente', 'solvente', 'aguarras', 'bencina', 'gasolina', 'acetona', 'inflamable'],
        en: ['paint', 'thinner', 'solvent', 'turpentine', 'petrol', 'gasoline', 'acetone', 'flammable']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'No pueden viajar en ningún equipaje.',
        en: 'They cannot travel in any baggage.'
      },
      detalle: {
        es: ['Los líquidos inflamables no figuran en la Tabla 8-1, salvo los casos específicos que esta autoriza (por ejemplo, artículos de tocador o bebidas alcohólicas).'],
        en: ['Flammable liquids are not listed in Table 8-1, except for the specific cases it allows (for example, toiletries or alcoholic beverages).']
      },
      fuente: REF_NO_LISTADO
    },
    {
      id: 'fuegos-artificiales',
      categoria: 'inflamables',
      icono: '🎆',
      origen: 'no_listado',
      nombre: { es: 'Fuegos artificiales, bengalas y petardos', en: 'Fireworks, flares and firecrackers' },
      claves: {
        es: ['fuegos artificiales', 'bengala', 'petardo', 'pirotecnia', 'volador', 'chispitas'],
        en: ['fireworks', 'flare', 'firecracker', 'pyrotechnics', 'sparklers']
      },
      mano: 'prohibido',
      bodega: 'prohibido',
      aprobacion: null,
      limite: {
        es: 'No pueden viajar en ningún equipaje.',
        en: 'They cannot travel in any baggage.'
      },
      detalle: {
        es: ['Incluye cualquier artículo pirotécnico, aunque sea pequeño o de juguete.'],
        en: ['Includes any pyrotechnic article, even if small or a toy.']
      },
      fuente: REF_NO_LISTADO
    },

    /* ===================== SALUD Y MEDICAMENTOS ===================== */
    {
      id: 'medicamentos',
      categoria: 'salud',
      icono: '💊',
      origen: 'avsec',
      nombre: { es: 'Medicamentos', en: 'Medicines' },
      claves: {
        es: ['medicamento', 'remedio', 'pastillas', 'jarabe', 'insulina', 'inhalador', 'receta'],
        en: ['medicine', 'medication', 'pills', 'syrup', 'insulin', 'inhaler', 'prescription']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos en cabina y bodega. Lleva los de uso diario contigo.',
        en: 'Allowed in the cabin and in checked baggage. Keep daily-use medicines with you.'
      },
      detalle: {
        es: [
          'Si es posible, lleva la receta o un respaldo médico.',
          'Los medicamentos en aerosol siguen el límite de 0,5 kg o 0,5 L por envase y 2 kg o 2 L en total (Tabla 8-1, ítem 17).',
          'En vuelos a Estados Unidos, los medicamentos líquidos pueden superar los 100 ml en la cantidad necesaria para el viaje; pueden pedirte presentarlos por separado.'
        ],
        en: [
          'If possible, carry the prescription or a medical note.',
          'Medicinal aerosols follow the limit of 0.5 kg or 0.5 L per item and 2 kg or 2 L in total (Table 8-1, item 17).',
          'On flights to the United States, liquid medicines may exceed 100 ml in the quantity needed for the trip; you may be asked to present them separately.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'aparato-medico-litio',
      categoria: 'salud',
      icono: '🩺',
      origen: 'tabla81',
      nombre: { es: 'Aparato médico portátil con batería de metal litio (más de 2 g y hasta 8 g)', en: 'Portable medical device with lithium metal battery (over 2 g and up to 8 g)' },
      claves: {
        es: ['aparato medico', 'equipo medico', 'bateria metal litio', 'desfibrilador', 'dispositivo medico'],
        en: ['medical device', 'medical equipment', 'lithium metal battery', 'defibrillator']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Requiere aprobación de la aerolínea. Baterías de repuesto: solo en cabina y máximo 2 por persona.',
        en: 'Requires airline approval. Spare batteries: cabin only and no more than 2 per person.'
      },
      detalle: {
        es: [
          'Aplica a baterías de más de 2 g y hasta 8 g de metal litio, solo para aparatos electrónicos portátiles de uso médico.',
          'Las baterías de repuesto deben ir protegidas contra cortocircuitos.',
          'Coordina con la aerolínea antes del vuelo.'
        ],
        en: [
          'Applies to batteries over 2 g and up to 8 g of lithium metal, only for portable medical electronic devices.',
          'Spare batteries must be protected from short circuit.',
          'Coordinate with the airline before the flight.'
        ]
      },
      fuente: ref('1', 'd) y e)', 'd) and e)', true)
    },
    {
      id: 'oxigeno-medico',
      categoria: 'salud',
      icono: '🫁',
      origen: 'tabla81',
      nombre: { es: 'Cilindros de oxígeno o de aire de uso médico', en: 'Medical oxygen or air cylinders' },
      claves: {
        es: ['oxigeno', 'balon de oxigeno', 'cilindro', 'aire medico', 'respirar'],
        en: ['oxygen', 'oxygen cylinder', 'oxygen tank', 'medical air', 'breathing']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Con aprobación de la aerolínea. Máximo 5 kg de masa bruta por cilindro.',
        en: 'With airline approval. Maximum 5 kg gross mass per cylinder.'
      },
      detalle: {
        es: [
          'Cilindros, válvulas y reguladores deben ir protegidos contra la liberación involuntaria del contenido.',
          'Se recomienda coordinar con la aerolínea con anticipación.',
          'Se debe informar al piloto al mando la cantidad de cilindros y su ubicación a bordo.'
        ],
        en: [
          'Cylinders, valves and regulators must be protected against inadvertent release of the contents.',
          'Advance arrangements with the airline are recommended.',
          'The pilot-in-command must be informed of the number of cylinders and their location on board.'
        ]
      },
      fuente: ref('9', '', '', false)
    },
    {
      id: 'ayuda-motriz',
      categoria: 'salud',
      icono: '♿',
      origen: 'tabla81',
      nombre: { es: 'Silla de ruedas u otra ayuda motriz con batería', en: 'Battery-powered wheelchair or mobility aid' },
      claves: {
        es: ['silla de ruedas', 'silla electrica', 'scooter de movilidad', 'ayuda motriz', 'movilidad reducida'],
        en: ['wheelchair', 'power wheelchair', 'mobility scooter', 'mobility aid', 'reduced mobility']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Coordina con anticipación con la aerolínea. Batería de ion litio extraída: máximo 300 Wh y en cabina.',
        en: 'Arrange in advance with the airline. Removed lithium ion battery: maximum 300 Wh and in the cabin.'
      },
      detalle: {
        es: [
          'Para pasajeros con movilidad reducida por discapacidad, estado de salud, edad o un problema temporal (por ejemplo, una pierna fracturada).',
          'Informa a la aerolínea el tipo de batería y cómo manipular la ayuda motriz, con las instrucciones para aislar la batería.',
          'Si la ayuda motriz no protege adecuadamente la batería de ion litio: extráela según el fabricante, protege sus bornes y llévala en cabina (máximo 300 Wh).',
          'Repuestos de ion litio: 1 de hasta 300 Wh o 2 de hasta 160 Wh cada una, en cabina.',
          'Si la batería de litio permanece instalada en la ayuda motriz, no hay límite de Wh.',
          'Baterías inderramables: máximo 1 de repuesto por pasajero.'
        ],
        en: [
          'For passengers with reduced mobility due to disability, health, age or a temporary problem (for example, a broken leg).',
          'Inform the airline of the battery type and how to handle the mobility aid, including instructions to isolate the battery.',
          'If the mobility aid does not adequately protect the lithium ion battery: remove it per the manufacturer, protect its terminals and carry it in the cabin (maximum 300 Wh).',
          'Lithium ion spares: 1 of up to 300 Wh or 2 of up to 160 Wh each, in the cabin.',
          'If the lithium battery remains installed in the mobility aid, there is no Wh limit.',
          'Non-spillable batteries: maximum 1 spare per passenger.'
        ]
      },
      fuente: ref('4', '', '', false)
    },
    {
      id: 'marcapasos',
      categoria: 'salud',
      icono: '❤️',
      origen: 'tabla81',
      nombre: { es: 'Marcapasos y otros dispositivos médicos con radioisótopos', en: 'Pacemakers and other medical devices containing radioisotopes' },
      claves: {
        es: ['marcapasos', 'implante', 'radioisotopo', 'dispositivo implantado'],
        en: ['pacemaker', 'implant', 'radioisotope', 'implanted device']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos cuando están implantados o son consecuencia de un tratamiento médico.',
        en: 'Allowed when implanted or as a result of medical treatment.'
      },
      detalle: {
        es: ['La Tabla 8-1 no los asocia a un tipo de equipaje: aplican a la persona que los lleva.'],
        en: ['Table 8-1 does not assign them to a baggage type: they apply to the person carrying them.']
      },
      fuente: ref('15', '', '', false)
    },
    {
      id: 'protesis-cartuchos',
      categoria: 'salud',
      icono: '🦿',
      origen: 'tabla81',
      nombre: { es: 'Prótesis (extremidades mecánicas) con cartuchos de gas', en: 'Prosthetics (mechanical limbs) with gas cartridges' },
      claves: {
        es: ['protesis', 'extremidad mecanica', 'pierna ortopedica', 'cartucho de gas'],
        en: ['prosthesis', 'prosthetic', 'mechanical limb', 'gas cartridge']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidas, incluidos cartuchos de repuesto de tamaño similar si son necesarios para todo el viaje.',
        en: 'Allowed, including spare cartridges of similar size if needed for the whole journey.'
      },
      detalle: {
        es: ['Aplica a cartuchos de la División 2.2 para activar extremidades mecánicas.'],
        en: ['Applies to Division 2.2 cartridges for operating mechanical limbs.']
      },
      fuente: ref('10', '', '', false)
    },
    {
      id: 'termometro-mercurio',
      categoria: 'salud',
      icono: '🌡️',
      origen: 'tabla81',
      nombre: { es: 'Termómetro médico o clínico con mercurio', en: 'Medical or clinical mercury thermometer' },
      claves: {
        es: ['termometro', 'mercurio', 'fiebre', 'clinico'],
        en: ['thermometer', 'mercury', 'fever', 'clinical']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Solo en bodega: uno por persona y en su estuche protector.',
        en: 'Checked baggage only: one per person and in its protective case.'
      },
      detalle: {
        es: ['Los termómetros digitales no tienen esta restricción.'],
        en: ['Digital thermometers are not subject to this restriction.']
      },
      fuente: ref('16', '', '', false)
    },

    /* ===================== ALIMENTOS ===================== */
    {
      id: 'alimentos-solidos',
      categoria: 'alimentos',
      icono: '🥪',
      origen: 'avsec',
      nombre: { es: 'Alimentos sólidos (sándwich, galletas, fruta)', en: 'Solid food (sandwich, biscuits, fruit)' },
      claves: {
        es: ['comida', 'alimento', 'sandwich', 'galletas', 'fruta', 'snack', 'colacion'],
        en: ['food', 'sandwich', 'biscuits', 'cookies', 'fruit', 'snack']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos en cabina y en bodega.',
        en: 'Allowed in the cabin and in checked baggage.'
      },
      detalle: {
        es: [
          'Al llegar a Chile debes declarar los productos de origen animal o vegetal ante el SAG.',
          'Otros países también controlan el ingreso de alimentos: revisa las reglas de tu destino.'
        ],
        en: [
          'When arriving in Chile you must declare animal and plant products to the SAG (Agricultural and Livestock Service).',
          'Other countries also control food imports: check the rules of your destination.'
        ]
      },
      fuente: REF_AVSEC
    },
    {
      id: 'alimentos-cremosos',
      categoria: 'alimentos',
      icono: '🍯',
      origen: 'avsec',
      nombre: { es: 'Alimentos líquidos o cremosos (mermelada, manjar, yogur, salsas)', en: 'Liquid or creamy food (jam, dulce de leche, yoghurt, sauces)' },
      claves: {
        es: ['mermelada', 'manjar', 'yogur', 'salsa', 'miel', 'sopa', 'conserva'],
        en: ['jam', 'dulce de leche', 'yoghurt', 'yogurt', 'sauce', 'honey', 'soup', 'preserves']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos en cabina y bodega. En vuelos a Estados Unidos, en cabina solo envases de hasta 100 ml.',
        en: 'Allowed in the cabin and in checked baggage. On flights to the United States, cabin containers of up to 100 ml only.'
      },
      detalle: {
        es: ['En vuelos a Estados Unidos se consideran líquidos y deben ir en la bolsa transparente de 1 litro.'],
        en: ['On flights to the United States they count as liquids and must go in the transparent 1-litre bag.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'alimentos-bebe',
      categoria: 'alimentos',
      icono: '🍼',
      origen: 'avsec',
      nombre: { es: 'Leche y alimentos para bebés', en: 'Baby milk and baby food' },
      claves: {
        es: ['leche', 'mamadera', 'papilla', 'bebe', 'formula', 'compota'],
        en: ['milk', 'baby bottle', 'baby food', 'formula', 'infant']
      },
      mano: 'permitido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Permitidos en cabina y bodega, en la cantidad necesaria para el viaje.',
        en: 'Allowed in the cabin and in checked baggage, in the quantity needed for the trip.'
      },
      detalle: {
        es: ['Pueden pedirte mostrarlos por separado en el control de seguridad.', 'En vuelos a Estados Unidos pueden superar los 100 ml, en la cantidad necesaria para el viaje.'],
        en: ['You may be asked to present them separately at security screening.', 'On flights to the United States they may exceed 100 ml, in the quantity needed for the trip.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'hielo-seco',
      categoria: 'alimentos',
      icono: '🧊',
      origen: 'tabla81',
      nombre: { es: 'Hielo seco (para conservar alimentos perecederos)', en: 'Dry ice (to keep perishables cold)' },
      claves: {
        es: ['hielo seco', 'co2 solido', 'cooler', 'congelados', 'mariscos', 'refrigerar'],
        en: ['dry ice', 'solid co2', 'cooler', 'frozen', 'seafood', 'keep cold']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Con aprobación de la aerolínea. Máximo 2,5 kg por persona, en un bulto que deje escapar el gas.',
        en: 'With airline approval. Maximum 2.5 kg per person, in a package that allows the gas to escape.'
      },
      detalle: {
        es: [
          'Solo para embalar mercancías perecederas.',
          'En equipaje facturado, cada bulto debe marcarse "HIELO SECO" (o "DIÓXIDO DE CARBONO SÓLIDO") e indicar el peso neto o que es de 2,5 kg o menos.'
        ],
        en: [
          'Only for packing perishables.',
          'In checked baggage, each package must be marked "DRY ICE" (or "CARBON DIOXIDE, SOLID") with the net weight or an indication that it is 2.5 kg or less.'
        ]
      },
      fuente: ref('18', '', '', false)
    },

    /* ===================== ARTÍCULOS DEPORTIVOS ===================== */
    {
      id: 'bates-palos',
      categoria: 'deportivos',
      icono: '🏏',
      origen: 'avsec',
      nombre: { es: 'Bates, palos de golf o hockey y bastones', en: 'Bats, golf or hockey sticks and batons' },
      claves: {
        es: ['bate', 'palo de golf', 'palo de hockey', 'baston', 'luma'],
        en: ['bat', 'golf club', 'hockey stick', 'baton', 'club']
      },
      mano: 'prohibido',
      bodega: 'permitido',
      aprobacion: false,
      limite: {
        es: 'Nunca en cabina. En bodega, sin problema.',
        en: 'Never in the cabin. Fine in checked baggage.'
      },
      detalle: {
        es: ['Consulta con tu aerolínea las condiciones para equipaje deportivo de gran tamaño.'],
        en: ['Check with your airline for oversized sports equipment conditions.']
      },
      fuente: REF_AVSEC
    },
    {
      id: 'artes-marciales',
      categoria: 'deportivos',
      icono: '🥋',
      origen: 'avsec',
      nombre: { es: 'Equipos de artes marciales', en: 'Martial arts equipment' },
      claves: {
        es: ['artes marciales', 'nunchaku', 'linchaco', 'tonfa', 'shuriken', 'sai', 'bo', 'karate', 'kung fu', 'ley 18.356'],
        en: ['martial arts', 'nunchaku', 'nunchucks', 'tonfa', 'shuriken', 'throwing star', 'sai', 'bo staff', 'karate', 'kung fu']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Prohibidos en cabina los elementos regulados por la Ley N° 18.356 sobre control de las artes marciales.',
        en: 'Items regulated by Chilean Law No. 18,356 on the control of martial arts are forbidden in the cabin.'
      },
      detalle: {
        es: [
          'Aplica a los elementos considerados en la Ley N° 18.356 sobre control de las artes marciales.',
          'Para llevarlos en bodega, revisa los requisitos de esa ley y consulta con tu aerolínea.'
        ],
        en: [
          'Applies to the items covered by Chilean Law No. 18,356 on the control of martial arts.',
          'To carry them in checked baggage, check the requirements of that law and consult your airline.'
        ]
      },
      fuente: {
        es: 'Seguridad de la aviación (AVSEC), DGAC, y Ley N° 18.356 sobre control de las artes marciales.',
        en: 'Aviation security (AVSEC), DGAC, and Chilean Law No. 18,356 on the control of martial arts.'
      }
    },
    {
      id: 'cartuchos-co2',
      categoria: 'deportivos',
      icono: '🚲',
      origen: 'tabla81',
      nombre: { es: 'Cartuchos pequeños de gas (CO2) para infladores, sifones u otros usos', en: 'Small gas (CO2) cartridges for inflators, soda siphons or other uses' },
      claves: {
        es: ['co2', 'cartucho', 'inflador', 'bicicleta', 'sifon', 'garrafa pequena'],
        en: ['co2', 'cartridge', 'inflator', 'bicycle', 'bike', 'soda siphon']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Con aprobación de la aerolínea. Máximo 4 cartuchos por persona, de hasta 50 ml cada uno.',
        en: 'With airline approval. Maximum 4 cartridges per person, up to 50 ml each.'
      },
      detalle: {
        es: [
          'Cartuchos de la División 2.2 sin peligro secundario, que no sean para dispositivos de seguridad autoinflables.',
          'Para el CO2, un cartucho de 50 ml equivale a uno de 28 g.'
        ],
        en: [
          'Division 2.2 cartridges with no subsidiary hazard, not for self-inflating safety devices.',
          'For CO2, a 50 ml cartridge is equivalent to a 28 g cartridge.'
        ]
      },
      fuente: ref('13', '', '', false)
    },
    {
      id: 'chaleco-autoinflable',
      categoria: 'deportivos',
      icono: '🦺',
      origen: 'tabla81',
      nombre: { es: 'Chaleco salvavidas u otro dispositivo de seguridad autoinflable', en: 'Life jacket or other self-inflating safety device' },
      claves: {
        es: ['chaleco salvavidas', 'autoinflable', 'salvavidas', 'navegacion', 'kayak'],
        en: ['life jacket', 'life vest', 'self-inflating', 'sailing', 'kayak']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Con aprobación de la aerolínea. Máximo 2 por persona, con hasta 2 cartuchos instalados y 2 de repuesto cada uno.',
        en: 'With airline approval. Maximum 2 per person, each with up to 2 installed and 2 spare cartridges.'
      },
      detalle: {
        es: [
          'Deben ir embalados para que no puedan accionarse accidentalmente.',
          'Los cartuchos deben ser solo para inflar el dispositivo.'
        ],
        en: [
          'They must be packed so they cannot be activated accidentally.',
          'Cartridges must be solely for inflating the device.'
        ]
      },
      fuente: ref('12', '', '', false)
    },
    {
      id: 'mochila-avalancha',
      categoria: 'deportivos',
      icono: '🏔️',
      origen: 'tabla81',
      nombre: { es: 'Mochila de salvamento para avalanchas', en: 'Avalanche rescue backpack' },
      claves: {
        es: ['mochila avalancha', 'airbag', 'esqui', 'montana', 'nieve'],
        en: ['avalanche backpack', 'airbag', 'ski', 'mountain', 'snow']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Con aprobación de la aerolínea. Una por persona, embalada para que no se active.',
        en: 'With airline approval. One per person, packed so it cannot be activated.'
      },
      detalle: {
        es: [
          'Puede tener un mecanismo pirotécnico de accionamiento de hasta 200 mg netos de la División 1.4S.',
          'Las bolsas inflables deben tener válvulas de descompresión.'
        ],
        en: [
          'It may contain a pyrotechnic trigger mechanism with no more than 200 mg net of Division 1.4S.',
          'The airbags must have pressure relief valves.'
        ]
      },
      fuente: ref('14', '', '', false)
    },

    /* ===================== OTROS ===================== */
    {
      id: 'nitrogeno-liquido',
      categoria: 'otros',
      icono: '🧪',
      origen: 'tabla81',
      nombre: { es: 'Nitrógeno líquido refrigerado (en envase criogénico seco)', en: 'Refrigerated liquid nitrogen (in a dry shipper)' },
      claves: {
        es: ['nitrogeno liquido', 'criogenico', 'dry shipper', 'muestras'],
        en: ['liquid nitrogen', 'cryogenic', 'dry shipper', 'samples']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Solo en recipientes aislados que absorban todo el líquido y no acumulen presión.',
        en: 'Only in insulated packaging that fully absorbs the liquid and does not build up pressure.'
      },
      detalle: {
        es: ['Ver la Disposición especial A152.'],
        en: ['See Special Provision A152.']
      },
      fuente: ref('22', '', '', false)
    },
    {
      id: 'especimenes',
      categoria: 'otros',
      icono: '🔬',
      origen: 'tabla81',
      nombre: { es: 'Especímenes no infecciosos en soluciones inflamables (muestras científicas)', en: 'Non-infectious specimens in flammable solutions (scientific samples)' },
      claves: {
        es: ['especimen', 'muestra', 'formalina', 'alcohol', 'laboratorio', 'museo'],
        en: ['specimen', 'sample', 'formalin', 'laboratory', 'museum']
      },
      mano: 'restringido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Deben embalarse y marcarse según la Disposición especial A180.',
        en: 'They must be packed and marked as per Special Provision A180.'
      },
      detalle: {
        es: ['Consulta con la aerolínea el embalaje requerido.'],
        en: ['Check the required packaging with the airline.']
      },
      fuente: ref('21', '', '', false)
    },
    {
      id: 'dispositivos-permeacion',
      categoria: 'otros',
      icono: '📟',
      origen: 'tabla81',
      nombre: { es: 'Dispositivos de permeación (calibración de monitores de calidad del aire)', en: 'Permeation devices (for calibrating air quality monitors)' },
      claves: {
        es: ['permeacion', 'calibracion', 'calidad del aire', 'monitor'],
        en: ['permeation', 'calibration', 'air quality', 'monitor']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: false,
      limite: {
        es: 'Solo en bodega, embalados según la Disposición especial A41.',
        en: 'Checked baggage only, packed as per Special Provision A41.'
      },
      detalle: {
        es: ['Uso técnico: consulta con la aerolínea antes de viajar.'],
        en: ['Technical use: check with the airline before travelling.']
      },
      fuente: ref('20', '', '', false)
    },
    {
      id: 'equipo-seguridad',
      categoria: 'otros',
      icono: '💼',
      origen: 'tabla81',
      nombre: { es: 'Maletines y cajas de seguridad con mercancías peligrosas incorporadas', en: 'Security briefcases and cash boxes with built-in dangerous goods' },
      claves: {
        es: ['maletin de seguridad', 'caja de seguridad', 'transporte de valores', 'alarma'],
        en: ['security briefcase', 'cash box', 'cash bag', 'valuables', 'alarm']
      },
      mano: 'prohibido',
      bodega: 'restringido',
      aprobacion: true,
      limite: {
        es: 'Solo en bodega, con aprobación de la aerolínea y un medio eficaz contra la activación accidental.',
        en: 'Checked baggage only, with airline approval and an effective means to prevent accidental activation.'
      },
      detalle: {
        es: ['Las mercancías peligrosas incorporadas deben cumplir la Disposición especial A178.'],
        en: ['The built-in dangerous goods must meet Special Provision A178.']
      },
      fuente: ref('23', '', '', false)
    }
  ]
};

/* ---------- Utilidades compartidas ---------- */
EPV.clonar = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};

EPV.normalizar = function (texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

EPV.escaparHTML = function (texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

EPV.categoria = function (id) {
  for (var i = 0; i < EPV.CATEGORIAS.length; i++) {
    if (EPV.CATEGORIAS[i].id === id) return EPV.CATEGORIAS[i];
  }
  return EPV.CATEGORIAS[EPV.CATEGORIAS.length - 1];
};

/* Valida un catálogo completo. Devuelve { ok, errores[] } */
EPV.validarCatalogo = function (cat) {
  var errores = [];
  var idsCategorias = EPV.CATEGORIAS.map(function (c) { return c.id; });

  function texto(v) { return typeof v === 'string' && v.trim().length > 0; }
  function bilingue(v) { return v && texto(v.es) && texto(v.en); }
  function lista(v) {
    return v && Array.isArray(v.es) && Array.isArray(v.en) &&
      v.es.every(function (x) { return typeof x === 'string'; }) &&
      v.en.every(function (x) { return typeof x === 'string'; });
  }

  if (!cat || typeof cat !== 'object' || !Array.isArray(cat.elementos)) {
    return { ok: false, errores: ['El archivo no tiene la estructura esperada (falta la lista "elementos").'] };
  }

  var vistos = {};
  cat.elementos.forEach(function (e, i) {
    var n = 'Elemento ' + (i + 1) + (e && e.nombre && e.nombre.es ? ' («' + e.nombre.es + '»)' : '');
    if (!e || typeof e !== 'object') { errores.push(n + ': no es un objeto válido.'); return; }
    if (!texto(e.id)) errores.push(n + ': falta el identificador (id).');
    else if (vistos[e.id]) errores.push(n + ': el id "' + e.id + '" está repetido.');
    else vistos[e.id] = true;
    if (idsCategorias.indexOf(e.categoria) === -1) errores.push(n + ': categoría no válida.');
    if (EPV.ESTADOS.indexOf(e.mano) === -1) errores.push(n + ': estado de cabina no válido.');
    if (EPV.ESTADOS.indexOf(e.bodega) === -1) errores.push(n + ': estado de bodega no válido.');
    if ([true, false, null].indexOf(e.aprobacion) === -1) errores.push(n + ': valor de aprobación no válido.');
    if (!bilingue(e.nombre)) errores.push(n + ': falta el nombre en español o inglés.');
    if (!bilingue(e.limite)) errores.push(n + ': falta la condición en español o inglés.');
    if (!lista(e.claves)) errores.push(n + ': las palabras clave no tienen el formato esperado.');
    if (!lista(e.detalle)) errores.push(n + ': el detalle no tiene el formato esperado.');
    if (!bilingue(e.fuente)) errores.push(n + ': falta la referencia normativa en español o inglés.');
  });

  return { ok: errores.length === 0, errores: errores.slice(0, 12) };
};

/* Carga el catálogo publicado (catalogo.json). Si no está disponible, usa la semilla. */
EPV.cargarPublicado = function () {
  return fetch(EPV.RUTA_CATALOGO, { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (cat) {
      var v = EPV.validarCatalogo(cat);
      if (!v.ok) throw new Error('Catálogo inválido');
      return { catalogo: cat, origen: 'publicado' };
    })
    .catch(function () {
      return { catalogo: EPV.clonar(EPV.SEMILLA), origen: 'semilla' };
    });
};

/* Lee el borrador del mantenedor guardado en este navegador */
EPV.leerBorrador = function () {
  try {
    var txt = localStorage.getItem(EPV.CLAVE_BORRADOR);
    if (!txt) return null;
    var cat = JSON.parse(txt);
    return EPV.validarCatalogo(cat).ok ? cat : null;
  } catch (e) {
    return null;
  }
};
