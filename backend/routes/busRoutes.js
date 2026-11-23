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

router.post('/', protect, requireRole('DRIVER', 'ADMIN'), createBus);
router.get('/my', protect, requireRole('DRIVER', 'ADMIN'), getMyBuses);
router.get('/:id', protect, getBusById);
router.patch('/:id', protect, requireRole('DRIVER', 'ADMIN'), updateBus);
router.delete('/:id', protect, requireRole('DRIVER', 'ADMIN'), deleteBus);

export default router;
