import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OpenRouterIntegrationProvider,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterQuotaExceededError,
  OpenRouterInvalidRequestError,
} from '../src/modules/integrations/providers/openrouter.provider.js';

test('OpenRouterIntegrationProvider - Schema & Plugin Metadata', () => {
  const provider = new OpenRouterIntegrationProvider();
  assert.equal(provider.name, 'openrouter');
  assert.equal(provider.version, '1.0.0');

  const schema = provider.getSchema();
  assert.ok(Array.isArray(schema.credentials));
  assert.ok(Array.isArray(schema.config));
  assert.ok(schema.actions.includes('chat_completion'));
  assert.ok(schema.actions.includes('generate_text'));
  assert.ok(schema.actions.includes('summarize'));
});

test('OpenRouterIntegrationProvider - Credentials & Config Validation', () => {
  const provider = new OpenRouterIntegrationProvider();

  // Valid credentials
  const validCreds = provider.validateCredentials({ apiKey: 'sk-or-v1-testkey123456' });
  assert.equal(validCreds.apiKey, 'sk-or-v1-testkey123456');

  // Invalid API key format (missing sk-or- prefix)
  assert.throws(() => {
    provider.validateCredentials({ apiKey: 'invalid-key' });
  }, OpenRouterInvalidRequestError);

  // Default configuration parsing
  const validConfig = provider.validateConfig({});
  assert.equal(validConfig.model, 'openai/gpt-4o-mini');
  assert.equal(validConfig.temperature, 0.7);
  assert.equal(validConfig.max_tokens, 2048);
  assert.equal(validConfig.timeout_ms, 30000);
});

test('OpenRouterIntegrationProvider - Provider Error Mapping', () => {
  const provider = new OpenRouterIntegrationProvider();

  const authErr = provider.mapResponseError(401, { message: 'Unauthorized' });
  assert.ok(authErr instanceof OpenRouterAuthenticationError);
  assert.equal(authErr.statusCode, 401);

  const quotaErr = provider.mapResponseError(402, { message: 'Out of credits' });
  assert.ok(quotaErr instanceof OpenRouterQuotaExceededError);
  assert.equal(quotaErr.statusCode, 402);

  const rateErr = provider.mapResponseError(429, { message: 'Too many requests' });
  assert.ok(rateErr instanceof OpenRouterRateLimitError);
  assert.equal(rateErr.statusCode, 429);
});

test('OpenRouterIntegrationProvider - Action Validation Errors', async () => {
  const provider = new OpenRouterIntegrationProvider();
  const credentials = { apiKey: 'sk-or-v1-validkey999' };

  // chat_completion missing messages
  await assert.rejects(async () => {
    await provider.execute('chat_completion', { messages: [] }, credentials);
  }, OpenRouterInvalidRequestError);

  // generate_text missing prompt
  await assert.rejects(async () => {
    await provider.execute('generate_text', {}, credentials);
  }, OpenRouterInvalidRequestError);

  // summarize missing text
  await assert.rejects(async () => {
    await provider.execute('summarize', {}, credentials);
  }, OpenRouterInvalidRequestError);
});
