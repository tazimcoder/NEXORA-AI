# NEXORA AI — Technical Architecture

## 1. System Overview

NEXORA AI is a production-grade, modular, AI-powered multi-task automation platform. The platform converts natural language requests into structured, executable workflows, monitors execution in real-time, retries failed nodes using self-healing strategies, and returns execution metrics.

```
[ User Prompt / Canvas UI ]
          │
          ▼
    [ AI Planner ]
          │
          ▼
   [ Workflow Graph ]
          │
          ▼
   [ Workflow Engine ]
          │
          ▼
 [ Redis Queue (BullMQ) ]
          │
          ▼
   [ Worker Cluster ] ──► (Triggers, Conditions, Actions, Self-Healing)
          │
          ▼
 [ Logs & Real-Time Events ] (Socket.IO + MySQL DB)
```

## 2. Core Modules Architecture

Every core capability in NEXORA AI is isolated in its own feature module:

1. **Authentication**: JWT generation, token refresh, password hashing (bcrypt), RBAC.
2. **Users**: User profiles, preferences, role assignments.
3. **Workspaces**: Multi-tenant workspace management, organization boundaries, team access controls.
4. **Workflow Builder**: Graph serialization, validation, node connection rules, React Flow schema formatting.
5. **Workflow Engine**: Graph traversal (DAG evaluator), state machine, execution lifecycle management.
6. **Trigger Engine**: Webhook listeners, Cron schedulers, system event triggers.
7. **Condition Engine**: Expressions evaluator, branching (If/Else), iterative loops (For-Each), filtering.
8. **Action Engine**: HTTP client, API integration connectors, script handlers, data transformers.
9. **Execution Engine**: Per-node context isolation, output passing, execution state snapshotting.
10. **Scheduler**: Distributed cron scheduling, time-zone handling, recurring trigger dispatching.
11. **Queue**: BullMQ job queues, concurrency control, job priority management.
12. **Worker System**: Decoupled worker process pool, heartbeat reporting, task consumption.
13. **Integrations**: Standardized API connectors (OAuth2, API keys, webhooks) decoupled from core logic.
14. **AI Planner**: Natural language parser, node graph synthesis, prompt context construction.
15. **AI Agents**: Autonomous task execution sub-agents with dedicated tools and memory access.
16. **AI Memory**: Persistent contextual memory (vector/key-value storage) per workspace/workflow.
17. **Self-Healing Automation**: Failure interceptor, error pattern recognition, automatic parameter tweak & retry.
18. **Execution Logs**: Granular input/output/error tracing per node execution with real-time websocket broadcasting.
19. **Notifications**: Multi-channel alerts (Email, Webhooks, In-App).
20. **Audit Logs**: Immutable activity log recording all user and API interactions.
21. **Admin Panel**: Tenant monitoring, system health metrics, queue management, worker node status.

## 3. Communication Protocols

- **HTTP / REST API**: JSON APIs for workflow management, user auth, integrations configuration.
- **WebSockets / Socket.IO**: Real-time channel for live log streams, canvas execution status highlights, worker status.
- **Redis Pub/Sub & Queues**: Decoupled async job processing between API gateway and execution workers.
