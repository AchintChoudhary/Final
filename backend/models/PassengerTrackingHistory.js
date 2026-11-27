import mongoose from 'mongoose';

const passengerTrackingHistorySchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    busSnapshot: {
      busName: String,
      plateNumber: String,
    },
    routeSnapshot: {
      name: String,
      originName: String,
      destinationName: String,
    },
    pickup: {
      name: String,
      coordinates: { type: [Number], default: undefined },
    },
    destination: {
      name: String,
      coordinates: { type: [Number], default: undefined },
    },
    trackingStartTime: {
      type: Date,
      default: Date.now,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
    finalStatus: {
      type: String,
      enum: ['TRACKING', 'COMPLETED', 'CANCELLED'],
      default: 'TRACKING',
    },
  },
  { timestamps: true }
);

passengerTrackingHistorySchema.index({ passengerId: 1, tripId: 1 }, { unique: true });

export const PassengerTrackingHistory = mongoose.model(
  'PassengerTrackingHistory',
  passengerTrackingHistorySchema
);
