/* Service worker v2
   - Páginas y catalogo.json: primero la red (para que los cambios publicados lleguen al instante).
   - Resto de archivos: caché con actualización en segundo plano.
   Sube el número de CACHE en cada versión nueva. */
const CACHE = 'epv-v7';
const APP = [
  './', './index.html', './admin.html', './styles.css',
  './data.js', './script.js', './admin.js',
  './catalogo.json', './manifest.json', './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copia = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copia));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const primeroRed = req.mode === 'navigate' || url.pathname.endsWith('/catalogo.json');

  if (primeroRed) {
    e.respondWith(
      fetch(req)
        .then((res) => guardar(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((guardado) => {
      const red = fetch(req).then((res) => guardar(req, res)).catch(() => guardado);
      return guardado || red;
    })
  );
});
