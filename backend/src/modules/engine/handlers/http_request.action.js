import { BaseNodeHandler } from './base.handler.js';
import { httpIntegrationProvider } from '../../integrations/providers/http.provider.js';
import { logger } from '../../../utils/logger.js';

export class HttpRequestActionHandler extends BaseNodeHandler {
  constructor() {
    super('http_request_action', 'action', 'http_request', 'HTTP Request Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    const url = this.resolveValue(config.url, context);
    const method = (config.method || 'GET').toUpperCase();
    const headers = config.headers || {};
    const query = config.query || {};
    const body = config.body ? (typeof config.body === 'object' ? config.body : JSON.parse(config.body)) : undefined;

    if (!url) {
      throw new Error('HTTP Request Action requires a valid target URL in config');
    }

    logger.info(`Executing HTTP Action Handler [${method} ${url}] via HttpIntegrationProvider`);

    const result = await httpIntegrationProvider.execute(
      'execute_request',
      {
        config: {
          url,
          method,
          headers,
          query,
          body,
          timeout_ms: config.timeout_ms || 30000,
        },
      },
      config.credentials || {}
    );

    return {
      success: true,
      output: result.output,
    };
  }
}
