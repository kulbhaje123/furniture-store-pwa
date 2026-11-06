# Service Worker Walkthrough

This document explains `public/service-worker.js`, the browser script that lets the furniture store load while offline.

## What the Service Worker Does

The service worker handles requests for files from the app's own origin. It caches the app shell, JavaScript, CSS, and product photos. When the network is unavailable, it can return those cached files.

It does not save cart data or send cart updates to JSON Server. The cart uses IndexedDB and React code for that; see [Offline Cart Flow](offline-cart-flow.md).

## How It Is Registered

In `src/index.js`, after the browser finishes loading the page, the app calls:

```js
navigator.serviceWorker.register('/service-worker.js');
```

The leading `/` makes the worker's scope the site root, so it can handle requests for the app's pages and images. Service workers require `localhost` during development or HTTPS in a deployed site.

## Cache Setup

At the top of `public/service-worker.js`:

```js
const CACHE_NAME = 'form-field-store-v4';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];
```

`CACHE_NAME` identifies this version of the app cache. When cached files change, update this name, for example to `form-field-store-v5`. The activation handler then removes older caches owned by this app.

`PRODUCT_IMAGES` lists all 12 local furniture photos. Listing them here lets the worker download the images before the user opens every product page.

## Install Event

The browser runs the `install` event when it downloads a new service-worker version:

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...APP_SHELL, ...PRODUCT_IMAGES]))
      // ...
  );
});
```

`caches.open` opens or creates a Cache Storage bucket. `cache.addAll` fetches each listed URL and saves its response. `event.waitUntil` tells the browser to keep the installation pending until that work finishes.

The worker then fetches `/` and scans its HTML for JavaScript and CSS URLs. React build files have generated names, so this avoids hard-coding a filename that changes between builds. Those scripts and styles are cached as well; without them, cached HTML would load but React could not render the interface offline. Individual script or stylesheet cache failures are ignored by `.catch(() => undefined)`.

Finally, `self.skipWaiting()` asks the new worker to activate without waiting for all pages controlled by the previous worker to close.

## Activate Event

The browser runs `activate` after installation:

```js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('form-field-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
```

This removes older `form-field-*` caches but leaves caches belonging to other apps untouched. `self.clients.claim()` lets the new worker control open pages without requiring a second visit.

## Fetch Event

The `fetch` event runs for requests made by controlled pages. The worker first limits its handling:

```js
if (request.method !== 'GET' || url.origin !== self.location.origin) return;
```

Only same-origin `GET` requests are handled. For example, the React app is on port `3000` or `3001`, while JSON Server is on port `5000`. Different ports are different origins, so API requests are not cached by this service worker.

### Page navigations: network first

For navigation requests, the worker tries the network first. A successful response is cloned and saved as `/index.html`. If the network request fails, it returns cached `/index.html` or `/` instead. React Router can then display the requested route using the cached app shell.

### Product images: cache first

For `/images/...` requests, the worker checks Cache Storage first. If a copy exists, it returns it immediately. Otherwise it fetches the image and saves successful responses. This makes the product photos available offline after the worker's install has completed.

### Other same-origin files: network first

For scripts, styles, and other same-origin `GET` files, the worker tries the network. Successful responses are cached. If the network request fails, it tries Cache Storage.

`event.respondWith(...)` tells the browser to use the response returned by the worker.

## Testing It

1. Open the app online and wait for it to load once. The worker must install before it can cache files.
2. In DevTools, open **Application → Service Workers** and verify that the worker is activated and controlling the page.
3. In **Application → Cache Storage**, look for `form-field-store-v4` and confirm it contains app files and product images.
4. Use **Network → Offline** and reload. The cached app shell should open without a network connection.

To test the cart's offline status and reconnect events, use **Network → Offline** rather than only the service-worker Offline checkbox. The app listens to the browser's `offline` and `online` events; the cart queue is handled separately by React and IndexedDB.

If you change cached files and the browser keeps showing old versions, bump `CACHE_NAME`, reload once while online, and verify that the new worker has activated.
