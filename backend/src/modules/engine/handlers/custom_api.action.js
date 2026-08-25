import { BaseNodeHandler } from './base.handler.js';
import { customApiIntegrationProvider } from '../../integrations/providers/custom_api.provider.js';
import { logger } from '../../../utils/logger.js';

export class CustomApiActionHandler extends BaseNodeHandler {
  constructor() {
    super('custom_api_action', 'action', 'custom_api', 'Custom API Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    logger.info(`Executing Custom API Action [${node.id}] (${node.label || 'Custom API'})`);

    const baseUrl = this.resolveValue(config.baseUrl, context);
    const endpoint = this.resolveValue(config.endpoint, context) || '/';
    const method = config.method || 'GET';

    const result = await customApiIntegrationProvider.execute(
      'execute_custom_api',
      {
        config: {
          baseUrl,
          endpoint,
          method,
          headers: config.headers || {},
          queryParams: config.queryParams || {},
          body: config.body,
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
