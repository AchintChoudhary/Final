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

const router = express.Router();

router.get('/autocomplete', autocomplete);
router.get('/preview', previewRoute);
router.post('/', protect, requireRole('DRIVER', 'ADMIN'), createRoute);
router.get('/:id', getRouteById);
router.get('/', getAllRoutes);

export default router;
