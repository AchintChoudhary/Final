import test from 'node:test';
import assert from 'node:assert';
import {
  calculateTotalDistance,
  projectPointOnRoute,
  isPointNearRoute,
  calculateRemainingDistanceKm,
} from '../utils/geoUtils.js';
import { calculateETA } from '../services/etaService.js';
import { isValidIndianMobile, isValidPlateNumber, normalizeIndianMobile, normalizePlateNumber } from '../utils/validators.js';

test('Geospatial Utils - calculateTotalDistance along LineString', () => {
  // Line between Indore [75.8577, 22.7196] and Ujjain [75.7873, 23.1765] approx 55 km
  const coords = [
    [75.8577, 22.7196],
    [75.8200, 22.9000],
    [75.7873, 23.1765],
  ];
  const dist = calculateTotalDistance(coords);
  assert.ok(dist > 50 && dist < 65, `Expected distance ~55km, got ${dist}`);
});

test('Geospatial Utils - projectPointOnRoute calculates progress and distance', () => {
  const routeCoords = [
    [75.8577, 22.7196], // Origin: Indore
    [75.8300, 22.9500], // Middle: Sanwer
    [75.7873, 23.1765], // Dest: Ujjain
  ];

  // Point very close to middle
  const passengerPickup = [75.8305, 22.9502];
  const proj = projectPointOnRoute(passengerPickup, routeCoords);

  assert.ok(proj !== null);
  assert.ok(proj.distanceFromRouteMeters < 500, `Expected within 500m, got ${proj.distanceFromRouteMeters}`);
  assert.ok(proj.progressKm > 10, 'Expected progress to be along route');
});

test('Route Matching Logic - Middle-of-Route Bus Discovery & Passed Bus Exclusion', () => {
  const routeCoords = [
    [75.8577, 22.7196], // Origin (km 0)
    [75.8450, 22.8500], // Stop 1 (approx km 15)
    [75.8300, 22.9500], // Stop 2 / Pickup (approx km 28)
    [75.8100, 23.0500], // Stop 3 (approx km 40)
    [75.7873, 23.1765], // Dest (approx km 55)
  ];

  const passengerPickup = [75.8300, 22.9500]; // at Stop 2
  const passengerDest = [75.7873, 23.1765]; // at Final Destination

  const pickupProj = projectPointOnRoute(passengerPickup, routeCoords);
  const destProj = projectPointOnRoute(passengerDest, routeCoords);

  assert.ok(pickupProj.progressKm < destProj.progressKm, 'Pickup must precede destination');

  // Scenario A: Bus is at Stop 1 (km 15) - approaching passenger
  const bus1Progress = 15;
  const isBus1Approaching = bus1Progress < pickupProj.progressKm && pickupProj.progressKm < destProj.progressKm;
  assert.strictEqual(isBus1Approaching, true, 'Bus 1 should be matched as approaching');

  // Scenario B: Bus is at Stop 3 (km 40) - has already passed passenger!
  const bus2Progress = 40;
  const isBus2Approaching = bus2Progress < pickupProj.progressKm;
  assert.strictEqual(isBus2Approaching, false, 'Bus 2 has passed passenger and must be excluded');

  // Scenario C: Reverse direction search (passenger wants to go back towards origin)
  const reverseDestProj = projectPointOnRoute([75.8577, 22.7196], routeCoords);
  const isReverseValid = pickupProj.progressKm < reverseDestProj.progressKm;
  assert.strictEqual(isReverseValid, false, 'Reverse trip must be rejected');
});

test('ETA Service - Calculates approximate ETA and handles arrived state', () => {
  // Bus at 10km, Pickup at 28km, total route 56km, 90 mins duration (~37 km/h)
  const etaApproaching = calculateETA(10, 28, 56, 90);
  assert.strictEqual(etaApproaching.status, 'APPROACHING');
  assert.strictEqual(etaApproaching.remainingDistanceKm, 18);
  assert.ok(etaApproaching.etaMinutes > 20 && etaApproaching.etaMinutes < 40);

  // Bus has passed pickup
  const etaPassed = calculateETA(30, 28, 56, 90);
  assert.strictEqual(etaPassed.status, 'ARRIVED');
  assert.strictEqual(etaPassed.remainingDistanceKm, 0);
  assert.strictEqual(etaPassed.etaMinutes, 0);
});

test('Validators - Mobile and Plate Number verification', () => {
  assert.strictEqual(isValidIndianMobile('9876543210'), true);
  assert.strictEqual(isValidIndianMobile('+91 98765 43210'), true);
  assert.strictEqual(isValidIndianMobile('12345'), false);
  assert.strictEqual(isValidIndianMobile('5876543210'), false); // Starts with 5

  assert.strictEqual(isValidPlateNumber('MP09AB1234'), true);
  assert.strictEqual(isValidPlateNumber('mp-09-ab-1234'), true);
  assert.strictEqual(isValidPlateNumber('DL01C9999'), true);
  assert.strictEqual(isValidPlateNumber('INVALID123'), false);

  assert.strictEqual(normalizeIndianMobile('+91 98765 43210'), '9876543210');
  assert.strictEqual(normalizePlateNumber('mp 09 ab 1234'), 'MP09AB1234');
});
