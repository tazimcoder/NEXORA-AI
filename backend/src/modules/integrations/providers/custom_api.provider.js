import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const CustomApiConfigSchema = z.object({
  baseUrl: z.string().url('A valid base URL is required (e.g. https://api.example.com/v1)'),
  endpoint: z.string().optional().default('/'),
  method: HttpMethodSchema.default('GET'),
  headers: z.record(z.string()).optional().default({}),
  queryParams: z.record(z.any()).optional().default({}),
  body: z.any().optional(),
  timeout_ms: z.number().positive().optional().default(30000),
});

const CredentialsSchema = z.object({
  authType: z.enum(['none', 'bearer', 'basic', 'apiKeyHeader', 'apiKeyQuery', 'oauth2']).default('none'),
  bearerToken: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  apiKey: z.string().optional(),
  headerName: z.string().optional(),
  headerValue: z.string().optional(),
  queryParamName: z.string().optional(),
  queryParamValue: z.string().optional(),
});

export class CustomApiIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'custom_api',
      'Custom Reusable API Credentials Connector',
      'Generic HTTP API connector supporting reusable base URLs, authentication schemes, custom headers, and query parameters',
      '1.0.0'
    );
  }

  getSchema() {
    return {
      credentials: [
        { key: 'authType', label: 'Authentication Type', type: 'select', default: 'none', options: ['none', 'bearer', 'basic', 'apiKeyHeader', 'apiKeyQuery', 'oauth2'] },
        { key: 'bearerToken', label: 'Bearer / OAuth Token', type: 'password', required: false },
        { key: 'username', label: 'Basic Auth Username', type: 'text', required: false },
        { key: 'password', label: 'Basic Auth Password', type: 'password', required: false },
        { key: 'apiKey', label: 'API Key', type: 'password', required: false },
        { key: 'headerName', label: 'Custom Header Name', type: 'text', required: false },
        { key: 'headerValue', label: 'Custom Header Value', type: 'password', required: false },
      ],
      config: [
        { key: 'baseUrl', label: 'Base URL', type: 'text', required: true, placeholder: 'https://api.mycompany.com/v1' },
        { key: 'endpoint', label: 'Relative Endpoint Path', type: 'text', required: false, placeholder: '/users' },
        { key: 'method', label: 'HTTP Method', type: 'select', default: 'GET', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        { key: 'headers', label: 'Headers JSON', type: 'json', required: false },
        { key: 'queryParams', label: 'Query Parameters JSON', type: 'json', required: false },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
      ],
      actions: ['execute_custom_api'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Custom API credentials validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = CustomApiConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Custom API configuration validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action = 'execute_custom_api', params = {}, credentials = {}) {
    const validConfig = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    // Combine Base URL and Endpoint
    const base = validConfig.baseUrl.endsWith('/') ? validConfig.baseUrl.slice(0, -1) : validConfig.baseUrl;
    const path = validConfig.endpoint.startsWith('/') ? validConfig.endpoint : `/${validConfig.endpoint}`;
    const targetUrl = new URL(`${base}${path}`);

    // Append query parameters from config
    if (validConfig.queryParams && typeof validConfig.queryParams === 'object') {
      Object.entries(validConfig.queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          targetUrl.searchParams.append(k, String(v));
        }
      });
    }

    // Attach security credentials to headers or query params
    const reqHeaders = {
      'Accept': 'application/json',
      ...(validConfig.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...validConfig.headers,
    };

    if (validCreds.authType === 'bearer' || validCreds.authType === 'oauth2') {
      const token = validCreds.bearerToken || validCreds.apiKey;
      if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
      }
    } else if (validCreds.authType === 'basic' && validCreds.username) {
      const authStr = `${validCreds.username}:${validCreds.password || ''}`;
      reqHeaders['Authorization'] = `Basic ${Buffer.from(authStr).toString('base64')}`;
    } else if (validCreds.authType === 'apiKeyHeader') {
      const headerName = validCreds.headerName || 'X-API-Key';
      const headerVal = validCreds.headerValue || validCreds.apiKey || '';
      reqHeaders[headerName] = headerVal;
    } else if (validCreds.authType === 'apiKeyQuery') {
      const paramName = validCreds.queryParamName || 'api_key';
      const paramVal = validCreds.queryParamValue || validCreds.apiKey || '';
      targetUrl.searchParams.append(paramName, paramVal);
    }

    logger.info(`[Custom API Provider] Executing Request [${validConfig.method} ${targetUrl.toString()}] (AuthType: ${validCreds.authType})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), validConfig.timeout_ms);

    try {
      const response = await fetch(targetUrl.toString(), {
        method: validConfig.method,
        headers: reqHeaders,
        body: validConfig.method !== 'GET' && validConfig.body ? JSON.stringify(validConfig.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json().catch(() => ({}));
      } else {
        responseData = { text: await response.text() };
      }

      if (!response.ok) {
        const errorMsg = `Custom API Error HTTP ${response.status}: ${response.statusText}`;
        logger.warn(`Custom API Request Failed [${validConfig.method} ${targetUrl.toString()}]: ${errorMsg}`);
        const err = new Error(errorMsg);
        err.statusCode = response.status;
        err.response = responseData;
        throw err;
      }

      return {
        success: true,
        provider: this.name,
        action: validConfig.method,
        statusCode: response.status,
        url: targetUrl.toString(),
        output: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutErr = new Error(`Custom API Request timed out after ${validConfig.timeout_ms}ms`);
        timeoutErr.statusCode = 408;
        throw timeoutErr;
      }
      throw error;
    }
  }

  async testConnection(credentials) {
    const validCreds = this.validateCredentials(credentials);
    return { success: true, message: `Custom API Credentials (${validCreds.authType}) validated successfully` };
  }
}

export const customApiIntegrationProvider = new CustomApiIntegrationProvider();
