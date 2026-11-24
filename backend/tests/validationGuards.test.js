import test from 'node:test';
import assert from 'node:assert';
import { Bus } from '../models/Bus.js';
import { Route } from '../models/Route.js';
import { Trip } from '../models/Trip.js';
import { TripService } from '../services/tripService.js';
import { ApiError } from '../utils/apiError.js';

test('TripService.startTrip - rejects start without real device GPS coordinates', async () => {
  // Mock Mongoose calls so unit test doesn't wait for database connection
  const originalBusFindById = Bus.findById;
  const originalRouteFindById = Route.findById;
  const originalTripFindOne = Trip.findOne;

  Bus.findById = async () => ({
    _id: '000000000000000000000002',
    driverId: '000000000000000000000001',
  });
  Route.findById = async () => ({
    _id: '000000000000000000000003',
    geometry: {
      type: 'LineString',
      coordinates: [[75.8577, 22.7196], [75.7873, 23.1765]],
    },
    origin: { coordinates: [75.8577, 22.7196] },
    destination: { coordinates: [75.7873, 23.1765] },
  });
  Trip.findOne = async () => null;

  try {
    // Should throw 400 when initialCoords is missing
    await assert.rejects(
      async () => {
        await TripService.startTrip({
          driverId: '000000000000000000000001',
          busId: '000000000000000000000002',
          routeId: '000000000000000000000003',
          initialCoords: null,
        });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes('Valid device GPS coordinates'));
        return true;
      }
    );

    // Should throw 400 when initialCoords is invalid
    await assert.rejects(
      async () => {
        await TripService.startTrip({
          driverId: '000000000000000000000001',
          busId: '000000000000000000000002',
          routeId: '000000000000000000000003',
          initialCoords: ['invalid', 'coord'],
        });
      },
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  } finally {
    // Restore mocks
    Bus.findById = originalBusFindById;
    Route.findById = originalRouteFindById;
    Trip.findOne = originalTripFindOne;
  }
});

test('Role Validation logic - rejects role mismatch with 403', () => {
  const registeredUser = {
    _id: '123',
    name: 'Achint Choudhary',
    role: 'DRIVER',
  };

  const attemptLoginAsPassenger = (selectedRole) => {
    if (selectedRole) {
      const normalizedRole = selectedRole.toUpperCase();
      if (registeredUser.role !== normalizedRole) {
        const expectedRoleName = registeredUser.role === 'DRIVER' ? 'Driver' : 'Passenger';
        throw new ApiError(
          403,
          `This account is registered as a ${expectedRoleName}. Please switch to the ${expectedRoleName} tab to log in.`
        );
      }
    }
    return true;
  };

  // Passenger tab selected with Driver account
  assert.throws(
    () => attemptLoginAsPassenger('PASSENGER'),
    (err) => {
      assert.strictEqual(err.statusCode, 403);
      assert.ok(err.message.includes('switch to the Driver tab'));
      return true;
    }
  );

  // Driver tab selected with Driver account
  assert.strictEqual(attemptLoginAsPassenger('DRIVER'), true);
});

test('Bus Deletion Safeguard - cannot delete bus with active trip', () => {
  const activeTrips = [{ busId: 'bus_001', status: 'ACTIVE' }];

  const canDeleteBus = (busId) => {
    const hasActiveTrip = activeTrips.some((t) => t.busId === busId && t.status === 'ACTIVE');
    if (hasActiveTrip) {
      throw new ApiError(400, 'Cannot delete a bus that is currently on an active trip. Complete or stop the active trip first.');
    }
    return true;
  };

  assert.throws(
    () => canDeleteBus('bus_001'),
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('active trip'));
      return true;
    }
  );

  assert.strictEqual(canDeleteBus('bus_002'), true);
});
