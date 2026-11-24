import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productRes, orderRes] = await Promise.all([
          productApi.list({ limit: 1 }),
          orderApi.listAll({ limit: 1 }),
        ]);

        const totalProducts = productRes.data?.pagination?.total || 0;
        const totalOrders = orderRes.data?.pagination?.total || 0;

        // Derive pending/paid from order list metadata if available,
        // otherwise we approximate from the first-page data.
        const orders = orderRes.data?.orders || [];
        let pendingOrders = 0;
        let paidOrders = 0;
        orders.forEach((o) => {
          if (o.orderStatus === 'pending_payment' || o.orderStatus === 'pending') pendingOrders++;
          if (o.paymentStatus === 'paid' || o.orderStatus === 'paid') paidOrders++;
        });

        setStats({ totalProducts, totalOrders, pendingOrders, paidOrders });
      } catch {
        // silent – stats are non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-indigo-500',
      link: '/admin/orders',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/orders',
    },
    {
      label: 'Paid Orders',
      value: stats.paidOrders,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/admin/orders',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500">
          Welcome back! Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`${card.color} text-white p-3 rounded-xl`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/products"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Manage Products</span>
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">Manage Orders</span>
          </Link>
          <Link
            to="/admin/reviews"
            className="flex items-center gap-3 p-4 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Manage Reviews</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
