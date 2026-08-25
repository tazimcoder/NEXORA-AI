# NEXORA AI — REST & WebSocket API Specification

## 1. Global Request / Response Formats

All API responses follow a strict, standardized JSON contract:

### Success Response Contract
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response Contract
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "Invalid authentication token provided.",
    "details": []
  }
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

- `POST /api/v1/auth/register` — Create new user account.
- `POST /api/v1/auth/login` — Authenticate and receive JWT pair (access + refresh token).
- `POST /api/v1/auth/refresh` — Issue new access token using refresh token.
- `POST /api/v1/auth/logout` — Invalidate current session.
- `GET /api/v1/auth/me` — Retrieve authenticated user profile.

---

## 3. Workspace Endpoints (`/api/v1/workspaces`)

- `GET /api/v1/workspaces` — List workspaces owned by or accessible to user.
- `POST /api/v1/workspaces` — Create a new workspace.
- `GET /api/v1/workspaces/:id` — Get workspace metadata and stats.
- `PUT /api/v1/workspaces/:id` — Update workspace properties.
- `GET /api/v1/workspaces/:id/members` — List workspace members.
- `POST /api/v1/workspaces/:id/members` — Invite/add member to workspace.

---

## 4. Workflow Endpoints (`/api/v1/workflows`)

- `GET /api/v1/workflows` — List workflows in active workspace.
- `POST /api/v1/workflows` — Create new workflow blueprint.
- `GET /api/v1/workflows/:id` — Fetch workflow structure (Nodes & Edges AST).
- `PUT /api/v1/workflows/:id` — Save updated workflow canvas definition.
- `DELETE /api/v1/workflows/:id` — Soft-delete workflow.
- `POST /api/v1/workflows/:id/execute` — Manually trigger workflow execution run.
- `POST /api/v1/workflows/:id/toggle` — Enable/disable workflow execution triggers.

---

## 5. Execution & Log Endpoints (`/api/v1/executions`)

- `GET /api/v1/executions` — List executions across workspace with status filters.
- `GET /api/v1/executions/:id` — Get detailed status of single execution run.
- `GET /api/v1/executions/:id/logs` — Fetch per-node execution logs.
- `POST /api/v1/executions/:id/retry` — Trigger manual retry for failed execution node.

---

## 6. AI Planner Endpoints (`/api/v1/ai`)

- `POST /api/v1/ai/plan` — Submit natural language prompt to generate workflow AST.
- `POST /api/v1/ai/explain` — Get AI analysis/explanation of a workflow failure.
- `POST /api/v1/ai/heal` — Trigger AI self-healing intervention on failed step.

---

## 7. Webhook & Integration Endpoints

- `POST /api/v1/webhooks/catch/:triggerId` — Public endpoint receiving external webhooks.
- `GET /api/v1/integrations` — List available and connected integrations.
- `POST /api/v1/integrations` — Configure external API credentials (AES-256 encrypted).

---

## 8. Real-Time WebSockets (`Socket.IO`)

- `join_execution(execution_id)` — Client joins real-time run telemetry stream.
- `leave_execution(execution_id)` — Unsubscribe from run stream.
- Event `node_status_change` — Pushed when node starts/succeeds/fails.
- Event `execution_log_stream` — Live streaming log output per step.
- Event `self_healing_alert` — Pushed when auto-repair intervenes.
