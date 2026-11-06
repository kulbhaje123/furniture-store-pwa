import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router';

function ProductList() {
	const { products, addToCart, isReady } = useCart();

	return (
		<div className="shop-page">
			<section className="featured-section">
				<div className="featured-copy">
					<p className="eyebrow">A home for the everyday</p>
					<h1>Make room<br />for <em>living.</em></h1>
					<p className="featured-description">Thoughtful furniture for slow mornings, long dinners, and everything in between.</p>
					<Link className="featured-link" to="/products/1">Meet the sofa <span aria-hidden="true">↗</span></Link>
					<p className="featured-footnote"><span>01</span> THE LIVING ROOM EDIT</p>
				</div>
				<Link className="featured-image" to="/products/1" aria-label="View Modern Fabric Sofa">
					<img src="/images/modern-fabric-sofa.jpg" alt="Modern fabric sofa in a light-filled living room" />
					<span>Made for putting your feet up</span>
				</Link>
			</section>

			<section className="products-section" id="products">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Good things for every room</p>
						<h2>Shop the collection</h2>
					</div>
					<span>{products.length} pieces</span>
				</div>
			{!isReady ? (
				<p>Loading products...</p>
			) : products.length ? (
				<div className="product-grid">
					{products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
				</div>
			) : (
				<p>Products are not available. Start the JSON Server and refresh the page.</p>
			)}
			</section>
		</div>
	);
}

export default ProductList;
