import api from './client';

const wrap = (promise) =>
  promise.then((res) => {
    const d = res?.data !== undefined ? res.data : res;
    if (d && typeof d === 'object') {
      d.data = d;
    }
    return d;
  });

export const getProductReviews = (productId, params) =>
  wrap(api.get(`/api/review/products/${productId}`, { params }));

export const create = (data) => wrap(api.post('/api/review', data));
export const createReview = create;

export const update = (id, data) => wrap(api.patch(`/api/review/${id}`, data));
export const updateReview = update;

export const deleteReview = (id) => wrap(api.delete(`/api/review/${id}`));
export { deleteReview as delete };

export const reviewApi = {
  getProductReviews,
  create,
  createReview,
  update,
  updateReview,
  delete: deleteReview,
  deleteReview,
};

export default reviewApi;
