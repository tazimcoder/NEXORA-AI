import { ApiError } from '../utils/apiError.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      const details = error.errors ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`) : error.message;
      next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
    }
  };
};
