/**
 * Base abstract class for all NEXORA AI Integration Providers.
 * Every provider module MUST extend this class.
 */
export class BaseIntegrationProvider {
  constructor(name, displayName, description, version = '1.0.0') {
    if (new.target === BaseIntegrationProvider) {
      throw new TypeError('Cannot instantiate abstract BaseIntegrationProvider directly');
    }
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.version = version;
  }

  /**
   * Returns schema definition for the provider's credentials & configuration.
   */
  getSchema() {
    throw new Error(`getSchema() not implemented for provider ${this.name}`);
  }

  /**
   * Validates configuration parameters.
   */
  validateConfig(config) {
    throw new Error(`validateConfig() not implemented for provider ${this.name}`);
  }

  /**
   * Validates provider authentication credentials.
   */
  validateCredentials(credentials) {
    throw new Error(`validateCredentials() not implemented for provider ${this.name}`);
  }

  /**
   * Executes a specific action on behalf of the workflow engine.
   * @param {string} action - Action identifier (e.g. 'chat_completion')
   * @param {object} params - Input parameters for the action
   * @param {object} credentials - Decrypted provider credentials
   * @returns {Promise<object>} Execution output result payload
   */
  async execute(action, params, credentials) {
    throw new Error(`execute() not implemented for provider ${this.name}`);
  }

  /**
   * Tests provider connection with supplied credentials.
   * @param {object} credentials - Credentials to test
   * @returns {Promise<{success: boolean, message: string}>} Connection test result
   */
  async testConnection(credentials) {
    throw new Error(`testConnection() not implemented for provider ${this.name}`);
  }
}
