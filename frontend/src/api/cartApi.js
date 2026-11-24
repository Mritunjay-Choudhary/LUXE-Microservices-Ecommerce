import api from './client';

const wrap = (promise) =>
  promise.then((res) => {
    const d = res?.data !== undefined ? res.data : res;
    if (d && typeof d === 'object') {
      d.data = d;
    }
    return d;
  });

export const get = () => wrap(api.get('/api/cart'));
export const getCart = get;

export const addItem = (productId, quantity = 1) =>
  wrap(api.post('/api/cart/items', { productId, quantity }));

export const updateItem = (productId, quantity) =>
  wrap(api.patch(`/api/cart/items/${productId}`, { quantity }));

export const removeItem = (productId) =>
  wrap(api.delete(`/api/cart/items/${productId}`));

export const clear = () => wrap(api.delete('/api/cart'));
export const clearCart = clear;

export const cartApi = {
  get,
  getCart,
  addItem,
  updateItem,
  removeItem,
  clear,
  clearCart,
};

export default cartApi;
