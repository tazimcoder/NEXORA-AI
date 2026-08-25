export const FAILURE_CATEGORIES = {
  TRANSIENT_ERROR: 'TRANSIENT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export class ErrorAnalyzer {
  /**
   * Analyzes an execution error and classifies it into one of 6 failure categories.
   * @param {Error|object} error Error instance or error payload
   * @returns {{ category: string, reason: string, isDestructive: boolean }} Classification result
   */
  classify(error) {
    if (!error) {
      return {
        category: FAILURE_CATEGORIES.UNKNOWN_ERROR,
        reason: 'Unknown execution failure without error payload',
        isDestructive: false,
      };
    }

    const message = (error.message || String(error)).toLowerCase();
    const status = error.statusCode || error.status || error.code;
    const name = (error.name || '').toLowerCase();

    // 1. Transient Error (Rate limit 429, timeouts, network ECONNRESET/FETCH, 502/503/504)
    if (
      status === 429 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('fetch failed') ||
      message.includes('network')
    ) {
      return {
        category: FAILURE_CATEGORIES.TRANSIENT_ERROR,
        reason: `Transient network/rate-limit issue: ${error.message || message}`,
        isDestructive: false,
      };
    }

    // 2. Authentication Error (401 Unauthorized, 403 Forbidden, token expired, invalid credentials)
    if (
      status === 401 ||
      status === 403 ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('api key') ||
      message.includes('token expired') ||
      message.includes('auth') ||
      name.includes('auth')
    ) {
      return {
        category: FAILURE_CATEGORIES.AUTHENTICATION_ERROR,
        reason: `Authentication failure requiring credential update: ${error.message || message}`,
        isDestructive: true, // Requires human approval to prevent unauthorized access attempts
      };
    }

    // 3. Validation Error (400 Bad Request, Zod schema failure, missing fields)
    if (
      status === 400 ||
      message.includes('validation') ||
      message.includes('invalid parameter') ||
      message.includes('required field') ||
      message.includes('schema') ||
      name.includes('validation')
    ) {
      return {
        category: FAILURE_CATEGORIES.VALIDATION_ERROR,
        reason: `Payload or configuration validation error: ${error.message || message}`,
        isDestructive: false,
      };
    }

    // 4. External API Error (500 Internal Server Error from downstream provider)
    if (
      status === 500 ||
      message.includes('upstream') ||
      message.includes('external api') ||
      message.includes('openrouter error')
    ) {
      return {
        category: FAILURE_CATEGORIES.EXTERNAL_API_ERROR,
        reason: `External downstream API provider failure: ${error.message || message}`,
        isDestructive: false,
      };
    }

    // 5. Business Rule Error (Domain condition branch failure, user assertion failure)
    if (
      message.includes('business rule') ||
      message.includes('assertion') ||
      message.includes('condition failed') ||
      message.includes('policy')
    ) {
      return {
        category: FAILURE_CATEGORIES.BUSINESS_RULE_ERROR,
        reason: `Business rule policy assertion failure: ${error.message || message}`,
        isDestructive: true,
      };
    }

    // 6. Unknown Error (Default fallback)
    return {
      category: FAILURE_CATEGORIES.UNKNOWN_ERROR,
      reason: `Unhandled execution failure: ${error.message || message}`,
      isDestructive: false,
    };
  }
}

export const errorAnalyzer = new ErrorAnalyzer();
