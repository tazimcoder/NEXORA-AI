# NEXORA AI — Dockerization & Container Management Guide

This document outlines the container architecture and management commands for NEXORA AI.

---

## Containerized Service Architecture

1. **`nexora-frontend`**: Serves SPA distribution bundle via Nginx (Port `5173:80`). Proxies `/api/` traffic to `nexora-backend`.
2. **`nexora-backend`**: Node.js Express API service engine (Port `5000:5000`). Communicates with MySQL and Redis.
3. **`nexora-worker`**: Independent Node.js execution worker daemon processing workflow jobs from Redis / BullMQ queues.
4. **`nexora-mysql`**: MySQL 8.0 database engine (Port `3306:3306`) with persistent volume `mysql_data`.
5. **`nexora-redis`**: Redis 7 Alpine cache and BullMQ broker (Port `6379:6379`) with persistent volume `redis_data`.

---

## Management Commands

### 1. Build Containers
```bash
docker compose build
```

### 2. Start Application Stack (Background Daemon)
```bash
docker compose up -d
```

### 3. Check Live Logs
```bash
# All services
docker compose logs -f

# Specific service logs (e.g. worker or backend)
docker compose logs -f worker
docker compose logs -f backend
```

### 4. Stop Application Stack
```bash
docker compose down
```

### 5. Rebuild and Restart Stack
```bash
docker compose down
docker compose up -d --build
```
