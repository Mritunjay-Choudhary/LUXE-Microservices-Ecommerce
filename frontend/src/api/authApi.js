import api from './client';

const wrap = (promise) =>
  promise.then((res) => {
    const d = res?.data !== undefined ? res.data : res;
    if (d && typeof d === 'object') {
      d.data = d;
    }
    return d;
  });

export const register = (data) => wrap(api.post('/api/auth/register', data));
export const login = (data) => wrap(api.post('/api/auth/login', data));
export const logout = () => wrap(api.post('/api/auth/logout'));
export const refresh = (refreshToken) =>
  wrap(api.post('/api/auth/refresh', { refreshToken }));
export const getMe = () => wrap(api.get('/api/auth/me'));

export const authApi = {
  register,
  login,
  logout,
  refresh,
  getMe,
};

export default authApi;
