/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'form-field-store-v4';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];
const PRODUCT_IMAGES = [
  '/images/modern-fabric-sofa.jpg',
  '/images/wooden-coffee-table.jpg',
  '/images/dining-table.jpg',
  '/images/king-size-storage-bed.jpg',
  '/images/sliding-door-wardrobe.jpg',
  '/images/study-desk.jpg',
  '/images/ergonomic-office-chair.jpg',
  '/images/wooden-bookshelf.jpg',
  '/images/tv-entertainment-unit.jpg',
  '/images/leather-recliner.jpg',
  '/images/shoe-storage-cabinet.jpg',
  '/images/bedside-table.jpg',
];

//Install: download files for offline use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...APP_SHELL, ...PRODUCT_IMAGES]))
      .then(async () => {
        const response = await fetch('/');
        const html = await response.text();
        const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)]
          .map((match) => new URL(match[1], self.location.origin).href);
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(assets.map((asset) => cache.add(asset).catch(() => undefined)));
      })
      // eslint-disable-next-line no-restricted-globals
      .then(() => self.skipWaiting())
  );
});

//Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('form-field-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

//Fetch: choose a response for each request
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || caches.match('/'))
    );
    return;
  }

  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request))
  );
});