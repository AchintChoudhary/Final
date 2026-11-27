import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'NOT_STARTED',
      index: true,
    },
    pickupPolicy: {
      type: String,
      enum: ['FIXED', 'FLEXIBLE', 'BOTH'],
      default: 'BOTH',
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },
    lastLocationUpdatedAt: {
      type: Date,
    },
    lastGpsMeasuredAt: {
      type: Date,
    },
    routeProgressKm: {
      type: Number,
      default: 0,
    },
    trackingStatus: {
      type: String,
      enum: ['CONNECTING', 'UNKNOWN', 'ONLINE', 'STALE', 'UNAVAILABLE'],
      default: 'CONNECTING',
    },
    lastGpsAccuracyMeters: {
      type: Number,
    },
    lastSequenceNumber: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ currentLocation: '2dsphere' });
tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ busId: 1, status: 1 });
tripSchema.index(
  { driverId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'unique_active_driver_trip' }
);
tripSchema.index(
  { busId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'unique_active_bus_trip' }
);

export const Trip = mongoose.model('Trip', tripSchema);
