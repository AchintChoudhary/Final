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
import { validateObjectIdParam } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/', protect, requireRole('DRIVER'), createBus);
router.get('/my', protect, requireRole('DRIVER'), getMyBuses);
router.get('/:id', protect, validateObjectIdParam('id'), getBusById);
router.patch('/:id', protect, requireRole('DRIVER'), validateObjectIdParam('id'), updateBus);
router.delete('/:id', protect, requireRole('DRIVER'), validateObjectIdParam('id'), deleteBus);

export default router;
