import { integrationRegistry } from './integration.registry.js';
import { encryptCredentials, decryptCredentials } from '../../utils/crypto.utils.js';

export class IntegrationsService {
  /**
   * Lists all available provider plugins and their configuration schemas.
   */
  listAvailableProviders() {
    return integrationRegistry.listProviders();
  }

  /**
   * Tests a provider's connectivity with given credentials.
   */
  async testProviderConnection(providerName, credentials) {
    const provider = integrationRegistry.getProvider(providerName);
    return await provider.testConnection(credentials);
  }

  /**
   * Executes an action on a provider plugin on behalf of the workflow engine.
   */
  async executeProviderAction(providerName, action, params, credentials) {
    const provider = integrationRegistry.getProvider(providerName);

    // If credentials are encrypted (string containing iv:tag:hex format), decrypt them
    let rawCredentials = credentials;
    if (typeof credentials === 'string' && credentials.includes(':')) {
      rawCredentials = decryptCredentials(credentials);
    }

    return await provider.execute(action, params, rawCredentials);
  }

  /**
   * Utility to safely encrypt credentials before DB insertion.
   */
  encryptProviderCredentials(credentials) {
    return encryptCredentials(credentials);
  }

  /**
   * Utility to decrypt credentials for execution.
   */
  decryptProviderCredentials(encryptedPayload) {
    return decryptCredentials(encryptedPayload);
  }
}

export const integrationsService = new IntegrationsService();
