import { BaseNodeHandler } from './base.handler.js';
import { slackIntegrationProvider } from '../../integrations/providers/slack.provider.js';
import { logger } from '../../../utils/logger.js';

export class SlackActionHandler extends BaseNodeHandler {
  constructor() {
    super('slack_action', 'action', 'post_slack', 'Post Slack Message Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    logger.info(`Executing Slack Action [${node.id}] (${node.label || 'Post Slack'})`);

    const channel = this.resolveValue(config.channel, context);
    const text = this.resolveValue(config.text || config.message, context);
    const webhookUrl = this.resolveValue(config.webhookUrl, context);
    const action = config.action || (webhookUrl ? 'send_webhook' : 'post_message');

    const result = await slackIntegrationProvider.execute(
      action,
      {
        config: {
          channel,
          text,
          webhookUrl,
          blocks: config.blocks,
          threadTs: config.threadTs,
          timeout_ms: config.timeout_ms || 30000,
        },
      },
      config.credentials || {}
    );

    return {
      output: result.output,
    };
  }
}
