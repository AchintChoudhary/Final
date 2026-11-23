import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { TripService } from '../services/tripService.js';
import { isValidCoordinates } from '../utils/validators.js';

export const setupSocketIO = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        socket.user = user;
      }
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    // Passenger joins a trip room
    socket.on('passenger:joinTrip', async ({ tripId }) => {
      if (!tripId) return;
      const room = `trip:${tripId}`;
      socket.join(room);

      try {
        const trip = await Trip.findById(tripId).select(
          'status currentLocation routeProgressKm trackingStatus lastLocationUpdatedAt'
        );
        if (trip) {
          socket.emit('trip:initialState', {
            tripId,
            status: trip.status,
            currentLocation: trip.currentLocation?.coordinates,
            routeProgressKm: trip.routeProgressKm,
            trackingStatus: trip.trackingStatus,
            lastLocationUpdatedAt: trip.lastLocationUpdatedAt,
          });
        }
      } catch (err) {
        console.error(`[Socket] Error fetching initial trip state for ${tripId}:`, err.message);
      }
    });

    // Passenger leaves trip room
    socket.on('passenger:leaveTrip', ({ tripId }) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    // Driver sends live GPS location update
    socket.on('driver:location', async (data) => {
      try {
        const { tripId, latitude, longitude, accuracy, sequence } = data;

        if (!socket.user || socket.user.role !== 'DRIVER') {
          return socket.emit('error', { message: 'Authentication as Driver required to send GPS' });
        }

        if (!tripId || !isValidCoordinates(longitude, latitude)) {
          return socket.emit('error', { message: 'Invalid GPS coordinates or trip ID' });
        }

        // Process location update
        const result = await TripService.updateGpsLocation({
          tripId,
          driverId: socket.user._id,
          latitude,
          longitude,
          accuracy: accuracy || 10,
          sequence: sequence || Date.now(),
        });

        if (result.skipped) {
          return;
        }

        // Broadcast to all passengers tracking this trip
        io.to(`trip:${tripId}`).emit('trip:locationUpdated', {
          tripId,
          coordinates: result.coordinates, // [lng, lat]
          routeProgressKm: result.routeProgressKm,
          trackingStatus: result.trackingStatus,
          lastLocationUpdatedAt: result.lastLocationUpdatedAt,
          accuracy,
        });
      } catch (error) {
        console.error('[Socket driver:location error]', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      // Clean up socket
    });
  });

  // Background watchdog for stale trips
  setInterval(async () => {
    try {
      const staleThreshold = new Date(Date.now() - ENV.GPS_STALE_WARNING_MS);
      const unavailableThreshold = new Date(Date.now() - ENV.GPS_UNAVAILABLE_MS);

      // Find active trips that haven't updated recently
      const staleTrips = await Trip.find({
        status: 'ACTIVE',
        lastLocationUpdatedAt: { $lt: staleThreshold },
        trackingStatus: 'ONLINE',
      });

      for (const trip of staleTrips) {
        trip.trackingStatus = 'STALE';
        await trip.save();
        io.to(`trip:${trip._id}`).emit('trip:trackingUnavailable', {
          tripId: trip._id,
          trackingStatus: 'STALE',
          message: 'GPS signal is delayed or stale',
        });
      }

      const deadTrips = await Trip.find({
        status: 'ACTIVE',
        lastLocationUpdatedAt: { $lt: unavailableThreshold },
        trackingStatus: { $ne: 'UNAVAILABLE' },
      });

      for (const trip of deadTrips) {
        trip.trackingStatus = 'UNAVAILABLE';
        await trip.save();
        io.to(`trip:${trip._id}`).emit('trip:trackingUnavailable', {
          tripId: trip._id,
          trackingStatus: 'UNAVAILABLE',
          message: 'GPS signal unavailable from driver device',
        });
      }
    } catch (err) {
      // quiet catch
    }
  }, 15000);
};
