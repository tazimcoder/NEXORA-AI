import { FAILURE_CATEGORIES } from './error.analyzer.js';
import { logger } from '../../utils/logger.js';

export class RecoveryStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  register(category, strategyHandler) {
    this.strategies.set(category, strategyHandler);
    logger.info(`Registered Recovery Strategy for category [${category}]`);
  }

  registerDefaultStrategies() {
    // 1. Transient Error Strategy -> Exponential Retry
    this.register(FAILURE_CATEGORIES.TRANSIENT_ERROR, {
      name: 'ExponentialRetryStrategy',
      action: 'retry',
      maxRetries: 3,
      backoffMultiplier: 2,
      description: 'Re-enqueue job with exponential backoff delay',
    });

    // 2. Authentication Error Strategy -> Human Approval Escalation
    this.register(FAILURE_CATEGORIES.AUTHENTICATION_ERROR, {
      name: 'HumanApprovalEscalationStrategy',
      action: 'escalate_human_approval',
      description: 'Pause execution, log audit history, and request explicit human credential approval',
    });

    // 3. Validation Error Strategy -> Alternative Fallback / Abort
    this.register(FAILURE_CATEGORIES.VALIDATION_ERROR, {
      name: 'AlternativeFallbackStrategy',
      action: 'fallback_branch',
      description: 'Attempt alternative fallback branch or return default validation payload',
    });

    // 4. External API Error Strategy -> Alternative Fallback
    this.register(FAILURE_CATEGORIES.EXTERNAL_API_ERROR, {
      name: 'AlternativeFallbackStrategy',
      action: 'fallback_branch',
      description: 'Attempt alternative external service provider endpoint',
    });

    // 5. Business Rule Error Strategy -> Human Approval Escalation
    this.register(FAILURE_CATEGORIES.BUSINESS_RULE_ERROR, {
      name: 'HumanApprovalEscalationStrategy',
      action: 'escalate_human_approval',
      description: 'Pause execution, record audit trail, and request human business rule override approval',
    });

    // 6. Unknown Error Strategy -> Safe Abort & Audit Log
    this.register(FAILURE_CATEGORIES.UNKNOWN_ERROR, {
      name: 'SafeAbortAndAuditStrategy',
      action: 'safe_abort',
      description: 'Safely terminate execution and persist diagnostic trace to audit logs',
    });
  }

  getStrategy(category) {
    return this.strategies.get(category) || this.strategies.get(FAILURE_CATEGORIES.UNKNOWN_ERROR);
  }
}

export const recoveryStrategyRegistry = new RecoveryStrategyRegistry();
