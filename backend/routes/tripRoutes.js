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

const router = express.Router();

router.post('/start', protect, requireRole('DRIVER'), startTrip);
router.post('/:id/stop', protect, requireRole('DRIVER'), stopTrip);
router.get('/my-active', protect, requireRole('DRIVER'), getMyActiveTrip);
router.get('/history', protect, requireRole('DRIVER'), getTripHistory);
router.get('/search', searchBuses);
router.get('/:id', getTripById);
router.get('/:id/eta', getTripEta);

export default router;
