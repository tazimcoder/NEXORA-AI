# NEXORA AI — Security Architecture & Guidelines

## 1. Security Principles

- **Zero Hardcoded Secrets**: Secrets, tokens, encryption keys, and credentials must be loaded exclusively via environment variables.
- **AES-256 Encryption at Rest**: External integration tokens (OAuth refresh tokens, API keys) must be encrypted using AES-256-GCM before database insertion.
- **Tenant Isolation**: Every workspace query must explicitly filter by `workspace_id` to prevent cross-tenant data leaks.
- **Input Validation**: All incoming API payloads are sanitized and validated against explicit schema definitions at the HTTP boundary.

## 2. Authentication & Authorization

- **JWT Architecture**:
  - Access Token: Short-lived (15 minutes), passed via Authorization Bearer header.
  - Refresh Token: Long-lived (7 days), stored in secure HttpOnly HTTP cookies or encrypted store.
- **RBAC**: Roles (`owner`, `admin`, `editor`, `viewer`) control access to workflow modification, integration creation, and user management.

## 3. Rate Limiting & Protection

- API endpoints protected with rate-limiting middleware (`express-rate-limit`).
- Webhook trigger endpoints rate-limited per trigger ID to prevent denial of service attacks.
- Socket.IO connection authorization using JWT handshake validation.
