function formatPrice(price) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function CartItem({ item, onQuantityChange, onRemove }) {
	return (
		<article className="cart-item">
			<img className="cart-item-image" src={item.product.image} alt="" />
			<div className="cart-item-details">
				<p className="product-category">{item.product.category}</p>
				<h2>{item.product.name}</h2>
				<p>{formatPrice(item.product.price)} each</p>
				<p className={`item-status ${item.status}`}>{item.status === 'synced' ? 'Synced' : 'Yet to sync'}</p>
			</div>
			<div className="quantity-control" aria-label={`Quantity for ${item.product.name}`}>
				<button type="button" onClick={() => onQuantityChange(item.productId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
				<span aria-live="polite">{item.quantity}</span>
				<button type="button" onClick={() => onQuantityChange(item.productId, item.quantity + 1)} aria-label="Increase quantity">+</button>
			</div>
			<strong>{formatPrice(item.product.price * item.quantity)}</strong>
			<button type="button" onClick={() => onRemove(item.productId)} aria-label={`Remove ${item.product.name}`}>Remove</button>
		</article>
	);
}

export default CartItem;
