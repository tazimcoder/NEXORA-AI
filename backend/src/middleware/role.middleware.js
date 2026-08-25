import { ApiError } from '../utils/apiError.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('Authentication context is missing'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied. Requires one of [${allowedRoles.join(', ')}] roles.`, 'INSUFFICIENT_ROLE'));
    }

    next();
  };
};
