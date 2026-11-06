# My Furniture Store PWA

A React furniture storefront with product listing and detail pages, an offline-first cart, and queued cart synchronization through JSON Server.

## Run locally

Install dependencies:

```bash
npm install
```

Start the JSON Server backend in one terminal:

```bash
npm run server
```

Start React in a second terminal:

```bash
npm start
```

Open `http://localhost:3000`. The API defaults to `http://localhost:5000`; set `REACT_APP_API_URL` before starting React to use a different backend URL.

## Offline behavior

After the first successful online load, product data and cart contents are stored locally. IndexedDB is used when available, with local storage as a fallback. Product images and the app shell are cached by the service worker. Cart changes made offline are kept in a local outbox and synchronized when the browser reconnects.

To test offline mode, open browser DevTools, go to **Network**, and choose **Offline** in the network throttling menu. Add or change cart items. Choose **No throttling** to reconnect; queued cart changes sync automatically. The cart marks each item as **Synced** or **Yet to sync**.

Service workers require localhost or HTTPS. JSON Server and the React app run as separate processes during development.

## Learning notes

- [Complete app walkthrough](docs/complete-app-walkthrough.md)
- [Service worker walkthrough](docs/service-worker-walkthrough.md)
- [Offline cart flow](docs/offline-cart-flow.md)
