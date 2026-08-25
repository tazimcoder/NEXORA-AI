import { z } from 'zod';
import { BaseGoogleProvider } from './google/base-google.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

const GoogleConfigSchema = z.object({
  service: z.enum(['sheets', 'gmail', 'drive']).optional().default('sheets'),
  spreadsheetId: z.string().optional(),
  range: z.string().optional().default('Sheet1!A1'),
  values: z.array(z.any()).optional().default([]),
  valueInputOption: z.enum(['USER_ENTERED', 'RAW']).optional().default('USER_ENTERED'),
  to: z.string().email().optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  timeout_ms: z.number().positive().optional().default(30000),
});

const CredentialsSchema = z.object({
  accessToken: z.string().optional(),
  apiKey: z.string().optional(),
  serviceAccountJson: z.any().optional(),
  refreshToken: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

export class GoogleIntegrationProvider extends BaseGoogleProvider {
  constructor() {
    super(
      'google',
      'Google Workspace Integration Provider',
      'Extensible integration connector for Google Sheets, Gmail, and Google Drive services',
      '1.0.0'
    );
  }

  getSchema() {
    return {
      credentials: [
        { key: 'accessToken', label: 'Google OAuth2 Access Token', type: 'password', required: false },
        { key: 'apiKey', label: 'Google API Key', type: 'password', required: false },
        { key: 'serviceAccountJson', label: 'Service Account JSON Key', type: 'textarea', required: false },
      ],
      config: [
        { key: 'service', label: 'Google Service', type: 'select', default: 'sheets', options: ['sheets', 'gmail', 'drive'] },
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: false, placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
        { key: 'range', label: 'Sheet Range', type: 'text', default: 'Sheet1!A1' },
        { key: 'values', label: 'Values JSON Array', type: 'json', required: false },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
      ],
      actions: ['sheets_append_row', 'sheets_get_values', 'gmail_send'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Google credentials validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = GoogleConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Google configuration validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action = 'sheets_append_row', params = {}, credentials = {}) {
    const validConfig = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    const { headers, query } = this.resolveAuthHeaders(validCreds);

    if (action.startsWith('sheets_')) {
      const spreadsheetId = validConfig.spreadsheetId;
      if (!spreadsheetId) {
        throw new Error('Google Sheets action requires a valid spreadsheetId');
      }

      if (action === 'sheets_append_row') {
        const range = validConfig.range || 'Sheet1!A1';
        const urlObj = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`);
        urlObj.searchParams.append('valueInputOption', validConfig.valueInputOption || 'USER_ENTERED');
        Object.entries(query).forEach(([k, v]) => urlObj.searchParams.append(k, v));

        const bodyData = {
          values: Array.isArray(validConfig.values[0]) ? validConfig.values : [validConfig.values],
        };

        logger.info(`[Google Provider] Appending row to Google Sheet [${spreadsheetId}] range [${range}]`);

        const result = await this.fetchGoogleApi(
          urlObj.toString(),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(bodyData),
          },
          validConfig.timeout_ms
        );

        return {
          success: true,
          provider: this.name,
          service: 'sheets',
          action: 'sheets_append_row',
          updatedRange: result.updates?.updatedRange,
          updatedRows: result.updates?.updatedRows,
          output: result,
        };
      } else {
        // `sheets_get_values`
        const range = validConfig.range || 'Sheet1!A1:Z100';
        const urlObj = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
        Object.entries(query).forEach(([k, v]) => urlObj.searchParams.append(k, v));

        logger.info(`[Google Provider] Fetching Google Sheet values [${spreadsheetId}] range [${range}]`);

        const result = await this.fetchGoogleApi(
          urlObj.toString(),
          {
            method: 'GET',
            headers,
          },
          validConfig.timeout_ms
        );

        return {
          success: true,
          provider: this.name,
          service: 'sheets',
          action: 'sheets_get_values',
          values: result.values || [],
          output: result,
        };
      }
    } else if (action === 'gmail_send') {
      const recipient = validConfig.to;
      if (!recipient) {
        throw new Error('Gmail Send action requires a recipient email address');
      }

      logger.info(`[Google Provider] Dispatching Gmail Message to [${recipient}]`);

      // RFC 2822 email format base64url encoded for Gmail API v1
      const rawEmail = `To: ${recipient}\r\nSubject: ${validConfig.subject || 'Notification'}\r\n\r\n${validConfig.text || ''}`;
      const encodedMessage = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const urlObj = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
      Object.entries(query).forEach(([k, v]) => urlObj.searchParams.append(k, v));

      const result = await this.fetchGoogleApi(
        urlObj.toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ raw: encodedMessage }),
        },
        validConfig.timeout_ms
      );

      return {
        success: true,
        provider: this.name,
        service: 'gmail',
        action: 'gmail_send',
        messageId: result.id,
        output: result,
      };
    }

    throw new Error(`Action '${action}' is not supported by GoogleIntegrationProvider`);
  }

  async testConnection(credentials) {
    const validCreds = this.validateCredentials(credentials);
    const { headers } = this.resolveAuthHeaders(validCreds);

    if (!headers.Authorization && !validCreds.apiKey) {
      return { success: false, message: 'Google OAuth Access Token, API Key, or Service Account required' };
    }

    return { success: true, message: 'Google Service credentials validated' };
  }
}

export const googleIntegrationProvider = new GoogleIntegrationProvider();
