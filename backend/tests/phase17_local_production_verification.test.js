import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase, getDbPool, checkDatabaseHealth, closeDbPool } from '../src/config/db.config.js';
import { checkRedisHealth, initRedis } from '../src/config/redis.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker, stopWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { aiPlannerService } from '../src/modules/ai/ai-planner.service.js';
import { errorAnalyzer } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';
import { adminService } from '../src/modules/admin/admin.service.js';

test('Comprehensive Phase 17 Local Production Verification Test Suite', async (t) => {
  const rootDir = path.resolve('../');

  await t.test('1. Environment & Clean Package Inventory Check', () => {
    const backendPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'backend/package.json'), 'utf-8'));
    const frontendPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'frontend/package.json'), 'utf-8'));

    assert.equal(backendPkg.name, 'nexora-ai-backend');
    assert.equal(frontendPkg.name, 'nexora-ai-frontend');

    assert.ok(backendPkg.dependencies.express);
    assert.ok(backendPkg.dependencies.mysql2);
    assert.ok(backendPkg.dependencies.ioredis);
    assert.ok(backendPkg.dependencies.bullmq);

    assert.ok(frontendPkg.dependencies.react);
    assert.ok(frontendPkg.dependencies['@xyflow/react']);
    assert.ok(frontendPkg.dependencies.axios);
  });

  await t.test('2. MySQL Database Schema & Table Integrity Verification', async () => {
    const connected = await initDatabase();
    assert.equal(connected, true, 'Database must be connected');

    const dbHealth = await checkDatabaseHealth();
    assert.equal(dbHealth.status, 'connected');

    const pool = getDbPool();
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    assert.ok(tableNames.includes('users'));
    assert.ok(tableNames.includes('workspaces'));
    assert.ok(tableNames.includes('workflows'));
    assert.ok(tableNames.includes('workflow_versions'));
    assert.ok(tableNames.includes('executions'));
    assert.ok(tableNames.includes('execution_logs'));
    assert.ok(tableNames.includes('audit_logs'));
    assert.ok(tableNames.includes('agent_orchestrations'));
  });

  await t.test('3. Redis Cache & Queue Broker Connection Verification', async () => {
    await initRedis();
    const redisHealth = await checkRedisHealth();
    assert.ok(redisHealth.status === 'connected');
  });

  await t.test('4. Standalone Queue Worker Startup & Registration Verification', async () => {
    await queueService.initializeQueues();
    const workerInstance = startWorkflowWorker();
    assert.ok(workerInstance, 'Worker instance must start');

    t.after(async () => {
      await stopWorkflowWorker();
      await closeDbPool();
    });
  });

  await t.test('5. Complete End-to-End Automation Pipeline (Trigger -> Condition -> Action -> Result)', async () => {
    // 1. User Register & Login
    const userReg = await authService.register({
      email: `p17_user_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Phase17 Operator',
    });

    const userId = userReg.user.id;
    const workspaceId = userReg.workspace.id;

    // 2. Create Workflow with Trigger -> Condition -> Action
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Phase 17 Full E2E Automation Pipeline',
      definition: {
        nodes: [
          { id: 'trig_1', type: 'trigger', subtype: 'manual', label: 'Manual Automation Trigger' },
          { id: 'cond_1', type: 'condition', subtype: 'if_else', label: 'Check Priority Status', config: { field: 'priority', operator: 'equals', value: 'high' } },
          { id: 'act_1', type: 'action', subtype: 'create_notification', label: 'Dispatch High Priority Alert' },
        ],
        edges: [
          { id: 'e1', source: 'trig_1', target: 'cond_1' },
          { id: 'e2', source: 'cond_1', target: 'act_1', sourceHandle: 'true' },
        ],
      },
    });

    assert.ok(wf.id);

    // 3. Publish Workflow v1
    const published = await workflowsService.publishWorkflow(wf.id, workspaceId, userId);
    assert.equal(published.status, 'published');

    // 4. Enqueue Job & Process via Worker
    const enqueueRes = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { priority: 'high' },
      userId,
    });

    assert.ok(enqueueRes.executionId);

    // 5. Wait for Worker Processing
    const pool = getDbPool();
    let completedExec = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [enqueueRes.executionId]);
      if (rows[0] && rows[0].status === 'completed') {
        completedExec = rows[0];
        break;
      }
    }

    assert.ok(completedExec, 'Execution must complete via worker');
    assert.equal(completedExec.status, 'completed');

    // 6. Verify Execution Logs Saved
    const [logs] = await pool.query('SELECT * FROM execution_logs WHERE execution_id = ?', [enqueueRes.executionId]);
    assert.ok(logs.length >= 1, 'Execution logs must be stored in database');
  });

  await t.test('6. Controlled Failure & Safe Recovery Verification', async () => {
    const error503 = new Error('HTTP 503 Gateway Timeout');
    error503.statusCode = 503;

    const diagnosis = errorAnalyzer.classify(error503);
    assert.equal(diagnosis.category, 'TRANSIENT_ERROR');

    const strategy = recoveryStrategyRegistry.getStrategy(diagnosis.category);
    assert.equal(strategy.action, 'retry');
    assert.equal(strategy.maxRetries, 3);
  });

  await t.test('7. AI Workflow Generation -> Preview -> Approval -> Execution Verification', async () => {
    const prompt = 'Build an automated email reminder for inactive user accounts';

    // 1. AI Proposal Generation
    const plan = await aiPlannerService.generatePlan(prompt);
    assert.equal(plan.isValid, true);
    assert.ok(plan.previewPlan.nodeCount >= 2);

    // 2. User Approval & Persistence
    const pool = getDbPool();
    const [users] = await pool.query('SELECT id, email FROM users LIMIT 1');
    const [workspaces] = await pool.query('SELECT id FROM workspaces LIMIT 1');

    if (users[0] && workspaces[0]) {
      const savedWf = await aiPlannerService.approvePlan(workspaces[0].id, users[0].id, plan.workflowProposal);
      assert.ok(savedWf.id);
    }
  });

  await t.test('8. Admin Panel System Diagnostics & Security Check', async () => {
    const overview = await adminService.getDashboardOverview();

    assert.ok(overview.totalUsers >= 1);
    assert.equal(overview.queueHealth.status, 'healthy');
    assert.equal(overview.workerHealth.status, 'online');
  });
});
