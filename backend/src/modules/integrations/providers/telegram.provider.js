import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

const TelegramConfigSchema = z.object({
  chatId: z.string().min(1, 'Telegram Chat ID (chat_id) is required'),
  text: z.string().optional(),
  message: z.string().optional(),
  parseMode: z.enum(['MarkdownV2', 'HTML', 'Markdown', 'None']).optional().default('HTML'),
  photoUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  caption: z.string().optional(),
  disableNotification: z.boolean().optional().default(false),
  timeout_ms: z.number().positive().optional().default(30000),
});

const CredentialsSchema = z.object({
  botToken: z.string().min(1, 'Telegram Bot API Token (botToken) is required'),
});

export class TelegramIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'telegram',
      'Telegram Bot API Integration Provider',
      'Sends messages, photos, and document notifications to Telegram chats and channels via Telegram Bot API',
      '1.0.0'
    );
  }

  getSchema() {
    return {
      credentials: [
        { key: 'botToken', label: 'Telegram Bot Token', type: 'password', required: true, placeholder: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ' },
      ],
      config: [
        { key: 'chatId', label: 'Chat ID / Channel Username', type: 'text', required: true, placeholder: '@mychannel or -100123456789' },
        { key: 'text', label: 'Message Text', type: 'textarea', required: true },
        { key: 'parseMode', label: 'Formatting Parse Mode', type: 'select', default: 'HTML', options: ['HTML', 'MarkdownV2', 'Markdown', 'None'] },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
      ],
      actions: ['send_message', 'send_photo', 'send_document'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Telegram credentials validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = TelegramConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Telegram configuration validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action = 'send_message', params = {}, credentials = {}) {
    const validConfig = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    const botToken = validCreds.botToken;
    const messageText = validConfig.text || validConfig.message || 'Notification from NEXORA AI';
    const chatId = validConfig.chatId;

    let apiMethod = 'sendMessage';
    let bodyPayload = {
      chat_id: chatId,
      disable_notification: validConfig.disableNotification,
    };

    if (action === 'send_photo' && validConfig.photoUrl) {
      apiMethod = 'sendPhoto';
      bodyPayload.photo = validConfig.photoUrl;
      bodyPayload.caption = validConfig.caption || messageText;
    } else if (action === 'send_document' && validConfig.documentUrl) {
      apiMethod = 'sendDocument';
      bodyPayload.document = validConfig.documentUrl;
      bodyPayload.caption = validConfig.caption || messageText;
    } else {
      apiMethod = 'sendMessage';
      bodyPayload.text = messageText;
      if (validConfig.parseMode && validConfig.parseMode !== 'None') {
        bodyPayload.parse_mode = validConfig.parseMode;
      }
    }

    const apiUrl = `https://api.telegram.org/bot${botToken}/${apiMethod}`;
    logger.info(`[Telegram Provider] Executing API [${apiMethod}] for Chat [${chatId}] (botToken: ${maskSecret(botToken)})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), validConfig.timeout_ms);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok || !responseData.ok) {
        const errorCode = responseData.error_code || response.status;
        const errorDescription = responseData.description || response.statusText || 'Telegram API Error';
        const errorMsg = `Telegram API Error (${errorCode}): ${errorDescription}`;
        
        logger.warn(`Telegram Action Failed [Chat: ${chatId}]: ${errorMsg}`);
        const err = new Error(errorMsg);
        err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 400;
        err.telegramErrorCode = errorCode;
        err.response = responseData;
        throw err;
      }

      return {
        success: true,
        provider: this.name,
        action,
        chatId,
        messageId: responseData.result?.message_id,
        output: responseData.result,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutErr = new Error(`Telegram API request timed out after ${validConfig.timeout_ms}ms`);
        timeoutErr.statusCode = 408;
        throw timeoutErr;
      }
      throw error;
    }
  }

  async testConnection(credentials) {
    const validCreds = this.validateCredentials(credentials);
    const apiUrl = `https://api.telegram.org/bot${validCreds.botToken}/getMe`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.ok) {
        return { success: true, message: `Connected to Telegram Bot: @${data.result.username}` };
      }
      return { success: false, message: data.description || 'Invalid Telegram Bot Token' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export const telegramIntegrationProvider = new TelegramIntegrationProvider();
