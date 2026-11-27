import express from 'express';
import {
  startTrip,
  stopTrip,
  getMyActiveTrip,
  searchBuses,
  getTripById,
  getTripEta,
  getTripHistory,
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateObjectIdParam } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/start', protect, requireRole('DRIVER'), startTrip);
router.post('/:id/stop', protect, requireRole('DRIVER'), validateObjectIdParam('id'), stopTrip);
router.get('/my-active', protect, requireRole('DRIVER'), getMyActiveTrip);
router.get('/history', protect, requireRole('DRIVER'), getTripHistory);
router.get('/search', protect, requireRole('PASSENGER'), searchBuses);
router.get('/:id', protect, validateObjectIdParam('id'), getTripById);
router.get('/:id/eta', protect, validateObjectIdParam('id'), getTripEta);

export default router;
