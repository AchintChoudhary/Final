import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
  {
    busName: {
      type: String,
      required: [true, 'Bus name is required'],
      trim: true,
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startLocation: {
      type: String,
      trim: true,
    },
    finalDestination: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Bus = mongoose.model('Bus', busSchema);
