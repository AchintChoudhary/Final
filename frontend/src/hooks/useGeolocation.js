import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to interface with real browser Geolocation API
 * navigator.geolocation.watchPosition()
 */
export const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    autoStart = false,
  } = options;

  const [location, setLocation] = useState(null); // { latitude, longitude, accuracy, heading, speed, timestamp }
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  // Check permission state if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        })
        .catch(() => {});
    }
  }, []);

  const handleSuccess = (position) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    setLocation({
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      timestamp: position.timestamp,
    });
    setError(null);
    setPermissionState('granted');
  };

  const handleError = (err) => {
    let message = 'Unable to retrieve location';
    if (err.code === 1) {
      message = 'Location permission was denied. Please allow GPS access in your browser.';
      setPermissionState('denied');
    } else if (err.code === 2) {
      message = 'GPS position unavailable. Check device GPS settings.';
    } else if (err.code === 3) {
      message = 'GPS location request timed out.';
    }
    setError(message);
  };

  // Start continuous watching
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) return;

    setIsWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Single one-time location fetch
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        return reject(new Error(msg));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSuccess(pos);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        { enableHighAccuracy, timeout: 15000, maximumAge: 0 }
      );
    });
  }, [enableHighAccuracy]);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, startWatching]);

  return {
    location,
    error,
    permissionState,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
};
