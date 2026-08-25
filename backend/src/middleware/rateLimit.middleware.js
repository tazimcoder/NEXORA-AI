import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const requestStore = new Map();

/**
 * Clean up expired rate limiting entries every 60 seconds.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 60000).unref();

/**
 * Creates an IP-based rate limiting middleware.
 * @param {object} options 
 * @param {number} options.windowMs - Time window in milliseconds (default 15 minutes)
 * @param {number} options.max - Maximum number of requests allowed per IP per window (default 100)
 * @param {string} options.message - Custom error message when limit is exceeded
 */
export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests from this IP, please try again later' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || ''}:${ip}`;
    const now = Date.now();

    let record = requestStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      logger.warn(`Rate limit exceeded for IP [${ip}] on route [${req.originalUrl}] (${record.count}/${max})`);
      return next(new ApiError(429, message, 'TOO_MANY_REQUESTS'));
    }

    next();
  };
};

export const globalRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 });
export const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login or registration attempts. Please try again later.' });
