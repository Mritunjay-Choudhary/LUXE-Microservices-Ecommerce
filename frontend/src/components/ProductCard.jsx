import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { formatCurrency } from '../utils/helpers';

const ProductCard = ({ product }) => {
  const imageUrl = product.images?.[0]?.url || '/placeholder.png';

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Category Badge */}
        {product.category && (
          <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-2">
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-gray-700">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
        )}

        {/* Rating */}
        <div className="mb-2">
          <StarRating rating={product.rating || 0} size={14} showValue />
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-gray-900 mb-2">
          {formatCurrency(product.price)}
        </p>

        {/* Stock Status */}
        {product.stock > 0 ? (
          <span className="text-xs font-medium text-green-600">In Stock</span>
        ) : (
          <span className="text-xs font-medium text-red-600">Out of Stock</span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
