import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { logger } from '../../../utils/logger.js';
import { maskSecret } from '../../../utils/crypto.utils.js';

// Provider-specific Error Classes
export class OpenRouterError extends Error {
  constructor(message, statusCode = 500, code = 'OPENROUTER_ERROR', details = null) {
    super(message);
    this.name = 'OpenRouterError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class OpenRouterAuthenticationError extends OpenRouterError {
  constructor(message = 'Invalid OpenRouter API Key provided') {
    super(message, 401, 'OPENROUTER_AUTH_ERROR');
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message = 'OpenRouter rate limit exceeded. Please retry after backoff.') {
    super(message, 429, 'OPENROUTER_RATE_LIMIT');
  }
}

export class OpenRouterQuotaExceededError extends OpenRouterError {
  constructor(message = 'OpenRouter account credits / quota exceeded') {
    super(message, 402, 'OPENROUTER_QUOTA_EXCEEDED');
  }
}

export class OpenRouterInvalidRequestError extends OpenRouterError {
  constructor(message, details = null) {
    super(message || 'Invalid parameters supplied to OpenRouter API', 400, 'OPENROUTER_INVALID_REQUEST', details);
  }
}

export class OpenRouterServerError extends OpenRouterError {
  constructor(message = 'OpenRouter upstream server error') {
    super(message, 502, 'OPENROUTER_SERVER_ERROR');
  }
}

// Zod Validation Schemas
const CredentialsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').startsWith('sk-or-', 'OpenRouter API key must start with sk-or-'),
  siteUrl: z.string().url().optional(),
  siteName: z.string().optional(),
});

const ConfigSchema = z.object({
  model: z.string().min(1, 'Model identifier is required').default('openai/gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().max(128000).default(2048),
  top_p: z.number().min(0).max(1).default(1),
  system_prompt: z.string().optional(),
  timeout_ms: z.number().positive().default(30000),
  max_retries: z.number().min(0).max(5).default(3),
});

export class OpenRouterIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'openrouter',
      'OpenRouter LLM Provider',
      'Unified API integration for LLM text generation, chat completion, and AI analysis via OpenRouter',
      '1.0.0'
    );
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  getSchema() {
    return {
      credentials: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-or-v1-...' },
        { key: 'siteUrl', label: 'Site URL (Optional)', type: 'text', required: false, placeholder: 'https://nexora.ai' },
        { key: 'siteName', label: 'Site Name (Optional)', type: 'text', required: false, placeholder: 'NEXORA AI' },
      ],
      config: [
        { key: 'model', label: 'Model', type: 'select', default: 'openai/gpt-4o-mini', options: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct'] },
        { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7 },
        { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 2048 },
        { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', default: 30000 },
        { key: 'max_retries', label: 'Max Retries', type: 'number', default: 3 },
      ],
      actions: ['chat_completion', 'generate_text', 'summarize'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials);
    if (!result.success) {
      throw new OpenRouterInvalidRequestError('Credential validation failed', result.error.format());
    }
    return result.data;
  }

  validateConfig(config) {
    const result = ConfigSchema.safeParse(config || {});
    if (!result.success) {
      throw new OpenRouterInvalidRequestError('Configuration validation failed', result.error.format());
    }
    return result.data;
  }

  mapResponseError(status, errorBody) {
    const errorMessage = errorBody?.error?.message || errorBody?.message || `HTTP ${status} OpenRouter Error`;
    logger.warn(`OpenRouter Provider Error Mapping [HTTP ${status}]: ${errorMessage}`);

    switch (status) {
      case 401:
        return new OpenRouterAuthenticationError(errorMessage);
      case 402:
        return new OpenRouterQuotaExceededError(errorMessage);
      case 429:
        return new OpenRouterRateLimitError(errorMessage);
      case 400:
        return new OpenRouterInvalidRequestError(errorMessage, errorBody);
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterServerError(errorMessage);
      default:
        return new OpenRouterError(errorMessage, status);
    }
  }

  async fetchWithRetryAndTimeout(url, options, timeoutMs, maxRetries) {
    let attempt = 0;
    let delay = 500;

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json();
        }

        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { message: await response.text() };
        }

        const mappedError = this.mapResponseError(response.status, errorBody);

        // Retry only on transient errors (429 Rate limit, 502/503/504 Server error)
        const isTransient = response.status === 429 || response.status >= 500;
        if (isTransient && attempt <= maxRetries) {
          logger.warn(`OpenRouter transient error [Attempt ${attempt}/${maxRetries}]. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }

        throw mappedError;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          const timeoutErr = new OpenRouterError(`OpenRouter request timed out after ${timeoutMs}ms`, 408, 'OPENROUTER_TIMEOUT');
          if (attempt <= maxRetries) {
            logger.warn(`OpenRouter timeout [Attempt ${attempt}/${maxRetries}]. Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          throw timeoutErr;
        }

        if (error instanceof OpenRouterError) {
          throw error;
        }

        throw new OpenRouterError(`Network error communicating with OpenRouter: ${error.message}`, 500);
      }
    }
  }

  async execute(action, params = {}, credentials = {}) {
    const validCreds = this.validateCredentials(credentials);
    const validConfig = this.validateConfig(params.config);

    logger.info(`Executing OpenRouter action [${action}] using key [${maskSecret(validCreds.apiKey)}]`);

    let messages = [];

    if (action === 'chat_completion') {
      if (!Array.isArray(params.messages) || params.messages.length === 0) {
        throw new OpenRouterInvalidRequestError('chat_completion action requires a non-empty messages array');
      }
      messages = params.messages;
      if (validConfig.system_prompt) {
        messages = [{ role: 'system', content: validConfig.system_prompt }, ...messages];
      }
    } else if (action === 'generate_text') {
      if (!params.prompt) {
        throw new OpenRouterInvalidRequestError('generate_text action requires a prompt parameter');
      }
      messages = [];
      if (validConfig.system_prompt) {
        messages.push({ role: 'system', content: validConfig.system_prompt });
      }
      messages.push({ role: 'user', content: params.prompt });
    } else if (action === 'summarize') {
      if (!params.text) {
        throw new OpenRouterInvalidRequestError('summarize action requires a text parameter');
      }
      messages = [
        { role: 'system', content: validConfig.system_prompt || 'You are a helpful assistant. Summarize the provided text concisely.' },
        { role: 'user', content: `Please summarize the following text:\n\n${params.text}` },
      ];
    } else {
      throw new OpenRouterInvalidRequestError(`Unsupported action '${action}' for provider OpenRouter`);
    }

    const payload = {
      model: validConfig.model,
      messages,
      temperature: validConfig.temperature,
      max_tokens: validConfig.max_tokens,
      top_p: validConfig.top_p,
    };

    const headers = {
      'Authorization': `Bearer ${validCreds.apiKey}`,
      'Content-Type': 'application/json',
      ...(validCreds.siteUrl ? { 'HTTP-Referer': validCreds.siteUrl } : {}),
      ...(validCreds.siteName ? { 'X-Title': validCreds.siteName } : {}),
    };

    const response = await this.fetchWithRetryAndTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      validConfig.timeout_ms,
      validConfig.max_retries
    );

    const completionText = response.choices?.[0]?.message?.content || '';
    const usage = response.usage || {};

    return {
      success: true,
      provider: this.name,
      action,
      model: response.model || validConfig.model,
      output: {
        text: completionText,
        message: response.choices?.[0]?.message || { role: 'assistant', content: completionText },
      },
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
    };
  }

  async testConnection(credentials) {
    try {
      const validCreds = this.validateCredentials(credentials);
      // Run light chat completion test with 5 max tokens
      const result = await this.execute(
        'generate_text',
        { prompt: 'Ping', config: { max_tokens: 5, timeout_ms: 10000, max_retries: 1 } },
        validCreds
      );
      return {
        success: true,
        message: 'OpenRouter connection test successful',
        model: result.model,
      };
    } catch (error) {
      logger.warn(`OpenRouter connection test failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        code: error.code || 'CONNECTION_FAILED',
      };
    }
  }
}
