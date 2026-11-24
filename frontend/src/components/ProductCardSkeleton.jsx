const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      {/* Details Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-full" />

        {/* Name */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Brand */}
        <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />

        {/* Rating */}
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-3.5 w-3.5 bg-gray-200 animate-pulse rounded"
            />
          ))}
        </div>

        {/* Price */}
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />

        {/* Stock */}
        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
