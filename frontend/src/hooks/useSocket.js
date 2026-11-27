import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const useSocket = (tripId = null) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [tripState, setTripState] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('ONLINE');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isTripEnded, setIsTripEnded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (tripId && savedUser?.role === 'PASSENGER') {
        socket.emit('passenger:joinTrip', { tripId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('trip:initialState', (state) => {
      setTripState(state);
      if (state.status === 'COMPLETED' || state.status === 'CANCELLED') {
        setIsTripEnded(true);
        setTrackingStatus('UNAVAILABLE');
      }
      if (state.currentLocation) {
        setLiveLocation(state.currentLocation);
      }
      if (state.trackingStatus) {
        setTrackingStatus(state.trackingStatus);
      }
      if (state.lastLocationUpdatedAt) {
        setLastUpdate(state.lastLocationUpdatedAt);
      }
    });

    socket.on('trip:locationUpdated', (data) => {
      if (data.coordinates) {
        setLiveLocation(data.coordinates);
      }
      if (data.trackingStatus) {
        setTrackingStatus(data.trackingStatus);
      }
      setLastUpdate(data.lastLocationUpdatedAt || new Date().toISOString());
    });

    socket.on('trip:trackingUnavailable', (data) => {
      setTrackingStatus(data.trackingStatus || 'UNAVAILABLE');
    });

    socket.on('trip:ended', () => {
      setIsTripEnded(true);
      setTrackingStatus('UNAVAILABLE');
    });

    return () => {
      if (tripId) {
        socket.emit('passenger:leaveTrip', { tripId });
      }
      socket.disconnect();
    };
  }, [tripId]);

  // Driver send location update
  const emitDriverLocation = useCallback(
    (locationData) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('driver:location', locationData);
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    liveLocation,
    tripState,
    trackingStatus,
    lastUpdate,
    isTripEnded,
    emitDriverLocation,
  };
};
