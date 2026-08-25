import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const ConfigSchema = z.object({
  url: z.string().url('A valid HTTP/HTTPS URL is required'),
  method: HttpMethodSchema.default('GET'),
  headers: z.record(z.string()).optional().default({}),
  query: z.record(z.string()).optional().default({}),
  body: z.any().optional(),
  timeout_ms: z.number().positive().default(30000),
  max_retries: z.number().min(0).max(5).default(3),
});

const CredentialsSchema = z.object({
  authType: z.enum(['none', 'bearer', 'basic', 'header']).default('none'),
  bearerToken: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  headerName: z.string().optional(),
  headerValue: z.string().optional(),
});

export class HttpIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'http',
      'Universal HTTP Request Provider',
      'Universal API connector supporting GET, POST, PUT, PATCH, and DELETE requests with dynamic headers and authentication',
      '1.0.0'
    );
  }

  getSchema() {
    return {
      credentials: [
        { key: 'authType', label: 'Auth Type', type: 'select', default: 'none', options: ['none', 'bearer', 'basic', 'header'] },
        { key: 'bearerToken', label: 'Bearer Token', type: 'password', required: false },
        { key: 'username', label: 'Basic Auth Username', type: 'text', required: false },
        { key: 'password', label: 'Basic Auth Password', type: 'password', required: false },
        { key: 'headerName', label: 'Custom Header Name', type: 'text', required: false },
        { key: 'headerValue', label: 'Custom Header Value', type: 'password', required: false },
      ],
      config: [
        { key: 'url', label: 'Target URL', type: 'text', required: true, placeholder: 'https://api.example.com/v1/resource' },
        { key: 'method', label: 'HTTP Method', type: 'select', default: 'GET', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        { key: 'headers', label: 'Headers JSON', type: 'json', required: false },
        { key: 'query', label: 'Query Parameters JSON', type: 'json', required: false },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
      ],
      actions: ['execute_request'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Credential validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = ConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Configuration validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action, params = {}, credentials = {}) {
    const validConfig = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    // Build URL with query parameters
    const targetUrl = new URL(validConfig.url);
    if (validConfig.query && typeof validConfig.query === 'object') {
      Object.entries(validConfig.query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          targetUrl.searchParams.append(k, String(v));
        }
      });
    }

    // Build headers & attach security credentials
    const reqHeaders = {
      'Accept': 'application/json',
      ...(validConfig.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...validConfig.headers,
    };

    if (validCreds.authType === 'bearer' && validCreds.bearerToken) {
      reqHeaders['Authorization'] = `Bearer ${validCreds.bearerToken}`;
    } else if (validCreds.authType === 'basic' && validCreds.username) {
      const authStr = `${validCreds.username}:${validCreds.password || ''}`;
      reqHeaders['Authorization'] = `Basic ${Buffer.from(authStr).toString('base64')}`;
    } else if (validCreds.authType === 'header' && validCreds.headerName) {
      reqHeaders[validCreds.headerName] = validCreds.headerValue || '';
    }

    logger.info(`Executing HTTP Provider [${validConfig.method} ${targetUrl.toString()}]`);

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
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status} ${response.statusText}`;
        logger.warn(`HTTP Request Action Failed [${validConfig.method} ${targetUrl.toString()}]: ${errorMsg}`);
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
        const timeoutErr = new Error(`HTTP Request timed out after ${validConfig.timeout_ms}ms`);
        timeoutErr.statusCode = 408;
        throw timeoutErr;
      }
      throw error;
    }
  }
}

export const httpIntegrationProvider = new HttpIntegrationProvider();
