import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

const SlackConfigSchema = z.object({
  channel: z.string().optional(),
  text: z.string().optional(),
  message: z.string().optional(),
  blocks: z.any().optional(),
  threadTs: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  timeout_ms: z.number().positive().optional().default(30000),
});

const CredentialsSchema = z.object({
  botToken: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

export class SlackIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'slack',
      'Slack Web API & Webhook Integration Provider',
      'Posts notifications, rich Block Kit messages, and thread replies to Slack channels and webhooks',
      '1.0.0'
    );
  }

  getSchema() {
    return {
      credentials: [
        { key: 'botToken', label: 'Slack Bot OAuth Token (xoxb-...)', type: 'password', required: false, placeholder: 'xoxb-123456789-abcdef' },
        { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'password', required: false, placeholder: 'https://hooks.slack.com/services/T00/B00/XXXX' },
      ],
      config: [
        { key: 'channel', label: 'Channel (#general or C12345)', type: 'text', required: false, placeholder: '#general' },
        { key: 'text', label: 'Message Text', type: 'textarea', required: true },
        { key: 'blocks', label: 'Block Kit JSON', type: 'json', required: false },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
      ],
      actions: ['post_message', 'send_webhook'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Slack credentials validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = SlackConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Slack configuration validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action = 'post_message', params = {}, credentials = {}) {
    const validConfig = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    const messageText = validConfig.text || validConfig.message || 'Notification from NEXORA AI';
    const targetWebhook = validConfig.webhookUrl || validCreds.webhookUrl;

    if (action === 'send_webhook' || targetWebhook) {
      if (!targetWebhook) {
        throw new Error('Slack Incoming Webhook Action requires a valid webhookUrl in config or credentials');
      }

      logger.info(`[Slack Provider] Dispatching Webhook Message (url: ${maskSecret(targetWebhook)})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), validConfig.timeout_ms);

      try {
        const response = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: messageText,
            blocks: validConfig.blocks,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const resText = await response.text();

        if (!response.ok || resText !== 'ok') {
          const errorMsg = `Slack Webhook Error (${response.status}): ${resText}`;
          logger.warn(`Slack Webhook Action Failed: ${errorMsg}`);
          const err = new Error(errorMsg);
          err.statusCode = response.status;
          throw err;
        }

        return {
          success: true,
          provider: this.name,
          action: 'send_webhook',
          output: { status: 'sent', response: resText },
        };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          const timeoutErr = new Error(`Slack Webhook timed out after ${validConfig.timeout_ms}ms`);
          timeoutErr.statusCode = 408;
          throw timeoutErr;
        }
        throw error;
      }
    } else {
      // Slack Web API `chat.postMessage`
      const botToken = validCreds.botToken;
      const channel = validConfig.channel;

      if (!botToken) {
        throw new Error('Slack Web API Action requires a valid botToken in credentials');
      }
      if (!channel) {
        throw new Error('Slack Web API Action requires a target channel in config');
      }

      logger.info(`[Slack Provider] Executing chat.postMessage for Channel [${channel}] (botToken: ${maskSecret(botToken)})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), validConfig.timeout_ms);

      try {
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${botToken}`,
          },
          body: JSON.stringify({
            channel,
            text: messageText,
            blocks: validConfig.blocks,
            thread_ts: validConfig.threadTs,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseData = await response.json().catch(() => ({}));

        if (!response.ok || responseData.ok === false) {
          const slackError = responseData.error || response.statusText || 'Slack API Error';
          const errorMsg = `Slack Web API Error: ${slackError}`;
          
          logger.warn(`Slack Action Failed [Channel: ${channel}]: ${errorMsg}`);
          const err = new Error(errorMsg);
          err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 400;
          err.slackError = slackError;
          err.response = responseData;
          throw err;
        }

        return {
          success: true,
          provider: this.name,
          action: 'post_message',
          channel: responseData.channel,
          ts: responseData.ts,
          output: responseData,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          const timeoutErr = new Error(`Slack API request timed out after ${validConfig.timeout_ms}ms`);
          timeoutErr.statusCode = 408;
          throw timeoutErr;
        }
        throw error;
      }
    }
  }

  async testConnection(credentials) {
    const validCreds = this.validateCredentials(credentials);
    if (validCreds.botToken) {
      try {
        const response = await fetch('https://slack.com/api/auth.test', {
          headers: { 'Authorization': `Bearer ${validCreds.botToken}` },
        });
        const data = await response.json();
        if (data.ok) {
          return { success: true, message: `Connected to Slack Team: ${data.team} (Bot: ${data.user})` };
        }
        return { success: false, message: data.error || 'Invalid Slack Bot Token' };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }
    if (validCreds.webhookUrl) {
      return { success: true, message: 'Slack Webhook URL configured' };
    }
    return { success: false, message: 'Bot Token or Webhook URL required' };
  }
}

export const slackIntegrationProvider = new SlackIntegrationProvider();
