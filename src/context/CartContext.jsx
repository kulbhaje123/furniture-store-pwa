import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchProducts, fetchServerCart } from '../services/api';
import { syncPendingCart } from '../services/syncService';
import {
	cacheProducts,
	getCachedProducts,
	getLocalCart,
	getQueuedChanges,
	importServerCart,
	saveCartItem,
} from '../db/indexedDB';

const CartContext = createContext(null);
export function CartProvider({ children }) {
	const [products, setProducts] = useState([]);
	const [cart, setCart] = useState([]);
	const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine !== false);
	const [pendingCount, setPendingCount] = useState(0);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const syncInProgress = useRef(false);
	const isOnline = browserOnline;

	useEffect(() => {
		const handleOnline = () => setBrowserOnline(true);
		const handleOffline = () => setBrowserOnline(false);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	useEffect(() => {
		let active = true;
		async function restoreLocalState() {
			try {
				const [savedProducts, savedCart, queuedChanges] = await Promise.all([
					getCachedProducts(),
					getLocalCart(),
					getQueuedChanges(),
				]);
				if (active) {
					setProducts(savedProducts);
					setCart(savedCart);
					setPendingCount(queuedChanges.length);
				}
			} finally {
				if (active) setIsReady(true);
			}
		}
		restoreLocalState();
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (!isReady || !isOnline) return undefined;
		let active = true;
		async function refreshCatalog() {
			try {
				const latestProducts = await fetchProducts();
				await cacheProducts(latestProducts);
				if (active) setProducts(latestProducts);
			} catch {
				// Keep the last catalog snapshot when the API is unavailable.
			}

			try {
				const [savedCart, queuedChanges] = await Promise.all([getLocalCart(), getQueuedChanges()]);
				if (savedCart.length === 0 && queuedChanges.length === 0) {
					const serverCart = await fetchServerCart();
					await importServerCart(serverCart);
					if (active) setCart(await getLocalCart());
				}
			} catch {
				// Local cart data remains usable if the server cannot be reached.
			}
		}
		refreshCatalog();
		return () => {
			active = false;
		};
	}, [isOnline, isReady]);

	useEffect(() => {
		if (!isReady || !isOnline || pendingCount === 0 || syncInProgress.current) return undefined;
		let active = true;
		syncInProgress.current = true;
		setIsSyncing(true);
		async function synchronize() {
			try {
				try {
					await syncPendingCart();
				} catch {
					// Keep the queued cart changes for the next reconnect attempt.
				}
				const [updatedCart, queuedChanges] = await Promise.all([getLocalCart(), getQueuedChanges()]);
				if (active) {
					setCart(updatedCart);
					setPendingCount(queuedChanges.length);
				}
			} finally {
				syncInProgress.current = false;
				if (active) setIsSyncing(false);
			}
		}
		synchronize();
		return () => {
			active = false;
		};
	}, [isOnline, isReady, pendingCount]);

	async function addToCart(product, amount = 1) {
		const existing = cart.find((item) => String(item.productId) === String(product.id));
		const updatedCart = await saveCartItem(product, (existing?.quantity || 0) + amount);
		setCart(updatedCart);
		setPendingCount((await getQueuedChanges()).length);
	}

	async function updateQuantity(productId, quantity) {
		const item = cart.find((entry) => String(entry.productId) === String(productId));
		if (!item) return;
		const updatedCart = await saveCartItem(item.product, quantity);
		setCart(updatedCart);
		setPendingCount((await getQueuedChanges()).length);
	}

	async function removeFromCart(productId) {
		const item = cart.find((entry) => String(entry.productId) === String(productId));
		if (!item) return;
		const updatedCart = await saveCartItem(item.product, 0);
		setCart(updatedCart);
		setPendingCount((await getQueuedChanges()).length);
	}

	const value = {
		products,
		cart,
		isOnline,
		pendingCount,
		isSyncing,
		isReady,
		addToCart,
		updateQuantity,
		removeFromCart,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) throw new Error('useCart must be used within a CartProvider');
	return context;
}
