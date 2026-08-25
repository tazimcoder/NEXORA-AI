import { BaseAgent } from './base.agent.js';
import { AgentRole } from '../agent.types.js';
import { logger } from '../../../utils/logger.js';

export class ActionAgent extends BaseAgent {
  constructor() {
    super(
      'action_agent',
      'Action Agent',
      AgentRole.ACTION,
      'Executes specific external integrations, notifications, and API calls with sensitive action approval checks',
      ['execute_action', 'send_notification', 'http_request', 'send_email'],
      true
    );
  }

  async executeTask(taskInput = {}, context = {}) {
    logger.info(`[Action Agent] Executing action task: "${taskInput.action || 'execute_action'}" (sensitive: ${Boolean(taskInput.isSensitive)})`);

    const action = taskInput.action || 'execute_action';
    if (!this.hasCapability(action)) {
      throw new Error(`Action Agent lacks permission for capability '${action}'`);
    }

    // Check if task is sensitive and requires human approval
    const isSensitive = Boolean(taskInput.isSensitive || taskInput.requiresApproval);
    if (isSensitive && !context.isApproved) {
      logger.warn(`[Action Agent] Sensitive action '${action}' requires human approval before execution`);
      return {
        agentId: this.id,
        agentName: this.name,
        status: 'awaiting_approval',
        requiresApproval: true,
        action,
        reason: 'Sensitive operation requires explicit user authorization',
        timestamp: new Date().toISOString(),
      };
    }

    const taskExecution = async () => {
      return {
        agentId: this.id,
        agentName: this.name,
        status: 'completed',
        executedAction: action,
        payload: taskInput.payload || { message: 'Action executed successfully' },
        result: { success: true, timestamp: new Date().toISOString() },
      };
    };

    return await this.withTimeout(taskExecution(), taskInput.timeoutMs || 15000);
  }
}
