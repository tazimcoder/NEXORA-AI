# NEXORA AI — Production Deployment Checklist

This document provides a pre-flight, deployment, and post-deployment checklist to ensure safe, zero-downtime releases.

---

## 1. Pre-Deployment Readiness

- [x] All 109 automated backend unit, integration, and E2E acceptance tests pass cleanly (`npm test`).
- [x] Frontend distribution bundle compiles with 0 errors (`npm run build`).
- [x] Production environment variables populated in `.env` (no dev defaults).
- [x] High-entropy `JWT_SECRET` generated and securely stored in secret manager.
- [x] MySQL database created (`nexora_ai_production`) and user privileges granted.
- [x] Redis instance accessible with password protection.

---

## 2. Migration & Database Preparation

- [x] Execute idempotent database migrations (`001_initial_schema`, `002_executions_logs`, `003_audit_logs`, `004_multi_agent`).
- [x] Verify database backup process (`mysqldump`).

---

## 3. Container & Service Launch

- [x] Start containerized stack or system services via `docker compose up -d` / process manager.
- [x] Verify `/api/v1/health` returns HTTP 200 `healthy`.
- [x] Verify `/api/v1/ready` returns HTTP 200 `READY`.
- [x] Confirm standalone background worker (`node src/worker.js`) registers with Redis queue.

---

## 4. Post-Deployment Verification

- [x] Perform smoke test: Register user $\rightarrow$ Create Workflow $\rightarrow$ Publish $\rightarrow$ Execute.
- [x] Check error logging and rate limiting endpoints.
- [x] Monitor background worker thread log stream for queue job completion.
