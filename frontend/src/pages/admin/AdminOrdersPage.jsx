import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import { formatCurrency } from '../../utils/formatCurrency';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';

const LIMIT = 20;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

const ORDER_STATUSES = ['processing', 'shipped', 'delivered'];

function shortId(id) {
  return id ? `#${id.slice(-6).toUpperCase()}` : '—';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Detail modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.listAll({ page: currentPage, limit: LIMIT });
      setOrders(res.data?.orders || []);
      setPagination(res.data?.pagination || null);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (page) => {
    setSearchParams({ page });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const viewOrderDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const res = await orderApi.get(orderId);
      setSelectedOrder(res.data?.order || res.data);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No orders found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{shortId(order._id)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{shortId(order.userId?._id || order.userId)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{order.items?.length || 0}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewOrderDetail(order._id)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {order.paymentStatus === 'paid' && order.orderStatus !== 'delivered' && (
                            <select
                              value=""
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              disabled={updatingStatus === order._id}
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              <option value="" disabled>
                                Update…
                              </option>
                              {ORDER_STATUSES.filter((s) => s !== order.orderStatus).map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {(selectedOrder || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            {detailLoading ? (
              <LoadingSpinner />
            ) : (
              selectedOrder && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Order {shortId(selectedOrder._id)}
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="capitalize font-medium">{selectedOrder.orderStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment</span>
                      <span className="capitalize font-medium">{selectedOrder.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                      </span>
                    </div>

                    {selectedOrder.shippingAddress && (
                      <div>
                        <p className="text-gray-500 mb-1">Shipping Address</p>
                        <p className="text-gray-900 text-xs bg-gray-50 rounded-lg p-3">
                          {typeof selectedOrder.shippingAddress === 'string'
                            ? selectedOrder.shippingAddress
                            : Object.values(selectedOrder.shippingAddress).filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-gray-500 mb-2">Items ({selectedOrder.items?.length || 0})</p>
                      <ul className="space-y-2">
                        {selectedOrder.items?.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              {(item.imageUrl || item.image) && (
                                <img
                                  src={item.imageUrl || item.image}
                                  alt=""
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="text-gray-900 text-sm font-medium line-clamp-1">
                                  {item.name || item.productId}
                                </p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
