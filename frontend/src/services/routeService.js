import api from './api';

export const routeService = {
  autocomplete: async (text) => {
    const res = await api.get(`/routes/autocomplete?text=${encodeURIComponent(text)}`);
    return res.data;
  },

  previewRoute: async (origin, destination) => {
    const res = await api.get(
      `/routes/preview?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    return res.data;
  },

  createRoute: async (routeData) => {
    const res = await api.post('/routes', routeData);
    return res.data;
  },

  getRouteById: async (id) => {
    const res = await api.get(`/routes/${id}`);
    return res.data;
  },

  getAllRoutes: async () => {
    const res = await api.get('/routes');
    return res.data;
  },
};
