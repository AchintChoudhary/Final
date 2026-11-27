import { Bus } from '../models/Bus.js';
import { Trip } from '../models/Trip.js';
import { ApiError } from '../utils/apiError.js';
import { isValidPlateNumber, normalizePlateNumber } from '../utils/validators.js';

// Create a new bus (Driver)
export const createBus = async (req, res, next) => {
  try {
    const { busName, plateNumber, startLocation, finalDestination } = req.body;

    if (!busName || !plateNumber) {
      throw new ApiError(400, 'Bus name and plate number are required');
    }

    const cleanPlate = normalizePlateNumber(plateNumber);
    if (!isValidPlateNumber(cleanPlate)) {
      throw new ApiError(400, 'Invalid registration plate number format (e.g., MP09AB1234)');
    }

    const existing = await Bus.findOne({ plateNumber: cleanPlate });
    if (existing) {
      throw new ApiError(409, 'A bus with this plate number is already registered');
    }

    const bus = await Bus.create({
      busName: busName.trim(),
      plateNumber: cleanPlate,
      driverId: req.user._id,
      startLocation: startLocation?.trim() || '',
      finalDestination: finalDestination?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Bus registered successfully',
      bus,
    });
  } catch (error) {
    next(error);
  }
};

// Get buses registered by current driver
export const getMyBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find({ driverId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      buses,
    });
  } catch (error) {
    next(error);
  }
};

// Get single bus details
export const getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('driverId', 'name');
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }
    if (
      req.user.role === 'DRIVER' &&
      (!bus.driverId ||
        (bus.driverId._id
          ? bus.driverId._id.toString() !== req.user._id.toString()
          : bus.driverId.toString() !== req.user._id.toString()))
    ) {
      throw new ApiError(403, 'Unauthorized: You can only view your own bus');
    }
    res.status(200).json({
      success: true,
      bus,
    });
  } catch (error) {
    next(error);
  }
};

// Update bus details (Owner Driver only)
export const updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    if (bus.driverId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Unauthorized: You can only edit your own registered bus');
    }

    const activeTrip = await Trip.findOne({ busId: bus._id, status: 'ACTIVE' });
    if (activeTrip) {
      throw new ApiError(400, 'Bus details cannot be changed while the bus has an active trip');
    }

    const { busName, startLocation, finalDestination, plateNumber } = req.body;

    if (plateNumber && plateNumber !== bus.plateNumber) {
      const cleanPlate = normalizePlateNumber(plateNumber);
      if (!isValidPlateNumber(cleanPlate)) {
        throw new ApiError(400, 'Invalid registration plate format');
      }
      const existing = await Bus.findOne({ plateNumber: cleanPlate, _id: { $ne: bus._id } });
      if (existing) {
        throw new ApiError(409, 'Plate number already registered');
      }
      bus.plateNumber = cleanPlate;
    }

    if (busName) bus.busName = busName.trim();
    if (startLocation !== undefined) bus.startLocation = startLocation.trim();
    if (finalDestination !== undefined) bus.finalDestination = finalDestination.trim();

    await bus.save();

    res.status(200).json({
      success: true,
      message: 'Bus details updated',
      bus,
    });
  } catch (error) {
    next(error);
  }
};

// Delete bus (Owner Driver only)
export const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    if (bus.driverId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Unauthorized: You can only delete your own registered bus');
    }

    // Safeguard: Prevent deleting a bus that currently has an active trip in progress
    const activeTrip = await Trip.findOne({ busId: req.params.id, status: 'ACTIVE' });
    if (activeTrip) {
      throw new ApiError(
        400,
        'Cannot delete a bus that is currently on an active trip. Complete or stop the active trip first.'
      );
    }

    await Bus.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
