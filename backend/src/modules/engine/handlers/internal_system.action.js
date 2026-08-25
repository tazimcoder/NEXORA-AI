import { BaseNodeHandler } from './base.handler.js';
import { logger } from '../../../utils/logger.js';

export class InternalSystemActionHandler extends BaseNodeHandler {
  constructor() {
    super('internal_system_action', 'action', 'internal_system', 'Internal System Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    const task = config.task || 'system_checkpoint';

    logger.info(`Executing Internal System Action task [${task}]`);

    return {
      success: true,
      output: {
        task,
        executedAt: new Date().toISOString(),
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage().heapUsed,
        },
      },
    };
  }
}
