# NEXORA AI — Database Migration Procedure Guide

This document describes the schema migration procedure for NEXORA AI.

---

## Migration Architecture

Schema migrations are stored inside `backend/src/config/db.config.js` and execute automatically during service initialization. Migrations use `IF NOT EXISTS` constructs ensuring safe, idempotent re-runs.

### Applied Schema Migrations:
1. `001_initial_schema`: Creates `users`, `workspaces`, `workspace_members`, `workflows`, `workflow_versions`.
2. `002_executions_logs`: Creates `executions` and `execution_logs`.
3. `003_audit_logs`: Creates `audit_logs` and `notifications`.
4. `004_multi_agent`: Creates `agent_orchestrations`, `agent_tasks`, and `agent_logs`.

---

## Manual Migration Command

To apply database migrations manually against a target environment:

```bash
cd backend
NODE_ENV=production node -e "import('./src/config/db.config.js').then(m => m.initDatabase().then(() => process.exit(0)))"
```
