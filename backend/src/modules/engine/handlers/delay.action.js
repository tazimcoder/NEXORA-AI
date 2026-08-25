import { BaseNodeHandler } from './base.handler.js';
import { logger } from '../../../utils/logger.js';

export class DelayActionHandler extends BaseNodeHandler {
  constructor() {
    super('delay_action', 'action', 'delay', 'Delay / Wait Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    const delayMs = config.duration_ms || config.delayMs || 1000;

    logger.info(`Delay Action Handler waiting for ${delayMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      success: true,
      output: {
        delayedMs: delayMs,
        resumedAt: new Date().toISOString(),
      },
    };
  }
}
