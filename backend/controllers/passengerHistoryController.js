import { PassengerTrackingHistory } from '../models/PassengerTrackingHistory.js';
import { Trip } from '../models/Trip.js';
import { ApiError } from '../utils/apiError.js';

export const startTrackingHistory = async (req, res, next) => {
  try {
    const {
      tripId,
      pickupName,
      pickupCoordinates,
      destinationName,
      destinationCoordinates,
    } = req.body;

    if (!tripId) throw new ApiError(400, 'Trip ID is required');

    const trip = await Trip.findById(tripId).populate('busId').populate('routeId');
    if (!trip) throw new ApiError(404, 'Trip not found');

    const entry = await PassengerTrackingHistory.findOneAndUpdate(
      { passengerId: req.user._id, tripId },
      {
        $set: {
          busSnapshot: {
            busName: trip.busId?.busName,
            plateNumber: trip.busId?.plateNumber,
          },
          routeSnapshot: {
            name: trip.routeId?.name,
            originName: trip.routeId?.origin?.name,
            destinationName: trip.routeId?.destination?.name,
          },
          pickup: {
            name: pickupName || 'Pickup',
            coordinates: Array.isArray(pickupCoordinates) ? pickupCoordinates : undefined,
          },
          destination: {
            name: destinationName || 'Destination',
            coordinates: Array.isArray(destinationCoordinates) ? destinationCoordinates : undefined,
          },
          lastViewedAt: new Date(),
          finalStatus: trip.status === 'ACTIVE' ? 'TRACKING' : trip.status,
        },
        $setOnInsert: { trackingStartTime: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, history: entry });
  } catch (error) {
    next(error);
  }
};

export const getPassengerTrackingHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      PassengerTrackingHistory.find({ passengerId: req.user._id })
        .sort({ lastViewedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PassengerTrackingHistory.countDocuments({ passengerId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
