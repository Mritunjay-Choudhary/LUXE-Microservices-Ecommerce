import { useState, useCallback } from 'react';
import { Search, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewApi } from '../../api/reviewApi';
import { productApi } from '../../api/productApi';
import StarRating from '../../components/StarRating';
import LoadingSpinner from '../../components/LoadingSpinner';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Search for products
  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setSelectedProduct(null);
    setReviews([]);
    setSummary(null);

    try {
      // If the query looks like a Mongo ObjectId, go straight to reviews
      if (/^[a-f0-9]{24}$/i.test(q)) {
        setSelectedProduct({ _id: q, name: `Product ${q.slice(-6).toUpperCase()}` });
        await fetchReviews(q);
      } else {
        const res = await productApi.list({ q, limit: 10 });
        setSearchResults(res.data?.products || []);
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const fetchReviews = useCallback(async (productId) => {
    setLoadingReviews(true);
    try {
      const res = await reviewApi.getProductReviews(productId);
      setReviews(res.data?.reviews || []);
      setSummary(res.data?.summary || null);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    fetchReviews(product._id);
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeleting(review._id);
    try {
      await reviewApi.delete(review._id);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search product by name or paste a product ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search results (product list) */}
      {searchResults.length > 0 && !selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 divide-y divide-gray-100">
          <p className="px-5 py-3 text-sm text-gray-500">
            Select a product to view its reviews
          </p>
          {searchResults.map((product) => (
            <button
              key={product._id}
              onClick={() => selectProduct(product)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <img
                src={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover bg-gray-100"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category} · {product.brand || '—'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected product + reviews */}
      {selectedProduct && (
        <div>
          <div className="flex items-center gap-3 mb-4 bg-indigo-50 rounded-xl px-5 py-3">
            <Star className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">{selectedProduct.name}</p>
              {summary && (
                <p className="text-xs text-indigo-600">
                  Average: {summary.averageRating?.toFixed(1) || '—'} · {summary.totalReviews || 0} reviews
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setReviews([]);
                setSummary(null);
              }}
              className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear
            </button>
          </div>

          {loadingReviews ? (
            <LoadingSpinner />
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No reviews for this product.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-semibold text-gray-900">{review.rating}/5</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                      <p className="text-xs text-gray-400">
                        User: {typeof review.userId === 'object' ? review.userId?.name || review.userId?._id : review.userId}
                        {' · '}
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(review)}
                      disabled={deleting === review._id}
                      className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
