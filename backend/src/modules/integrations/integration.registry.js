import { logger } from '../../utils/logger.js';
import { OpenRouterIntegrationProvider } from './providers/openrouter.provider.js';
import { HttpIntegrationProvider } from './providers/http.provider.js';
import { EmailIntegrationProvider } from './providers/email.provider.js';
import { TelegramIntegrationProvider } from './providers/telegram.provider.js';
import { SlackIntegrationProvider } from './providers/slack.provider.js';
import { GoogleIntegrationProvider } from './providers/google.provider.js';
import { CustomApiIntegrationProvider } from './providers/custom_api.provider.js';

class IntegrationRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  /**
   * Registers an integration provider plugin.
   * @param {BaseIntegrationProvider} provider Instance extending BaseIntegrationProvider
   */
  register(provider) {
    if (!provider || !provider.name) {
      throw new Error('Invalid provider plugin instance');
    }
    this.providers.set(provider.name, provider);
    logger.info(`Registered integration provider plugin: [${provider.name}] (${provider.displayName} v${provider.version})`);
  }

  /**
   * Automatically registers built-in default provider plugins.
   */
  registerDefaultProviders() {
    this.register(new OpenRouterIntegrationProvider());
    this.register(new HttpIntegrationProvider());
    this.register(new EmailIntegrationProvider());
    this.register(new TelegramIntegrationProvider());
    this.register(new SlackIntegrationProvider());
    this.register(new GoogleIntegrationProvider());
    this.register(new CustomApiIntegrationProvider());
  }

  /**
   * Retrieves a registered provider plugin by name.
   * @param {string} name Provider key name
   * @returns {BaseIntegrationProvider}
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Integration provider '${name}' is not registered`);
    }
    return provider;
  }

  /**
   * Lists all registered provider plugins with their schemas.
   */
  listProviders() {
    const list = [];
    for (const [name, provider] of this.providers.entries()) {
      list.push({
        name: provider.name,
        displayName: provider.displayName,
        description: provider.description,
        version: provider.version,
        schema: provider.getSchema(),
      });
    }
    return list;
  }
}

export const integrationRegistry = new IntegrationRegistry();
