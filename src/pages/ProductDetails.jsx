import { Link, useNavigate, useParams } from 'react-router';
import { useCart } from '../context/CartContext';

function formatPrice(price) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function ProductDetails() {
	const { productId } = useParams();
	const navigate = useNavigate();
	const { products, addToCart, isReady } = useCart();
	const product = products.find((item) => String(item.id) === productId);

	if (!isReady) return <p className="empty-message">Loading product...</p>;
	if (!product) return <p>Product not found. <Link to="/">Back to products</Link></p>;

	return (
		<section className="details-page">
			<Link className="back-link" to="/">← All furniture</Link>
			<div className="details-layout">
				<div className="details-image-wrap"><img src={product.image} alt={product.name} /></div>
				<div className="details-copy">
					<p className="eyebrow">{product.category}</p>
					<h1>{product.name}</h1>
					<p className="details-description">{product.description}</p>
					<p className="details-price">{formatPrice(product.price)}</p>
					<button className="add-detail-button" type="button" onClick={async () => { await addToCart(product); navigate('/cart'); }}>
						Add to cart
					</button>
					<p className="details-note">Your cart is saved on this device and syncs when you’re back online.</p>
				</div>
			</div>
		</section>
	);
}

export default ProductDetails;
