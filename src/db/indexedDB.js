import { openDB } from 'idb';

const DATABASE_NAME = 'form-field-store';
const DATABASE_VERSION = 1;
const STORAGE_KEYS = {
	products: 'form-field-products',
	cart: 'form-field-cart',
	outbox: 'form-field-outbox',
};

const databasePromise = typeof indexedDB === 'undefined'
	? null
	: openDB(DATABASE_NAME, DATABASE_VERSION, {
			upgrade(database) {
				database.createObjectStore('products', { keyPath: 'id' });
				database.createObjectStore('cart', { keyPath: 'productId' });
				database.createObjectStore('outbox', { keyPath: 'productId' });
			},
		});

function readFallback(key) {
	try {
		return JSON.parse(window.localStorage.getItem(STORAGE_KEYS[key]) || '[]');
	} catch {
		return [];
	}
}

function writeFallback(key, value) {
	window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
}

export async function getCachedProducts() {
	if (!databasePromise) return readFallback('products');
	return (await databasePromise).getAll('products');
}

export async function cacheProducts(products) {
	if (!databasePromise) {
		writeFallback('products', products);
		return;
	}
	const database = await databasePromise;
	const transaction = database.transaction('products', 'readwrite');
	await Promise.all(products.map((product) => transaction.store.put(product)));
	await transaction.done;
}

export async function getLocalCart() {
	if (!databasePromise) return readFallback('cart');
	return (await databasePromise).getAll('cart');
}

export async function getQueuedChanges() {
	if (!databasePromise) return readFallback('outbox');
	return (await databasePromise).getAll('outbox');
}

export async function saveCartItem(product, quantity) {
	const productId = product.id;
	if (!databasePromise) {
		const cart = readFallback('cart');
		const outbox = readFallback('outbox');
		const previous = outbox.find((entry) => String(entry.productId) === String(productId));
		const change = {
			productId,
			product,
			quantity,
			revision: (previous?.revision || 0) + 1,
		};
		writeFallback('outbox', [...outbox.filter((entry) => String(entry.productId) !== String(productId)), change]);
		const updatedCart = cart.filter((item) => String(item.productId) !== String(productId));
		if (quantity > 0) {
			updatedCart.push({ productId, product, quantity, status: 'pending' });
		}
		writeFallback('cart', updatedCart);
		return updatedCart;
	}

	const database = await databasePromise;
	const transaction = database.transaction(['cart', 'outbox'], 'readwrite');
	const outboxStore = transaction.objectStore('outbox');
	const previous = await outboxStore.get(productId);
	await outboxStore.put({
		productId,
		product,
		quantity,
		revision: (previous?.revision || 0) + 1,
	});
	const cartStore = transaction.objectStore('cart');
	if (quantity > 0) {
		await cartStore.put({ productId, product, quantity, status: 'pending' });
	} else {
		await cartStore.delete(productId);
	}
	await transaction.done;
	return database.getAll('cart');
}

export async function markCartItemSynced(change) {
	if (!databasePromise) {
		const outbox = readFallback('outbox');
		const current = outbox.find((entry) => String(entry.productId) === String(change.productId));
		if (current?.revision === change.revision) {
			writeFallback('outbox', outbox.filter((entry) => String(entry.productId) !== String(change.productId)));
			const cart = readFallback('cart').map((item) => (
				String(item.productId) === String(change.productId) ? { ...item, status: 'synced' } : item
			));
			writeFallback('cart', cart);
		}
		return readFallback('cart');
	}

	const database = await databasePromise;
	const transaction = database.transaction(['cart', 'outbox'], 'readwrite');
	const outboxStore = transaction.objectStore('outbox');
	const current = await outboxStore.get(change.productId);
	if (current?.revision === change.revision) {
		await outboxStore.delete(change.productId);
		const cartStore = transaction.objectStore('cart');
		const cartItem = await cartStore.get(change.productId);
		if (cartItem) await cartStore.put({ ...cartItem, status: 'synced' });
	}
	await transaction.done;
	return database.getAll('cart');
}

export async function importServerCart(serverItems) {
	if (!databasePromise) {
		if (readFallback('cart').length || readFallback('outbox').length) return;
		const cart = serverItems
			.filter((item) => item.quantity > 0 && item.product)
			.map((item) => ({
				productId: item.productId ?? item.product.id,
				product: item.product,
				quantity: item.quantity,
				status: 'synced',
			}));
		writeFallback('cart', cart);
		return;
	}

	const database = await databasePromise;
	const transaction = database.transaction(['cart', 'outbox'], 'readwrite');
	const cartStore = transaction.objectStore('cart');
	const outboxStore = transaction.objectStore('outbox');
	if ((await cartStore.count()) === 0 && (await outboxStore.count()) === 0) {
		for (const item of serverItems) {
			if (item.quantity > 0 && item.product) {
				await cartStore.put({
					productId: item.productId ?? item.product.id,
					product: item.product,
					quantity: item.quantity,
					status: 'synced',
				});
			}
		}
	}
	await transaction.done;
}
