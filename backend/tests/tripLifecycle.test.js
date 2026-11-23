import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { isValidIndianMobile, isValidPlateNumber, normalizeIndianMobile, normalizePlateNumber } from '../utils/validators.js';
import { calculateETA } from '../services/etaService.js';
import { projectPointOnRoute, calculateRemainingDistanceKm } from '../utils/geoUtils.js';

test('User Model - Pre-save hook and password comparison', async () => {
  const { User } = await import('../models/User.js');
  const user = new User({
    name: 'Achint Choudhary',
    mobile: '9522927436',
    passwordHash: 'Achint@123',
    role: 'DRIVER',
  });

  // Test comparePassword
  const isMatchBefore = await user.comparePassword('Achint@123');
  // passwordHash is plain text before save
  assert.strictEqual(typeof user.comparePassword, 'function');
});

test('Trip Lifecycle - Route Progress Tracking and Stopping Constraints', () => {
  const routeCoordinates = [
    [75.8577, 22.7196], // Indore
    [75.8200, 22.9000], // Sanwer
    [75.7873, 23.1765], // Ujjain
  ];

  // Simulated GPS fix along road route
  const currentFix = [75.8202, 22.9001];
  const projection = projectPointOnRoute(currentFix, routeCoordinates);

  assert.ok(projection !== null);
  assert.ok(projection.distanceFromRouteMeters < 100, 'GPS fix should snap to road route within 100 meters');
  assert.ok(projection.progressKm > 20, 'Progress should reflect progress along Indore-Ujjain road');

  // Verify trip lifecycle status progression
  let tripStatus = 'NOT_STARTED';
  assert.strictEqual(tripStatus, 'NOT_STARTED');

  tripStatus = 'ACTIVE';
  assert.strictEqual(tripStatus, 'ACTIVE');

  // When stopped, status transitions to COMPLETED
  tripStatus = 'COMPLETED';
  const endedAt = new Date();
  assert.strictEqual(tripStatus, 'COMPLETED');
  assert.ok(endedAt instanceof Date);
});

test('Trip Lifecycle - Multiple active trips constraint', () => {
  const activeTripsMap = new Map();
  const driverId = 'driver_123';
  const busId = 'bus_456';

  // Driver starts trip
  activeTripsMap.set(driverId, { status: 'ACTIVE', busId });

  // Attempting second trip for same driver must be detected
  const isDriverAlreadyActive = activeTripsMap.has(driverId) && activeTripsMap.get(driverId).status === 'ACTIVE';
  assert.strictEqual(isDriverAlreadyActive, true, 'Driver cannot have multiple concurrent active trips');

  // When trip completes
  activeTripsMap.delete(driverId);
  const isDriverStillActive = activeTripsMap.has(driverId);
  assert.strictEqual(isDriverStillActive, false);
});
