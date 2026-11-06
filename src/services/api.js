const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});
	if (!response.ok) throw new Error(`Request failed (${response.status})`);
	if (response.status === 204) return null;
	return response.json();
}

export function fetchProducts() {
	return request('/products');
}

export function fetchServerCart() {
	return request('/cart');
}

export async function syncCartItem(change) {
	const rows = await request(`/cart?productId=${encodeURIComponent(change.productId)}`);
	if (change.quantity <= 0) {
		await Promise.all(rows.map((row) => request(`/cart/${encodeURIComponent(row.id)}`, { method: 'DELETE' })));
		return;
	}

	const [existing, ...duplicates] = rows;
	const record = {
		id: String(change.productId),
		productId: change.productId,
		product: change.product,
		quantity: change.quantity,
	};
	if (existing) {
		await request(`/cart/${encodeURIComponent(existing.id)}`, {
			method: 'PATCH',
			body: JSON.stringify({ product: change.product, quantity: change.quantity }),
		});
		await Promise.all(duplicates.map((row) => request(`/cart/${encodeURIComponent(row.id)}`, { method: 'DELETE' })));
	} else {
		await request('/cart', { method: 'POST', body: JSON.stringify(record) });
	}
}
