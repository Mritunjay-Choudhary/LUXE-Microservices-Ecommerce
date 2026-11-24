import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        {/* Illustration */}
        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-indigo-50">
          <SearchX className="h-16 w-16 text-indigo-400" />
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-700">
          Page not found
        </p>
        <p className="mx-auto mt-2 max-w-md text-gray-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been moved or no longer exists.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
