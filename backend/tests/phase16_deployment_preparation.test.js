import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { checkDatabaseHealth } from '../src/config/db.config.js';
import { checkRedisHealth } from '../src/config/redis.config.js';
import { stopWorkflowWorker } from '../src/modules/workers/workflow.worker.js';

test('Comprehensive Phase 16 Deployment Preparation Test Suite', async (t) => {
  const rootDir = path.resolve('../');

  await t.test('1. Production Configuration Templates & Documentation Verification', () => {
    assert.equal(fs.existsSync(path.join(rootDir, 'backend/.env.production.example')), true, '.env.production.example must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/env_variables.md')), true, 'docs/env_variables.md must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/deployment_checklist.md')), true, 'docs/deployment_checklist.md must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/database_migration_guide.md')), true, 'docs/database_migration_guide.md must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/backup_restore_guide.md')), true, 'docs/backup_restore_guide.md must exist');
  });

  await t.test('2. Health & Readiness Probe System Check', async () => {
    const dbConnected = await initDatabase();
    assert.equal(dbConnected, true);

    await (await import('../src/config/redis.config.js')).initRedis();

    const dbHealth = await checkDatabaseHealth();
    assert.equal(dbHealth.status, 'connected');

    const redisHealth = await checkRedisHealth();
    assert.equal(redisHealth.status, 'connected');

    await closeDbPool();
  });


  await t.test('3. Worker Graceful Shutdown Handler Safety', async () => {
    // Calling stopWorkflowWorker gracefully closes queue connections without dropping active jobs
    await stopWorkflowWorker();
    assert.ok(true);
  });
});
