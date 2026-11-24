import api from './client';

const wrap = (promise) =>
  promise.then((res) => {
    const d = res?.data !== undefined ? res.data : res;
    if (d && typeof d === 'object') {
      d.data = d;
    }
    return d;
  });

export const list = (params) => wrap(api.get('/api/product', { params }));
export const getProducts = list;

export const get = (id) => wrap(api.get(`/api/product/${id}`));
export const getById = get;
export const getProduct = get;

export const create = (formData) => wrap(api.post('/api/product', formData));
export const createProduct = create;

export const update = (id, formData) =>
  wrap(api.patch(`/api/product/${id}`, formData));
export const updateProduct = update;

export const deleteProduct = (id) => wrap(api.delete(`/api/product/${id}`));
export { deleteProduct as delete };

export const productApi = {
  list,
  getProducts,
  get,
  getById,
  getProduct,
  create,
  createProduct,
  update,
  updateProduct,
  delete: deleteProduct,
  deleteProduct,
};

export default productApi;
