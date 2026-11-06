import { Link } from 'react-router';

function formatPrice(price) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function ProductCard({ product, onAdd }) {
	return (
		<article className="product-card">
			<Link className="product-card-image" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
				<img className="product-image" src={product.image} alt={product.name} loading="lazy" />
			</Link>
			<div className="product-card-info">
				<p className="product-category">{product.category}</p>
				<h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
				<div className="product-card-bottom">
					<p className="product-price">{formatPrice(product.price)}</p>
					<button type="button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>Add to cart</button>
				</div>
			</div>
		</article>
	);
}

export default ProductCard;
