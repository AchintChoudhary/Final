import express from 'express';
import {
  getDashboardStats,
  getAllBuses,
  getAllDrivers,
  getAllPassengers,
  getActiveTrips,
  verifyBus,
  assignDriver,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/buses', getAllBuses);
router.get('/drivers', getAllDrivers);
router.get('/passengers', getAllPassengers);
router.get('/trips/active', getActiveTrips);
router.patch('/buses/:id/verify', verifyBus);
router.patch('/buses/:id/assign', assignDriver);

export default router;
