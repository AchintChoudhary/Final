import { AuthorizedStudent } from '../models/AuthorizedStudent.js';
import { ApiError } from '../utils/apiError.js';

// Get authorized students list
export const getStudents = async (req, res, next) => {
  try {
    const students = await AuthorizedStudent.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// Add a student
export const addStudent = async (req, res, next) => {
  try {
    const { studentId, name, collegeEmail, mobile } = req.body;

    if (!studentId || !name || !collegeEmail) {
      throw new ApiError(400, 'Student ID, Name, and College Email are required');
    }

    const existing = await AuthorizedStudent.findOne({ studentId });
    if (existing) {
      throw new ApiError(409, 'Student ID already registered');
    }

    const student = await AuthorizedStudent.create({
      studentId: studentId.trim(),
      name: name.trim(),
      collegeEmail: collegeEmail.toLowerCase().trim(),
      mobile: mobile?.trim() || '',
      authorizationStatus: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Student authorized successfully',
      student,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle or update student authorization status
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'PENDING', 'REVOKED'].includes(status)) {
      throw new ApiError(400, 'Invalid authorization status');
    }

    const student = await AuthorizedStudent.findByIdAndUpdate(
      req.params.id,
      { authorizationStatus: status },
      { new: true }
    );

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    res.status(200).json({
      success: true,
      message: `Student status updated to ${status}`,
      student,
    });
  } catch (error) {
    next(error);
  }
};

// Import students from CSV data (parsed rows)
export const importStudentsCsv = async (req, res, next) => {
  try {
    const { students } = req.body; // Expecting array of { studentId, name, collegeEmail, mobile }

    if (!students || !Array.isArray(students) || students.length === 0) {
      throw new ApiError(400, 'No student records provided for import');
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of students) {
      if (!item.studentId || !item.name || !item.collegeEmail) {
        skippedCount++;
        continue;
      }
      try {
        await AuthorizedStudent.updateOne(
          { studentId: item.studentId.trim() },
          {
            $set: {
              name: item.name.trim(),
              collegeEmail: item.collegeEmail.toLowerCase().trim(),
              mobile: item.mobile?.trim() || '',
              authorizationStatus: 'ACTIVE',
            },
          },
          { upsert: true }
        );
        insertedCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed CSV: ${insertedCount} imported/updated, ${skippedCount} skipped.`,
      insertedCount,
      skippedCount,
    });
  } catch (error) {
    next(error);
  }
};
