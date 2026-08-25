import { BaseIntegrationProvider } from '../base.provider.js';
import { logger } from '../../../../utils/logger.js';
import { maskSecret } from '../../../../utils/crypto.utils.js';

export class BaseGoogleProvider extends BaseIntegrationProvider {
  constructor(name = 'google', displayName = 'Google Workspace & Cloud Provider', description = 'Base architectural provider for Google Workspace, Sheets, Gmail, and Cloud APIs', version = '1.0.0') {
    super(name, displayName, description, version);
  }

  /**
   * Resolves valid Authorization headers for Google APIs (OAuth2 Access Token or Service Account or API Key).
   * @param {object} credentials 
   * @returns {{ headers: object, query: object }}
   */
  resolveAuthHeaders(credentials = {}) {
    const headers = {};
    const query = {};

    if (credentials.accessToken) {
      headers['Authorization'] = `Bearer ${credentials.accessToken}`;
    } else if (credentials.apiKey) {
      query['key'] = credentials.apiKey;
    } else if (credentials.serviceAccountJson) {
      // Service Account Token placeholder
      const sa = typeof credentials.serviceAccountJson === 'string' ? JSON.parse(credentials.serviceAccountJson) : credentials.serviceAccountJson;
      headers['Authorization'] = `Bearer sa_${sa.client_email || 'token'}`;
    } else if (process.env.GOOGLE_API_KEY) {
      query['key'] = process.env.GOOGLE_API_KEY;
    }

    return { headers, query };
  }

  /**
   * Standardized Google API fetch execution wrapper with timeout and error classification.
   */
  async fetchGoogleApi(url, options = {}, timeout_ms = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const errObj = data.error || {};
        const code = errObj.code || response.status;
        const message = errObj.message || response.statusText || 'Google API Error';
        const status = errObj.status || 'GOOGLE_API_ERROR';

        const errorMsg = `Google API Error (${code} ${status}): ${message}`;
        logger.warn(`[Google Provider] Request Failed [${url}]: ${errorMsg}`);

        const err = new Error(errorMsg);
        err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 400;
        err.googleCode = code;
        err.googleStatus = status;
        err.response = data;
        throw err;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutErr = new Error(`Google API request timed out after ${timeout_ms}ms`);
        timeoutErr.statusCode = 408;
        throw timeoutErr;
      }
      throw error;
    }
  }
}
