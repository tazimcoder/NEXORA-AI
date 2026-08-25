import { BaseNodeHandler } from './base.handler.js';

export class WebhookTriggerHandler extends BaseNodeHandler {
  constructor() {
    super('webhook_trigger', 'trigger', 'webhook', 'Webhook Trigger');
  }

  async execute(node, context) {
    const input = context.input || {};
    return {
      success: true,
      output: {
        triggerType: 'webhook',
        method: input.method || 'POST',
        headers: input.headers || {},
        query: input.query || {},
        body: input.body || {},
        timestamp: new Date().toISOString(),
      },
    };
  }
}
