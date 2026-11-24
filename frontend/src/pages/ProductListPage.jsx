import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import productApi from '../api/productApi';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Name: A → Z', value: 'name' },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Read current filters from URL
  const currentQuery = searchParams.get('q') || '';
  const currentCategories = searchParams.get('category')
    ? searchParams.get('category').split(',')
    : [];
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local filter state (synced to URL on apply)
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [selectedCategories, setSelectedCategories] = useState(currentCategories);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [inStock, setInStock] = useState(currentInStock);
  const [sort, setSort] = useState(currentSort);

  // Build URL params helper
  const buildParams = useCallback(
    (overrides = {}) => {
      const p = new URLSearchParams();
      const q = overrides.q ?? searchInput;
      const cats = overrides.category ?? selectedCategories;
      const mn = overrides.minPrice ?? minPrice;
      const mx = overrides.maxPrice ?? maxPrice;
      const stk = overrides.inStock ?? inStock;
      const s = overrides.sort ?? sort;
      const pg = overrides.page ?? 1;

      if (q) p.set('q', q);
      if (cats.length) p.set('category', cats.join(','));
      if (mn) p.set('minPrice', mn);
      if (mx) p.set('maxPrice', mx);
      if (stk) p.set('inStock', 'true');
      if (s && s !== 'newest') p.set('sort', s);
      if (pg > 1) p.set('page', String(pg));

      return p;
    },
    [searchInput, selectedCategories, minPrice, maxPrice, inStock, sort],
  );

  // Apply filters → update URL
  const applyFilters = (overrides = {}) => {
    setSearchParams(buildParams(overrides));
    setMobileFiltersOpen(false);
  };

  // Fetch products when URL changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: 12,
        };
        if (currentQuery) params.q = currentQuery;
        if (currentCategories.length) params.category = currentCategories.join(',');
        if (currentMinPrice) params.minPrice = currentMinPrice;
        if (currentMaxPrice) params.maxPrice = currentMaxPrice;
        if (currentInStock) params.inStock = true;
        if (currentSort) params.sort = currentSort;

        const data = await productApi.list(params);
        setProducts(data.products);
        setPagination(data.pagination);

        // Fetch all categories once
        if (allCategories.length === 0) {
          try {
            const all = await productApi.list({ limit: 200 });
            const cats = [
              ...new Set(all.products.map((p) => p.category).filter(Boolean)),
            ].sort();
            setAllCategories(cats);
          } catch {
            /* ignore */
          }
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Sync local state when URL changes externally
  useEffect(() => {
    setSearchInput(currentQuery);
    setSelectedCategories(currentCategories);
    setMinPrice(currentMinPrice);
    setMaxPrice(currentMaxPrice);
    setInStock(currentInStock);
    setSort(currentSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? [] : [cat]
    );
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setSort('newest');
    setSearchParams(new URLSearchParams());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({ q: searchInput, page: 1 });
  };

  const hasActiveFilters =
    currentQuery ||
    currentCategories.length > 0 ||
    currentMinPrice ||
    currentMaxPrice ||
    currentInStock;

  /* ---------- Sidebar content (shared desktop/mobile) ---------- */
  const filterSidebar = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Category</h3>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {allCategories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="capitalize">{cat}</span>
            </label>
          ))}
          {allCategories.length === 0 && (
            <p className="text-xs text-gray-400">Loading…</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          In Stock Only
        </label>
      </div>

      {/* Sort */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Sort By</h3>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Apply / Clear */}
      <div className="flex gap-2">
        <button
          onClick={() => applyFilters({ page: 1 })}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>

        {/* Mobile filter toggle */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm text-gray-500">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="relative ml-auto flex w-full max-w-xs flex-col bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              {filterSidebar}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Filters
              </h2>
              {filterSidebar}
            </div>
          </aside>

          {/* Product grid */}
          <main className="flex-1">
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <p className="text-sm text-gray-500">
                {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or search term."
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      onPageChange={(page) => applyFilters({ page })}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
