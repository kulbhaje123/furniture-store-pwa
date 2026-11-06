# Offline Cart Flow

This document explains how products and cart changes remain available offline, and how the cart synchronizes with JSON Server when the browser reconnects.

## The Two Storage Systems

This app uses two kinds of browser storage for different purposes:

| Storage | Used for | Main code |
| --- | --- | --- |
| Cache Storage | App shell, JavaScript, CSS, manifest, and product photos | `public/service-worker.js` |
| IndexedDB | Product records, cart records, and queued cart changes | `src/db/indexedDB.js` |

The service worker keeps the site files available. IndexedDB keeps the user's data available. The service worker does not sync cart changes.

## Startup

`CartProvider` in `src/context/CartContext.jsx` starts by restoring products, cart items, and queued changes from IndexedDB:

```js
const [savedProducts, savedCart, queuedChanges] = await Promise.all([
  getCachedProducts(),
  getLocalCart(),
  getQueuedChanges(),
]);
```

This means a returning user can immediately see the last saved catalog and cart, even if the network is unavailable.

When the browser is online, the context requests fresh products from `src/services/api.js` and saves them through `cacheProducts`. If the request fails, it keeps using the local catalog. The backend is JSON Server at `http://localhost:5000` by default.

## Saving a Cart Change

Product pages call the context functions `addToCart`, `updateQuantity`, or `removeFromCart`. Each function calls `saveCartItem` in `src/db/indexedDB.js`.

`saveCartItem` writes two records:

1. The updated item in the local cart store, marked `pending` (unless its quantity is zero, in which case the local cart row is removed).
2. The latest desired state in the outbox store, including product ID, product details, quantity, and a revision number.

The outbox stores the latest desired quantity for a product rather than a log of every click. For example, changing a quantity from 1 to 2 to 3 leaves one pending change with quantity 3.

If IndexedDB is unavailable, the module uses local storage as a fallback.

## Synchronizing on Reconnect

`CartProvider` listens for browser `offline` and `online` events. When it sees the browser return online and there are queued changes, it calls `syncPendingCart` in `src/services/syncService.js`.

For each queued change, the sync service calls `syncCartItem` in `src/services/api.js`:

- If the desired quantity is zero, it deletes matching server rows.
- If a matching cart row exists, it updates it.
- If no row exists, it creates one.

After a successful API operation, `markCartItemSynced` removes the outbox record and changes the local cart item's status to `synced`.

The outbox revision check prevents an older sync response from clearing a newer change the user made while synchronization was in progress. If a server request fails, the context leaves the queued change in IndexedDB so it can try again on a later reconnect or page load.

## Request Flow

```mermaid
sequenceDiagram
  participant User
  participant React as React CartContext
  participant IDB as IndexedDB
  participant API as JSON Server

  User->>React: Add, change, or remove item
  React->>IDB: Save local cart and outbox record
  IDB-->>React: Return updated local cart
  React-->>User: Show cart as Yet to sync
  Note over User,API: Browser is offline; no API write is required
  User->>React: Browser reconnects
  React->>IDB: Read queued changes
  React->>API: Create, update, or delete cart row
  API-->>React: Successful response
  React->>IDB: Remove queue record and mark item synced
  React-->>User: Show Synced
```

## How to Demonstrate It

1. Load the app once while online so the service worker and local catalog are ready.
2. Open DevTools **Network** and select **Offline**.
3. Add a product or change its quantity, then open the cart. The item should show **Yet to sync**.
4. Select **No throttling** to reconnect. The app should send the queued state to JSON Server and mark the item **Synced**.

`navigator.onLine` is a browser connectivity hint, not a guarantee that the API is reachable. The app also catches failed API requests and keeps pending changes locally.

## Related Code

- `public/service-worker.js`: caches the app shell, scripts, styles, and photos.
- `src/index.js`: registers the service worker.
- `src/context/CartContext.jsx`: restores local state, watches connectivity, and starts sync.
- `src/db/indexedDB.js`: reads/writes IndexedDB and local-storage fallback.
- `src/services/syncService.js`: sends queued changes one by one.
- `src/services/api.js`: calls JSON Server.
