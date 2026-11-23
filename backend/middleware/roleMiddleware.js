import { ApiError } from '../utils/apiError.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Requires one of roles: [${roles.join(', ')}]`)
      );
    }
    next();
  };
};
