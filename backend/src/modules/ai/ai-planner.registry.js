import { OpenRouterPlannerProvider } from './providers/openrouter-planner.provider.js';
import { logger } from '../../utils/logger.js';

class AIPlannerRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProviderName = 'openrouter';
    this.registerBuiltInProviders();
  }

  register(provider) {
    if (!provider || !provider.name) {
      throw new Error('Invalid AI Planner Provider instance');
    }
    this.providers.set(provider.name, provider);
    logger.info(`Registered AI Planner Provider: [${provider.name}] (${provider.displayName})`);
  }

  registerBuiltInProviders() {
    this.register(new OpenRouterPlannerProvider());
  }

  getActiveProvider() {
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      throw new Error(`Active AI Planner Provider '${this.activeProviderName}' is not registered`);
    }
    return provider;
  }

  setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`AI Planner Provider '${name}' is not registered`);
    }
    this.activeProviderName = name;
  }
}

export const aiPlannerRegistry = new AIPlannerRegistry();
