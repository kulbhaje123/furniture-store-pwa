import './App.css';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { CartProvider, useCart } from './context/CartContext';
import CartPage from './pages/CartPage';
import ProductDetails from './pages/ProductDetails';
import ProductList from './pages/ProductList';
import SyncIndicator from './components/SyncIndicator';

function Header() {
	const { cart, isOnline, pendingCount, isSyncing } = useCart();
	const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

	return (
		<header className="site-header">
			<Link className="site-title" to="/" aria-label="Common Room home">
				<span className="brand-mark">CR</span>
				<span className="brand-name">COMMON ROOM<small>FURNITURE FOR LIVING</small></span>
			</Link>
			<nav aria-label="Main navigation">
				<Link to="/">Shop</Link>
				<Link className="cart-nav" to="/cart">Cart <span>{itemCount}</span></Link>
			</nav>
			<SyncIndicator isOnline={isOnline} pendingCount={pendingCount} isSyncing={isSyncing} />
		</header>
	);
}

function App() {
	return (
		<CartProvider>
			<BrowserRouter>
				<div className="store-app">
					<Header />
					<main className="page-container">
						<Routes>
							<Route path="/" element={<ProductList />} />
							<Route path="/products/:productId" element={<ProductDetails />} />
							<Route path="/cart" element={<CartPage />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</main>
				</div>
			</BrowserRouter>
		</CartProvider>
	);
}

export default App;
