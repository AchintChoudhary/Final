import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    stopId: { type: String, required: true },
    name: { type: String, required: true },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    progressKm: { type: Number, default: 0 },
    pickupAllowed: { type: Boolean, default: true },
    dropOffAllowed: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    origin: {
      name: { type: String, required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    destination: {
      name: { type: String, required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    geometry: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
        required: true,
      },
      coordinates: {
        type: [[Number]], // [[lng, lat], [lng, lat], ...]
        required: true,
      },
    },
    totalDistanceKm: {
      type: Number,
      required: true,
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
    },
    stops: [stopSchema],
    pickupPolicy: {
      type: String,
      enum: ['FIXED', 'FLEXIBLE', 'BOTH'],
      default: 'BOTH',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ geometry: '2dsphere' });

export const Route = mongoose.model('Route', routeSchema);
