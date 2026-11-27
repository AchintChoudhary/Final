import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const useSocket = (tripId = null) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [tripState, setTripState] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('UNKNOWN');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isTripEnded, setIsTripEnded] = useState(false);
  const [gpsAck, setGpsAck] = useState(null);
  const [connectionError, setConnectionError] = useState('');

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

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setConnectionError(err?.message || 'Socket connection failed');
    });

    socket.on('trip:initialState', (state) => {
      if (!tripId || state.tripId !== tripId) return;
      if (state.status === 'COMPLETED' || state.status === 'CANCELLED') {
        setIsTripEnded(true);
        setTrackingStatus('UNAVAILABLE');
        setTripState(state);
        return;
      }
      setTripState(state);
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
      if (!tripId || data.tripId !== tripId) return;
      if (data.coordinates) {
        setLiveLocation(data.coordinates);
      }
      if (data.trackingStatus) {
        setTrackingStatus(data.trackingStatus);
      }
      setLastUpdate(data.lastLocationUpdatedAt || new Date().toISOString());
    });

    socket.on('trip:trackingUnavailable', (data) => {
      if (!tripId || data.tripId !== tripId) return;
      setTrackingStatus(data.trackingStatus || 'UNAVAILABLE');
    });

    socket.on('trip:ended', (data) => {
      if (!tripId || data?.tripId !== tripId) return;
      setIsTripEnded(true);
      setTrackingStatus('UNAVAILABLE');
    });

    socket.on('driver:locationAck', (ack) => {
      if (!tripId || ack?.tripId !== tripId) return;
      setGpsAck(ack);
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
    gpsAck,
    connectionError,
    trackingStatus,
    lastUpdate,
    isTripEnded,
    emitDriverLocation,
  };
};
