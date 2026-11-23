import api from './api';

export const busService = {
  createBus: async (busData) => {
    const res = await api.post('/buses', busData);
    return res.data;
  },

  getMyBuses: async () => {
    const res = await api.get('/buses/my');
    return res.data;
  },

  getBusById: async (id) => {
    const res = await api.get(`/buses/${id}`);
    return res.data;
  },

  updateBus: async (id, data) => {
    const res = await api.patch(`/buses/${id}`, data);
    return res.data;
  },

  deleteBus: async (id) => {
    const res = await api.delete(`/buses/${id}`);
    return res.data;
  },
};
