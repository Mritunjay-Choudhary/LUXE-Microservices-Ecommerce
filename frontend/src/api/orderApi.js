import api from './client';

const wrap = (promise) =>
  promise.then((res) => {
    const d = res?.data !== undefined ? res.data : res;
    if (d && typeof d === 'object') {
      d.data = d;
    }
    return d;
  });

export const create = (data) => {
  const shippingAddress = data?.shippingAddress || data;
  return wrap(api.post('/api/order', { shippingAddress }));
};
export const createOrder = create;

export const list = (params) => wrap(api.get('/api/order', { params }));
export const getMyOrders = list;

export const listAll = (params) =>
  wrap(api.get('/api/order', { params: { ...params, all: 'true' } }));
export const getAllOrders = listAll;

export const get = (id) => wrap(api.get(`/api/order/${id}`));
export const getById = get;
export const getOrder = get;

export const verifyPayment = (id, paymentData) =>
  wrap(api.post(`/api/order/${id}/payment/verify`, paymentData));

export const cancel = (id) => wrap(api.post(`/api/order/${id}/cancel`));
export const cancelOrder = cancel;

export const updateStatus = (id, status) =>
  wrap(api.patch(`/api/order/${id}/status`, { status }));

export const orderApi = {
  create,
  createOrder,
  list,
  getMyOrders,
  listAll,
  getAllOrders,
  get,
  getById,
  getOrder,
  verifyPayment,
  cancel,
  cancelOrder,
  updateStatus,
};

export default orderApi;
