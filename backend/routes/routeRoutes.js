import express from 'express';
import {
  autocomplete,
  previewRoute,
  createRoute,
  getRouteById,
  getAllRoutes,
} from '../controllers/routeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateObjectIdParam } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.get('/autocomplete', protect, requireRole('DRIVER'), autocomplete);
router.get('/preview', protect, requireRole('DRIVER'), previewRoute);
router.post('/', protect, requireRole('DRIVER'), createRoute);
router.get('/:id', protect, validateObjectIdParam('id'), getRouteById);
router.get('/', protect, getAllRoutes);

export default router;
