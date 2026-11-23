import { Bus } from '../models/Bus.js';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { Route } from '../models/Route.js';
import { AuthorizedStudent } from '../models/AuthorizedStudent.js';
import { ApiError } from '../utils/apiError.js';

// Admin Dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalBuses, totalDrivers, totalPassengers, totalStudents, activeTrips] =
      await Promise.all([
        Bus.countDocuments(),
        User.countDocuments({ role: 'DRIVER' }),
        User.countDocuments({ role: 'PASSENGER' }),
        AuthorizedStudent.countDocuments(),
        Trip.countDocuments({ status: 'ACTIVE' }),
      ]);

    const recentActiveTrips = await Trip.find({ status: 'ACTIVE' })
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile')
      .sort({ startedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalBuses,
        totalDrivers,
        totalPassengers,
        totalStudents,
        activeTrips,
      },
      recentActiveTrips,
    });
  } catch (error) {
    next(error);
  }
};

// Get all buses (Admin table)
export const getAllBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find()
      .populate('driverId', 'name mobile')
      .populate('assignedDriver', 'name mobile')
      .sort({ createdAt: -1 });

    // Attach active trip status for each bus
    const activeTrips = await Trip.find({ status: 'ACTIVE' });
    const activeBusIds = new Set(activeTrips.map((t) => t.busId.toString()));

    const enrichedBuses = buses.map((bus) => ({
      ...bus.toObject(),
      isActiveTrip: activeBusIds.has(bus._id.toString()),
    }));

    res.status(200).json({
      success: true,
      buses: enrichedBuses,
    });
  } catch (error) {
    next(error);
  }
};

// Get all drivers
export const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'DRIVER' }).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      drivers,
    });
  } catch (error) {
    next(error);
  }
};

// Get all passengers
export const getAllPassengers = async (req, res, next) => {
  try {
    const passengers = await User.find({ role: 'PASSENGER' }).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      passengers,
    });
  } catch (error) {
    next(error);
  }
};

// Get all currently active trips for Admin Live Map
export const getActiveTrips = async (req, res, next) => {
  try {
    const activeTrips = await Trip.find({ status: 'ACTIVE' })
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile');

    res.status(200).json({
      success: true,
      trips: activeTrips,
    });
  } catch (error) {
    next(error);
  }
};

// Update bus verification status
export const verifyBus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid verification status');
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    );

    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    res.status(200).json({
      success: true,
      message: `Bus verification status updated to ${status}`,
      bus,
    });
  } catch (error) {
    next(error);
  }
};

// Assign driver to bus
export const assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    if (driverId) {
      const driver = await User.findOne({ _id: driverId, role: 'DRIVER' });
      if (!driver) {
        throw new ApiError(404, 'Driver not found');
      }
      bus.assignedDriver = driver._id;
    } else {
      bus.assignedDriver = undefined;
    }

    await bus.save();

    res.status(200).json({
      success: true,
      message: 'Driver assignment updated',
      bus,
    });
  } catch (error) {
    next(error);
  }
};
