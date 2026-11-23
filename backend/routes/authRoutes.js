import express from 'express';
import {
  driverSignup,
  passengerSignup,
  login,
  adminLogin,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/driver/signup', driverSignup);
router.post('/passenger/signup', passengerSignup);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);

export default router;
