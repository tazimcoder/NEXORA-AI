import { integrationsService } from './integrations.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class IntegrationsController {
  async getProviders(req, res, next) {
    try {
      const providers = integrationsService.listAvailableProviders();
      return ApiResponse.success(res, providers, 'Available integration providers retrieved');
    } catch (error) {
      next(error);
    }
  }

  async testConnection(req, res, next) {
    try {
      const { provider, credentials } = req.body;
      if (!provider || !credentials) {
        throw ApiError.badRequest('Both provider and credentials are required');
      }

      const result = await integrationsService.testProviderConnection(provider, credentials);
      if (!result.success) {
        return ApiResponse.success(res, result, 'Connection test failed', 400);
      }
      return ApiResponse.success(res, result, 'Connection test successful');
    } catch (error) {
      next(error);
    }
  }

  async executeAction(req, res, next) {
    try {
      const { provider, action, params, credentials } = req.body;
      if (!provider || !action || !credentials) {
        throw ApiError.badRequest('provider, action, and credentials parameters are required');
      }

      const result = await integrationsService.executeProviderAction(provider, action, params, credentials);
      return ApiResponse.success(res, result, `Executed action '${action}' on provider '${provider}'`);
    } catch (error) {
      next(error);
    }
  }
}

export const integrationsController = new IntegrationsController();
