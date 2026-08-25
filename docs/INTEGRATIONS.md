# NEXORA AI — Integration Engine & Provider Plugins

## 1. Overview

The Integration Engine provides a pluggable provider architecture for connecting external third-party services (LLMs, messaging platforms, webhooks, databases) to NEXORA AI workflows.

Core principles:
- **Zero Monolithic Coupling**: Integration logic is completely isolated inside dedicated provider plugins in `src/modules/integrations/providers/`.
- **Plugin Contract**: Providers extend `BaseIntegrationProvider` and register with `IntegrationRegistry`.
- **Credential Security**: Credentials are encrypted at rest with AES-256-GCM. Secret keys are automatically masked in log outputs (e.g. `sk-or-v1-••••••••3f9a`).

---

## 2. Pluggable Integration Architecture

```
[ Workflow Engine ] ──► (Invokes provider by name via IntegrationRegistry)
                               │
                               ▼
                 [ BaseIntegrationProvider Contract ]
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   [ OpenRouter Plugin ] [ Slack Plugin ] [ Webhook Plugin ]
```

---

## 3. OpenRouter LLM Integration Provider Plugin

Key features:
- **Unified LLM Gateway**: Connects to 100+ LLMs (GPT-4o, Claude 3.5, Gemini 1.5, Llama 3.1) via OpenRouter.
- **Actions Supported**:
  - `chat_completion`: Multi-turn conversational model output.
  - `generate_text`: Prompt completion text generation.
  - `summarize`: Automatic document summarization.
- **Validation**: Schema-based validation via Zod for credentials (`apiKey`) and configurations (`model`, `temperature`, `max_tokens`, `timeout_ms`, `max_retries`).
- **Resilience**:
  - Configurable Timeout Handling (default 30,000ms).
  - Retry Handling with Exponential Backoff for 429 (Rate Limit) and 5xx (Server Error) transient errors.
- **Error Mapping**:
  - `401` ──► `OpenRouterAuthenticationError`
  - `402` ──► `OpenRouterQuotaExceededError`
  - `429` ──► `OpenRouterRateLimitError`
  - `400` ──► `OpenRouterInvalidRequestError`
  - `502/503` ──► `OpenRouterServerError`

---

## 4. API Endpoints

- `GET /api/v1/integrations/providers` — List all registered integration provider plugins and their configuration schemas.
- `POST /api/v1/integrations/test` — Test provider connection with credentials.
- `POST /api/v1/integrations/execute` — Execute a provider action on behalf of a workflow node.
