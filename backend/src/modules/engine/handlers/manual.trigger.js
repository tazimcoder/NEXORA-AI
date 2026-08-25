import { BaseNodeHandler } from './base.handler.js';

export class ManualTriggerHandler extends BaseNodeHandler {
  constructor() {
    super('manual_trigger', 'trigger', 'manual', 'Manual Trigger');
  }

  async execute(node, context) {
    const payload = context.input || context.payload || {};
    return {
      success: true,
      output: {
        triggerType: 'manual',
        timestamp: new Date().toISOString(),
        payload,
      },
    };
  }
}
