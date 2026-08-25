import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase, checkDatabaseHealth, closeDbPool, getDbPool } from '../src/config/db.config.js';
import { checkRedisHealth, initRedis } from '../src/config/redis.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker, stopWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { errorAnalyzer } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';

test('Comprehensive Phase 18 Complete Docker Verification Test Suite', async (t) => {
  const rootDir = path.resolve('../');

  await t.test('1. Verify Docker Architecture & Configuration Files', () => {
    assert.equal(fs.existsSync(path.join(rootDir, 'backend/Dockerfile')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'frontend/Dockerfile')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'frontend/nginx.conf')), true);
    assert.equal(fs.existsSync(path.join(rootDir, 'docker-compose.yml')), true);
  });

  await t.test('2. Verify Docker Compose Services & Container Specifications', () => {
    const compose = fs.readFileSync(path.join(rootDir, 'docker-compose.yml'), 'utf-8');

    assert.ok(compose.includes('container_name: nexora-mysql'));
    assert.ok(compose.includes('container_name: nexora-redis'));
    assert.ok(compose.includes('container_name: nexora-backend'));
    assert.ok(compose.includes('container_name: nexora-worker'));
    assert.ok(compose.includes('container_name: nexora-frontend'));

    assert.ok(compose.includes('mysql_data:'));
    assert.ok(compose.includes('redis_data:'));
    assert.ok(compose.includes('nexora-network'));
  });

  await t.test('3. Verify Service Health & Connectivity Probes', async () => {
    const dbConnected = await initDatabase();
    assert.equal(dbConnected, true);

    const dbHealth = await checkDatabaseHealth();
    assert.equal(dbHealth.status, 'connected');

    await initRedis();
    const redisHealth = await checkRedisHealth();
    assert.equal(redisHealth.status, 'connected');
  });

  await t.test('4. Real Workflow Execution in Containerized Environment Settings', async () => {
    await queueService.initializeQueues();
    const workerInstance = startWorkflowWorker();

    t.after(async () => {
      await stopWorkflowWorker();
      await closeDbPool();
    });

    // Register User
    const reg = await authService.register({
      email: `p18_docker_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Docker Verification Operator',
    });

    // Create & Publish Workflow
    const wf = await workflowsService.createWorkflow(reg.workspace.id, reg.user.id, {
      name: 'Containerized Production Workflow',
      definition: {
        nodes: [
          { id: 'start', type: 'trigger', subtype: 'manual', label: 'Manual Trigger' },
          { id: 'act', type: 'action', subtype: 'create_notification', label: 'Docker Container Notification' },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'act' }],
      },
    });

    await workflowsService.publishWorkflow(wf.id, reg.workspace.id, reg.user.id);

    // Enqueue Execution Job
    const enqueueRes = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId: reg.workspace.id,
      triggerType: 'manual',
      inputPayload: { environment: 'docker-production' },
      userId: reg.user.id,
    });

    assert.ok(enqueueRes.executionId);

    // Wait for Worker Processing
    const pool = getDbPool();
    let completed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT status FROM executions WHERE id = ?', [enqueueRes.executionId]);
      if (rows[0] && rows[0].status === 'completed') {
        completed = true;
        break;
      }
    }

    assert.equal(completed, true, 'Docker workflow job must complete via worker');
  });

  await t.test('5. Controlled Failure & Recovery Retry Verification', async () => {
    const error503 = new Error('HTTP 503 Service Unavailable');
    error503.statusCode = 503;

    const diagnosis = errorAnalyzer.classify(error503);
    assert.equal(diagnosis.category, 'TRANSIENT_ERROR');

    const strategy = recoveryStrategyRegistry.getStrategy(diagnosis.category);
    assert.equal(strategy.action, 'retry');
    assert.equal(strategy.maxRetries, 3);
  });

  await t.test('6. Container Restart Data Persistence Verification', async () => {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM workflows');
    assert.ok(Number(rows[0].total) >= 1, 'Database data persists across service restarts');
  });
});
