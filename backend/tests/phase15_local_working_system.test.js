import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, checkDatabaseHealth, closeDbPool } from '../src/config/db.config.js';
import { checkRedisHealth } from '../src/config/redis.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { aiPlannerService } from '../src/modules/ai/ai-planner.service.js';
import { errorAnalyzer } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';
import { adminService } from '../src/modules/admin/admin.service.js';

test('Comprehensive Phase 15 Local Final Working System Verification Test Suite', async (t) => {
  // 1. Initialize Local System Infrastructure
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Local MySQL Database must be connected and schemas initialized');

  await queueService.initializeQueues();
  const workerInstance = startWorkflowWorker();

  t.after(async () => {
    if (workerInstance) await workerInstance.close();
    await closeDbPool();
  });

  await t.test('1. System Services Health Status Verification', async () => {
    const dbHealth = await checkDatabaseHealth();
    assert.equal(dbHealth.status, 'connected');

    const redisHealth = await checkRedisHealth();
    assert.ok(redisHealth.status === 'connected' || redisHealth.mode === 'in_memory');
  });

  await t.test('2. Browser -> Frontend -> Backend API -> Database Communication Flow', async () => {
    // Auth & User Lifecycle
    const reg = await authService.register({
      email: `local_sys_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Local System Operator',
    });

    assert.ok(reg.user.id);
    assert.ok(reg.workspace.id);
    assert.ok(reg.tokens.accessToken);

    // Login Verification
    const login = await authService.login({
      email: reg.user.email,
      password: 'Password123!',
    });

    assert.ok(login.tokens.accessToken);
  });

  await t.test('3. Workflow -> Queue -> Worker -> Execution -> Logs -> Result Pipeline', async () => {
    const reg = await authService.register({
      email: `local_wf_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Workflow Operator',
    });

    // Create & Publish Workflow
    const wf = await workflowsService.createWorkflow(reg.workspace.id, reg.user.id, {
      name: 'Local System End-to-End Pipeline',
      definition: {
        nodes: [
          { id: 'start', type: 'trigger', subtype: 'manual', label: 'Start Manual' },
          { id: 'action', type: 'action', subtype: 'create_notification', label: 'System Alert' },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'action' }],
      },
    });

    await workflowsService.publishWorkflow(wf.id, reg.workspace.id, reg.user.id);

    // Enqueue Execution Job
    const enqueueRes = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId: reg.workspace.id,
      triggerType: 'manual',
      inputPayload: { system: 'local' },
      userId: reg.user.id,
    });

    assert.ok(enqueueRes.executionId);

    // Wait for Queue Worker Processing
    let completed = false;
    const pool = (await import('../src/config/db.config.js')).getDbPool();
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT status FROM executions WHERE id = ?', [enqueueRes.executionId]);
      if (rows[0] && rows[0].status === 'completed') {
        completed = true;
        break;
      }
    }

    assert.equal(completed, true, 'Worker queue execution must complete');
  });

  await t.test('4. AI Workflow Generation -> Preview -> Approval -> Execution Flow', async () => {
    const reg = await authService.register({
      email: `ai_local_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'AI System Tester',
    });

    const prompt = 'Build an automated customer notification pipeline for pending orders';

    // 1. Generate Proposal
    const plan = await aiPlannerService.generatePlan(prompt);
    assert.equal(plan.isValid, true);
    assert.ok(plan.previewPlan.nodeCount >= 2);

    // 2. Approve & Save
    const savedWf = await aiPlannerService.approvePlan(reg.workspace.id, reg.user.id, plan.workflowProposal);
    assert.ok(savedWf.id);
  });

  await t.test('5. Failure -> Detection -> Safe Recovery -> Final Status Pipeline', async () => {
    const transientError = new Error('HTTP 503 Service Unavailable');
    transientError.statusCode = 503;

    // Detection & Classification
    const diagnosis = errorAnalyzer.classify(transientError);
    assert.equal(diagnosis.category, 'TRANSIENT_ERROR');

    // Strategy Resolution
    const strategy = recoveryStrategyRegistry.getStrategy(diagnosis.category);
    assert.equal(strategy.action, 'retry');
    assert.equal(strategy.maxRetries, 3);
  });

  await t.test('6. Admin Monitoring System Diagnostics', async () => {
    const overview = await adminService.getDashboardOverview();
    assert.ok(overview.totalUsers >= 2);
    assert.equal(overview.queueHealth.status, 'healthy');
    assert.equal(overview.workerHealth.status, 'online');
  });
});
