import express from 'express';
import {
  createBus,
  getMyBuses,
  getBusById,
  updateBus,
  deleteBus,
} from '../controllers/busController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, requireRole('DRIVER'), createBus);
router.get('/my', protect, requireRole('DRIVER'), getMyBuses);
router.get('/:id', protect, getBusById);
router.patch('/:id', protect, requireRole('DRIVER'), updateBus);
router.delete('/:id', protect, requireRole('DRIVER'), deleteBus);

export default router;
