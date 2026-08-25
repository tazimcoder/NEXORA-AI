# NEXORA AI — Environment Variable Documentation

This document describes all environment variables used by NEXORA AI across backend API, background workers, and frontend services.

---

## 1. Backend Service Environment Variables

| Variable Name | Type | Default | Description | Required in Production |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | HTTP port on which Express server listens | Yes |
| `NODE_ENV` | String | `development` | Runtime environment (`development` / `production`) | Yes |
| `CORS_ORIGIN` | String | `*` | Allowed CORS origins for web client | Yes |
| `JWT_SECRET` | String | `dev_jwt_secret` | Secret key used for signing JWT access and refresh tokens | **CRITICAL** |
| `JWT_ACCESS_EXPIRATION` | String | `15m` | Access token lifespan | Yes |
| `JWT_REFRESH_EXPIRATION` | String | `7d` | Refresh token lifespan | Yes |
| `DB_HOST` | String | `127.0.0.1` | MySQL database hostname/IP | Yes |
| `DB_PORT` | Number | `3306` | MySQL database port | Yes |
| `DB_USER` | String | `root` | MySQL database user | Yes |
| `DB_PASSWORD` | String | `rootpassword` | MySQL database user password | **CRITICAL** |
| `DB_NAME` | String | `nexora_ai` | Target MySQL database schema name | Yes |
| `REDIS_HOST` | String | `127.0.0.1` | Redis server hostname/IP for BullMQ and caching | Yes |
| `REDIS_PORT` | Number | `6379` | Redis server port | Yes |
| `OPENROUTER_API_KEY` | String | None | OpenRouter API key for LLM workflow generation | Optional |

---

## 2. Frontend Web Environment Variables

| Variable Name | Type | Default | Description | Required in Production |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `/api/v1` | Base URL endpoint for backend REST API calls | Yes |

---

## 3. Worker Service Environment Variables

| Variable Name | Type | Default | Description | Required in Production |
| :--- | :--- | :--- | :--- | :--- |
| `DB_HOST` | String | `127.0.0.1` | MySQL database hostname | Yes |
| `REDIS_HOST` | String | `127.0.0.1` | Redis queue broker hostname | Yes |
| `CONCURRENCY` | Number | `5` | Maximum concurrent BullMQ worker job threads | Optional |
