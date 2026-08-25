import { BaseNodeHandler } from './base.handler.js';

export class ScheduleTriggerHandler extends BaseNodeHandler {
  constructor() {
    super('schedule_trigger', 'trigger', 'schedule', 'Schedule Cron Trigger');
  }

  async execute(node, context) {
    const config = node.config || {};
    return {
      success: true,
      output: {
        triggerType: 'schedule',
        cronExpression: config.cron || '0 * * * *',
        timezone: config.timezone || 'UTC',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
