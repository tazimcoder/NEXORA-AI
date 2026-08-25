import { BaseNodeHandler } from './base.handler.js';
import { telegramIntegrationProvider } from '../../integrations/providers/telegram.provider.js';
import { logger } from '../../../utils/logger.js';

export class TelegramActionHandler extends BaseNodeHandler {
  constructor() {
    super('telegram_action', 'action', 'send_telegram', 'Send Telegram Message Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    logger.info(`Executing Telegram Action [${node.id}] (${node.label || 'Send Telegram'})`);

    const chatId = this.resolveValue(config.chatId || config.chat_id, context);
    const text = this.resolveValue(config.text || config.message, context);
    const parseMode = config.parseMode || 'HTML';
    const action = config.action || 'send_message';

    const result = await telegramIntegrationProvider.execute(
      action,
      {
        config: {
          chatId,
          text,
          parseMode,
          photoUrl: this.resolveValue(config.photoUrl, context),
          documentUrl: this.resolveValue(config.documentUrl, context),
          caption: this.resolveValue(config.caption, context),
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
