import { BaseNodeHandler } from './base.handler.js';
import { emailIntegrationProvider } from '../../integrations/providers/email.provider.js';
import { logger } from '../../../utils/logger.js';

export class EmailActionHandler extends BaseNodeHandler {
  constructor() {
    super('email_action', 'action', 'send_email', 'Send Email Action');
  }


  async execute(node, context) {
    const config = node.config || {};
    logger.info(`Executing Email Action [${node.id}] (${node.label || 'Send Email'})`);

    // Interpolate input variables into recipient, subject, and text/html body
    const to = this.resolveValue(config.to, context) || 'notifications@nexora.ai';
    const subject = this.resolveValue(config.subject, context) || 'NEXORA AI Automated Email Alert';
    const text = this.resolveValue(config.text || config.message, context) || 'Automated message dispatched by NEXORA AI Execution Engine';
    const html = config.html ? this.resolveValue(config.html, context) : undefined;

    const result = await emailIntegrationProvider.execute(
      'send_email',
      {
        config: {
          to,
          subject,
          text,
          html,
        },
      },
      config.credentials || {}
    );

    return {
      output: result.output,
    };
  }
}
