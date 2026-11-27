import api from './api';

export const tripService = {
  startTrip: async (tripData) => {
    const res = await api.post('/trips/start', tripData);
    return res.data;
  },

  stopTrip: async (tripId) => {
    const res = await api.post(`/trips/${tripId}/stop`);
    return res.data;
  },

  getMyActiveTrip: async () => {
    const res = await api.get('/trips/my-active');
    return res.data;
  },

  searchBuses: async (params) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/trips/search?${query}`);
    return res.data;
  },

  getTripById: async (id) => {
    const res = await api.get(`/trips/${id}`);
    return res.data;
  },

  getTripEta: async (id, pickupCoords) => {
    let url = `/trips/${id}/eta`;
    if (pickupCoords) {
      url += `?pickupLng=${pickupCoords[0]}&pickupLat=${pickupCoords[1]}`;
    }
    const res = await api.get(url);
    return res.data;
  },

  getTripHistory: async () => {
    const res = await api.get('/trips/history');
    return res.data;
  },

  getPassengerHistory: async () => {
    const res = await api.get('/passenger-history');
    return res.data;
  },

  startTrackingHistory: async (data) => {
    const res = await api.post('/passenger-history/tracking', data);
    return res.data;
  },
};
