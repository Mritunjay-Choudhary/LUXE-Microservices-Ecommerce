import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Minus,
  Plus,
  Star,
  ChevronRight,
  Package,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import productApi from '../api/productApi';
import reviewApi from '../api/reviewApi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { getApiError } from '../utils/getApiError';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ pages: 1 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productApi.getById(id);
        setProduct(data.product);
      } catch {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch reviews
  const fetchReviews = async (page = 1) => {
    setLoadingReviews(true);
    try {
      const data = await reviewApi.getProductReviews(id, { page, limit: 10 });
      setReviews(data.reviews);
      setReviewSummary(data.summary);
      setReviewPagination(data.pagination);
      setReviewPage(page);
    } catch {
      /* ignore */
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product._id, quantity);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewApi.create({ productId: id, rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewComment('');
      fetchReviews(1);
    } catch (err) {
      const msg = getApiError(err);
      if (err?.response?.status === 409) {
        toast.error('You have already reviewed this product');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Package className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
        <Link to="/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const images = product.images?.length ? product.images : [{ url: '/placeholder.png' }];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/products" className="hover:text-gray-700">Products</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-gray-900">{product.name}</span>
        </nav>

        {/* Product section */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="mb-4 aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="h-full w-full object-contain p-4"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      idx === selectedImage
                        ? 'border-indigo-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            {/* Category & Brand */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {product.category}
                </span>
              )}
              {product.brand && (
                <span className="text-sm text-gray-500">by {product.brand}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>

            {/* Rating summary */}
            {reviewSummary.totalReviews > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <StarRating rating={reviewSummary.averageRating} />
                <span className="text-sm text-gray-500">
                  ({reviewSummary.totalReviews} review
                  {reviewSummary.totalReviews !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {formatCurrency(product.price)}
            </p>

            {/* Stock */}
            <div className="mt-4 flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    In Stock ({product.stock} available)
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Description</h3>
              <p className="leading-relaxed text-gray-600">{product.description}</p>
            </div>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="p-2.5 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {addingToCart ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            Customer Reviews
            {reviewSummary.totalReviews > 0 && (
              <span className="ml-2 text-base font-normal text-gray-500">
                ({reviewSummary.averageRating.toFixed(1)} avg · {reviewSummary.totalReviews} review
                {reviewSummary.totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </h2>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Review form */}
            <div className="lg:col-span-1">
              {user ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Your Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="transition-colors"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="review-comment"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Your Review
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience…"
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview || !reviewRating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingReview ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit Review
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Sign in
                    </Link>{' '}
                    to leave a review.
                  </p>
                </div>
              )}
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-2">
              {loadingReviews ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
                  <Star className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No reviews yet. Be the first to review this product!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="rounded-xl border border-gray-200 bg-white p-5"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm leading-relaxed text-gray-600">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Review pagination */}
                  {reviewPagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {Array.from({ length: reviewPagination.pages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => fetchReviews(i + 1)}
                          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                            reviewPage === i + 1
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
