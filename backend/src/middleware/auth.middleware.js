import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN'));
  }
};
