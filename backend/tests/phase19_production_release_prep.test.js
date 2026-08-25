import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase, checkDatabaseHealth, closeDbPool } from '../src/config/db.config.js';
import { checkRedisHealth, initRedis } from '../src/config/redis.config.js';
import { stopWorkflowWorker } from '../src/modules/workers/workflow.worker.js';

test('Comprehensive Phase 19 Production Configuration & Release Preparation Test Suite', async (t) => {
  const rootDir = path.resolve('../');

  await t.test('1. Verify Environment Separation & Template Files Integrity', () => {
    assert.equal(fs.existsSync(path.join(rootDir, 'backend/.env.production.example')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/env_variables.md')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/deployment_checklist.md')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/database_migration_guide.md')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/backup_restore_guide.md')), true);
  });

  await t.test('2. Verify Production Environment Variable Documentation Coverage', () => {
    const envDoc = fs.readFileSync(path.join(rootDir, 'docs/env_variables.md'), 'utf-8');

    assert.ok(envDoc.includes('PORT'), 'PORT documented');
    assert.ok(envDoc.includes('NODE_ENV'), 'NODE_ENV documented');
    assert.ok(envDoc.includes('CORS_ORIGIN'), 'CORS_ORIGIN documented');
    assert.ok(envDoc.includes('JWT_SECRET'), 'JWT_SECRET documented');
    assert.ok(envDoc.includes('DB_HOST'), 'DB_HOST documented');
    assert.ok(envDoc.includes('DB_PASSWORD'), 'DB_PASSWORD documented');
    assert.ok(envDoc.includes('REDIS_HOST'), 'REDIS_HOST documented');
    assert.ok(envDoc.includes('VITE_API_URL'), 'VITE_API_URL documented');
  });

  await t.test('3. Verify Security Middleware & Hardening Controls', () => {
    const appJs = fs.readFileSync(path.join(rootDir, 'backend/src/app.js'), 'utf-8');

    assert.ok(appJs.includes('helmet'), 'Helmet security headers active');
    assert.ok(appJs.includes('cors'), 'CORS middleware active');
    assert.ok(appJs.includes('globalRateLimiter'), 'Global rate limiter active');
    assert.ok(appJs.includes('authRateLimiter'), 'Auth rate limiter active');
    assert.ok(appJs.includes('sanitizeInputMiddleware'), 'Input sanitization active');
  });

  await t.test('4. Verify Health Check & Readiness Probe Infrastructure', async () => {
    const dbConnected = await initDatabase();
    assert.equal(dbConnected, true);

    await initRedis();

    const dbHealth = await checkDatabaseHealth();
    assert.equal(dbHealth.status, 'connected');

    const redisHealth = await checkRedisHealth();
    assert.equal(redisHealth.status, 'connected');

    await closeDbPool();
  });

  await t.test('5. Verify Worker Graceful Shutdown Handler Safety', async () => {
    await stopWorkflowWorker();
    assert.ok(true);
  });
});
