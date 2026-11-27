import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getPassengerTrackingHistory,
  startTrackingHistory,
} from '../controllers/passengerHistoryController.js';

const router = express.Router();

router.get('/', protect, requireRole('PASSENGER'), getPassengerTrackingHistory);
router.post('/tracking', protect, requireRole('PASSENGER'), startTrackingHistory);

export default router;
