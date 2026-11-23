import mongoose from 'mongoose';

const authorizedStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    collegeEmail: {
      type: String,
      required: [true, 'College email is required'],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    authorizationStatus: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'REVOKED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const AuthorizedStudent = mongoose.model('AuthorizedStudent', authorizedStudentSchema);
