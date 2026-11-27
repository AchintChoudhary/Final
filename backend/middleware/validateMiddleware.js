import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';
import mongoose from 'mongoose';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`).join(', ');
    return next(new ApiError(400, errorMessages));
  }
  next();
};

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[paramName])) {
    return next(new ApiError(400, `Invalid ${paramName}`));
  }
  next();
};
