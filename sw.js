/* Service worker Aureola — cache dell'app shell per uso offline */
const CACHE = 'aureola-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/generators.js',
  './js/objects.js',
  './js/persistence.js',
  './js/polygon.js',
  './js/tiling.js',
  './js/viewport.js',
  './vendor/fabric.min.js',
  './assets/fonts/GrenzeGotisch.woff2',
  './assets/fonts/PirataOne.woff2',
  './assets/fonts/UnifrakturCook.woff2',
  './assets/fonts/UnifrakturMaguntia.woff2',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
