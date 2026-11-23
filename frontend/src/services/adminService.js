import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getAllBuses: async () => {
    const res = await api.get('/admin/buses');
    return res.data;
  },

  getAllDrivers: async () => {
    const res = await api.get('/admin/drivers');
    return res.data;
  },

  getAllPassengers: async () => {
    const res = await api.get('/admin/passengers');
    return res.data;
  },

  getActiveTrips: async () => {
    const res = await api.get('/admin/trips/active');
    return res.data;
  },

  verifyBus: async (busId, status) => {
    const res = await api.patch(`/admin/buses/${busId}/verify`, { status });
    return res.data;
  },

  assignDriver: async (busId, driverId) => {
    const res = await api.patch(`/admin/buses/${busId}/assign`, { driverId });
    return res.data;
  },
};
