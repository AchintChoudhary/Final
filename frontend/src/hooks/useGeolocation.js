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
    maxAccuracyMeters = 100,
  } = options;

  const [location, setLocation] = useState(null); // { latitude, longitude, accuracy, heading, speed, timestamp }
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);
  const fallbackWatchRef = useRef(false);

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
    if (
      typeof accuracy !== 'number' ||
      !Number.isFinite(accuracy) ||
      accuracy > maxAccuracyMeters
    ) {
      setError(
        typeof accuracy === 'number'
          ? `GPS accuracy is too low (${Math.round(accuracy)} m). Move to an open area or wait for a better fix.`
          : 'GPS fix did not include an accuracy measurement.'
      );
      return;
    }
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
    if (!window.isSecureContext) {
      message = 'Location access requires HTTPS or localhost.';
    }
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
      (err) => {
        handleError(err);
        if (
          err.code === 3 &&
          enableHighAccuracy &&
          !fallbackWatchRef.current &&
          watchIdRef.current !== null
        ) {
          fallbackWatchRef.current = true;
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            { enableHighAccuracy: false, timeout: timeout * 2, maximumAge }
          );
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    fallbackWatchRef.current = false;
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
      const acquire = (highAccuracy) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const accuracy = pos.coords.accuracy;
            if (
              typeof accuracy !== 'number' ||
              !Number.isFinite(accuracy) ||
              accuracy > maxAccuracyMeters
            ) {
              const msg =
                typeof accuracy === 'number'
                  ? `GPS accuracy is too low (${Math.round(accuracy)} m).`
                  : 'GPS fix did not include an accuracy measurement.';
              setError(msg);
              reject(new Error(msg));
              return;
            }
            handleSuccess(pos);
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            if (highAccuracy && err.code !== 1 && enableHighAccuracy) {
              acquire(false);
              return;
            }
            handleError(err);
            reject(err);
          },
          { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 15000 : timeout * 2, maximumAge: 0 }
        );
      };
      acquire(enableHighAccuracy);
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
