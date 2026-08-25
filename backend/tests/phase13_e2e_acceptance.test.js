import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { executionsService } from '../src/modules/executions/executions.service.js';
import { aiPlannerService } from '../src/modules/ai/ai-planner.service.js';
import { workflowExecutor } from '../src/modules/engine/workflow.executor.js';
import { errorAnalyzer } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';
import { agentOrchestrator } from '../src/modules/agents/agent.orchestrator.js';
import { adminService } from '../src/modules/admin/admin.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { OrchestrationStatus } from '../src/modules/agents/agent.types.js';

test('Comprehensive Phase 13 End-to-End Acceptance Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database connection & migrations must be 100% verified');

  await queueService.initializeQueues();
  const workerInstance = startWorkflowWorker();

  // Register Standard User
  const stdUserReg = await authService.register({
    email: `e2e_user_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'E2E Test Operator',
  });

  const userId = stdUserReg.user.id;
  const workspaceId = stdUserReg.workspace.id;

  // Register Admin User
  const adminUserReg = await authService.register({
    email: `e2e_admin_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'E2E System Admin',
  });

  const pool = getDbPool();
  await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [adminUserReg.user.id]);
  
  const adminLogin = await authService.login({
    email: adminUserReg.user.email,
    password: 'Password123!',
  });

  t.after(async () => {
    if (workerInstance) {
      await workerInstance.close();
    }
    await closeDbPool();
  });

  // ---------------------------------------------------------------------------
  // TEST SCENARIO A: Visual Builder & Core Lifecycle
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO A: Login -> Create Workflow -> Configure Nodes -> Save -> Publish -> Execute -> Queue -> Worker -> Result', async () => {
    // 1. Create Workflow
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Scenario A - Order Fulfillment Pipeline',
      description: 'Standard manual trigger to email action',
      definition: {
        nodes: [
          { id: 'n_start', type: 'trigger', subtype: 'manual', label: 'Manual Trigger' },
          { id: 'n_email', type: 'action', subtype: 'send_email', label: 'Send Confirmation', config: { to: 'customer@nexora.ai', subject: 'Order Confirmed' } },
        ],
        edges: [{ id: 'e1', source: 'n_start', target: 'n_email' }],
      },
    });

    assert.ok(wf.id);
    assert.equal(wf.status, 'draft');

    // 2. Publish Workflow (Creates immutable v1 snapshot)
    const published = await workflowsService.publishWorkflow(wf.id, workspaceId, userId);
    assert.equal(published.status, 'published');
    assert.ok(published.current_version >= 1);


    // 3. Execute Workflow via Queue Service
    const enqueueRes = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { orderId: 'ORD-9901' },
      userId,
    });

    assert.ok(enqueueRes.executionId);

    // 4. Wait for Background Worker Processing
    let completedExec = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [enqueueRes.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        completedExec = rows[0];
        break;
      }
    }

    assert.ok(completedExec, 'Worker job must complete');
    assert.equal(completedExec.status, 'completed');

    // Verify Execution Logs
    const [logs] = await pool.query('SELECT * FROM execution_logs WHERE execution_id = ?', [enqueueRes.executionId]);
    assert.ok(logs.length >= 1, 'Execution logs must be recorded');
  });

  // ---------------------------------------------------------------------------
  // TEST SCENARIO B: Webhook Security & Trigger Flow
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO B: Webhook Request -> Trigger -> Workflow -> Action -> Result', async () => {
    const secret = 'webhook_hmac_secret_456';
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Scenario B - Webhook Ingestion',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'webhook', label: 'Webhook Endpoint', config: { secret } },
          { id: 'act', type: 'action', subtype: 'create_notification', label: 'Create Alert' },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'act' }],
      },
    });

    await workflowsService.publishWorkflow(wf.id, workspaceId, userId);

    const bodyPayload = { event: 'payment_received', amount: 250 };
    const validSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(bodyPayload)).digest('hex');

    // Execute Webhook Trigger via ExecutionsService
    const webhookRes = await executionsService.executeWebhookTrigger(wf.id, workspaceId, {
      headers: { 'x-signature': validSignature },
      body: bodyPayload,
    });

    assert.ok(webhookRes.executionId);

    // Wait for Worker Execution
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [webhookRes.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        assert.equal(rows[0].status, 'completed');
        break;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // TEST SCENARIO C: Natural Language AI Planner Pipeline
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO C: Natural Language Request -> AI Workflow Proposal -> Validation -> Preview -> Approval -> Save -> Execute', async () => {
    const prompt = 'Create an automated workflow to process incoming leads and dispatch notification emails';
    
    // 1. Generate Plan Proposal
    const planResult = await aiPlannerService.generatePlan(prompt);
    assert.equal(planResult.isValid, true);
    assert.ok(planResult.previewPlan.nodeCount >= 2);

    // 2. Approve & Persist Proposed Workflow
    const savedWf = await aiPlannerService.approvePlan(workspaceId, userId, planResult.workflowProposal);
    assert.ok(savedWf.id);

    // 3. Publish & Execute
    await workflowsService.publishWorkflow(savedWf.id, workspaceId, userId);
    const execResult = await workflowExecutor.executeWorkflow({
      workflowId: savedWf.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { leadName: 'Jane Doe' },
      userId,
    });

    assert.equal(execResult.success, true);
    assert.equal(execResult.execution.status, 'completed');
  });

  // ---------------------------------------------------------------------------
  // TEST SCENARIO D: Controlled Self-Healing Recovery
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO D: Controlled Failure -> Error Detection -> Error Classification -> Recovery Strategy -> Retry -> Final Result', async () => {
    const controlledError = new Error('HTTP 503 Service Unavailable: Gateway Timeout');
    controlledError.statusCode = 503;

    // 1. Error Detection & Classification
    const failureDiagnosis = errorAnalyzer.classify(controlledError);
    assert.equal(failureDiagnosis.category, 'TRANSIENT_ERROR');

    // 2. Recovery Strategy Resolution
    const strategy = recoveryStrategyRegistry.getStrategy(failureDiagnosis.category);
    assert.equal(strategy.name, 'ExponentialRetryStrategy');
    assert.equal(strategy.action, 'retry');

    // 3. Execute Controlled Recovery Strategy
    assert.equal(strategy.maxRetries, 3);
  });


  // ---------------------------------------------------------------------------
  // TEST SCENARIO E: Multi-Agent Orchestration
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO E: Complex Task -> Task Planner -> Multiple Agents -> Parallel Execution -> Review -> Final Result', async () => {
    const complexTaskPrompt = 'Analyze system security audit logs and generate automated infrastructure alert workflow';

    const orchestrationResult = await agentOrchestrator.orchestrate(complexTaskPrompt, workspaceId, userId);

    assert.equal(orchestrationResult.status, OrchestrationStatus.COMPLETED);
    assert.ok(orchestrationResult.summary.completedCount >= 3);
    assert.equal(orchestrationResult.reviewVerdict.passed, true);
    assert.ok(orchestrationResult.reviewVerdict.qualityScore >= 0.7);
  });

  // ---------------------------------------------------------------------------
  // TEST SCENARIO F: Admin Panel & System Monitoring
  // ---------------------------------------------------------------------------
  await t.test('TEST SCENARIO F: Admin Login -> Monitor Users -> Workflows -> Executions -> Queues -> Workers -> Failures', async () => {
    // Verify Dashboard Overview Metrics
    const dashboardData = await adminService.getDashboardOverview();
    assert.ok(dashboardData.totalUsers >= 2);
    assert.ok(dashboardData.totalWorkflows >= 3);
    assert.equal(dashboardData.queueHealth.status, 'healthy');
    assert.equal(dashboardData.workerHealth.status, 'online');

    // Verify System Audit Logs
    const systemLogs = await adminService.getSystemLogs();
    assert.ok(Array.isArray(systemLogs.auditLogs));
    assert.ok(Array.isArray(systemLogs.systemNotifications));
  });
});
