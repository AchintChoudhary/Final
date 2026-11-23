import api from './api';

export const authService = {
  driverSignup: async (data) => {
    const res = await api.post('/auth/driver/signup', data);
    return res.data;
  },

  passengerSignup: async (data) => {
    const res = await api.post('/auth/passenger/signup', data);
    return res.data;
  },

  login: async (mobile, password) => {
    const res = await api.post('/auth/login', { mobile, password });
    return res.data;
  },

  adminLogin: async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
