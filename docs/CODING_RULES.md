# NEXORA AI — Architecture & Coding Standards

## 1. Core Architectural Rules

1. **Modular Isolation**: Every major feature is isolated in `src/modules/<feature-name>`. High coupling between unrelated modules is strictly forbidden.
2. **Small & Focused Files**: Keep individual files small (< 300 lines). If a file exceeds this limit, refactor into sub-utilities or helper services.
3. **Layered Separation**:
   - **Routes**: Path mapping & validation middleware invocation.
   - **Controllers**: Request extraction, invoking service layer, returning HTTP responses.
   - **Services**: Pure business logic processing.
   - **Repositories/Models**: Database access queries (no business rules in SQL calls).
4. **Environment Variables**:
   - Secrets, DB passwords, API credentials MUST be read from `process.env`.
   - Never hardcode API tokens, keys, database connection strings, or host addresses.
5. **No Swallowed Errors**:
   - Every `async` block must have error catching or delegate to the global error middleware.
   - Never use empty `catch (err) {}` blocks.
6. **API Boundary Validation**:
   - Use `zod` or `joi` validation middleware on every incoming `req.body`, `req.query`, and `req.params`.

---

## 2. Naming Conventions

- **Files & Directories**: `kebab-case` (e.g., `workflow-engine.service.js`, `jwt-auth.middleware.js`).
- **Classes**: `PascalCase` (e.g., `WorkflowEngineService`, `ExecutionRepository`).
- **Functions & Methods**: `camelCase` (e.g., `executeWorkflowNode`, `validateUserCredentials`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`, `JWT_SECRET_KEY`).
- **Database Tables & Columns**: `snake_case` (e.g., `workspace_members`, `created_at`).

---

## 3. Workflow Engine Execution Rules

- **UI Decoupling**: The backend workflow execution engine must execute DAG nodes independently of the frontend UI state.
- **Integration Decoupling**: Third-party API integrations (Slack, OpenRouter, GitHub, Webhooks) must expose standardized `execute(config, payload)` contracts so new integrations can be added without modifying core engine traversal logic.
- **State Immutability**: Node context variables returned by previous nodes must be immutable snapshots stored in `execution_logs`.
