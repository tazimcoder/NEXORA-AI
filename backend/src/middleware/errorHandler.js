import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, 'INTERNAL_ERROR', error.stack);
  }

  logger.error(`[API Error] ${req.method} ${req.originalUrl}: ${error.message}`, {
    statusCode: error.statusCode,
    code: error.code,
    stack: error.stack,
  });

  const responsePayload = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    },
  };

  return res.status(error.statusCode).json(responsePayload);
};
