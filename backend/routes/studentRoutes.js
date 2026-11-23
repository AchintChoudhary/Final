import express from 'express';
import {
  getStudents,
  addStudent,
  updateStudentStatus,
  importStudentsCsv,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/', getStudents);
router.post('/', addStudent);
router.patch('/:id/status', updateStudentStatus);
router.post('/import', importStudentsCsv);

export default router;
