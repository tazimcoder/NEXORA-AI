import { BaseNodeHandler } from './base.handler.js';
import { googleIntegrationProvider } from '../../integrations/providers/google.provider.js';
import { logger } from '../../../utils/logger.js';

export class GoogleActionHandler extends BaseNodeHandler {
  constructor() {
    super('google_action', 'action', 'google', 'Google Workspace Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    logger.info(`Executing Google Action [${node.id}] (${node.label || 'Google Action'})`);

    const action = config.action || 'sheets_append_row';
    const spreadsheetId = this.resolveValue(config.spreadsheetId, context);
    const range = this.resolveValue(config.range, context) || 'Sheet1!A1';
    const to = this.resolveValue(config.to, context);
    const subject = this.resolveValue(config.subject, context);
    const text = this.resolveValue(config.text, context);

    const result = await googleIntegrationProvider.execute(
      action,
      {
        config: {
          service: config.service || 'sheets',
          spreadsheetId,
          range,
          values: config.values || [],
          valueInputOption: config.valueInputOption || 'USER_ENTERED',
          to,
          subject,
          text,
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
