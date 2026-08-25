/**
 * Sanitizes strings against HTML/script injection and prototype pollution.
 * @param {any} input 
 * @returns {any} Sanitized value
 */
export const sanitizeValue = (input) => {
  if (typeof input === 'string') {
    // Strip script tags and dangerous HTML attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror=/gi, '')
      .replace(/onload=/gi, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeValue);
  }
  if (input && typeof input === 'object' && input.constructor === Object) {
    const cleanObj = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue; // Block prototype pollution
      }
      cleanObj[key] = sanitizeValue(value);
    }
    return cleanObj;
  }
  return input;
};

export const sanitizeInputMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};
