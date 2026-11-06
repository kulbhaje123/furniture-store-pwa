import { Link } from 'react-router';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';
import { calculateCartTotals } from '../services/cartService';

function formatPrice(price) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function CartPage() {
	const { cart, isOnline, pendingCount, updateQuantity, removeFromCart } = useCart();
	const total = calculateCartTotals(cart);

	if (cart.length === 0) {
		return (
			<section className="empty-cart">
				<p className="eyebrow">Your cart</p>
				<h1>Nothing here just yet.</h1>
				<p>Add something you love and it’ll show up here.</p>
				<Link className="featured-link" to="/">Browse furniture <span aria-hidden="true">↗</span></Link>
			</section>
		);
	}

	return (
		<section className="cart-page">
			<div className="cart-heading">
				<div><p className="eyebrow">Your picks</p><h1>Your cart</h1></div>
				<p>{isOnline ? 'Online' : 'Offline'} · {pendingCount ? `${pendingCount} item(s) waiting to sync` : 'Cart synced'}</p>
			</div>
			<div className="cart-list">
				{cart.map((item) => (
					<CartItem key={item.productId} item={item} onQuantityChange={updateQuantity} onRemove={removeFromCart} />
				))}
			</div>
			<div className="cart-bottom">
				<Link to="/">← Continue shopping</Link>
				<p>Total <strong>{formatPrice(total)}</strong></p>
			</div>
		</section>
	);
}

export default CartPage;
