export function calculateCartTotals(cart) {
	return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
}
