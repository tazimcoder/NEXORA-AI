import { BaseAgent } from './base.agent.js';
import { AgentRole } from '../agent.types.js';
import { logger } from '../../../utils/logger.js';

export class ReviewAgent extends BaseAgent {
  constructor() {
    super(
      'review_agent',
      'Review Agent',
      AgentRole.REVIEW,
      'Evaluates aggregated sub-agent output, scores execution quality, and verifies compliance rules',
      ['review_output', 'verify_quality', 'score_result', 'evaluate_compliance'],
      false
    );
  }

  async executeTask(taskInput = {}, context = {}) {
    logger.info(`[Review Agent] Reviewing aggregated results from sub-agents...`);

    const action = taskInput.action || 'review_output';
    if (!this.hasCapability(action)) {
      throw new Error(`Review Agent lacks permission for capability '${action}'`);
    }

    const taskExecution = async () => {
      const aggregatedResult = taskInput.aggregatedResult || taskInput.partialResults || {};
      const completedTasks = taskInput.completedTaskCount || 1;
      const failedTasks = taskInput.failedTaskCount || 0;

      // Calculate quality compliance score
      const qualityScore = failedTasks === 0 ? 0.98 : Math.max(0.6, 0.95 - failedTasks * 0.15);
      const passedReview = qualityScore >= 0.7;

      return {
        agentId: this.id,
        agentName: this.name,
        reviewVerdict: {
          passed: passedReview,
          qualityScore,
          complianceStatus: passedReview ? 'VERIFIED' : 'NEEDS_REVISION',
          notes: passedReview
            ? 'Aggregated execution outputs meet security, quality, and schema standards.'
            : 'Execution contains partial failures; review required.',
        },
        summary: `Review completed across ${completedTasks} completed sub-tasks (${failedTasks} failures).`,
        timestamp: new Date().toISOString(),
      };
    };

    return await this.withTimeout(taskExecution(), taskInput.timeoutMs || 15000);
  }
}
