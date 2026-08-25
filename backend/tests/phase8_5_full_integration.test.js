import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { workflowExecutor } from '../src/modules/engine/workflow.executor.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { aiPlannerService } from '../src/modules/ai/ai-planner.service.js';
import { errorAnalyzer } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';
import { approvalService } from '../src/modules/self-healing/approval.service.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

test('Phase 8.5 — Full System Integration and Conflict Verification Test Runner', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'MySQL Database must be connected');

  await queueService.initializeQueues();
  const workerInstance = startWorkflowWorker();

  let userTokens = null;
  let userId = null;
  let workspaceId = null;

  t.after(async () => {
    if (workerInstance) {
      await workerInstance.close();
    }
    await closeDbPool();
  });

  // FLOW 1: Authentication & User Foundation Flow
  await t.test('Flow 1 — Authentication & Authorization Integration', async () => {
    const userEmail = `integration_flow1_${Date.now()}@nexora.ai`;
    const password = 'Password123!';

    // 1. Register User & Default Personal Workspace Creation
    const regResult = await authService.register({
      email: userEmail,
      password,
      name: 'Integration Flow User',
    });

    assert.ok(regResult.tokens.accessToken);
    assert.ok(regResult.tokens.refreshToken);
    assert.ok(regResult.user.id);
    assert.ok(regResult.workspace.id);

    userId = regResult.user.id;
    workspaceId = regResult.workspace.id;

    // 2. Login & Token Retrieval
    const loginResult = await authService.login({ email: userEmail, password });
    assert.ok(loginResult.tokens.accessToken);
    userTokens = loginResult.tokens;

    // 3. Verify JWT Access Token Payload
    const decoded = jwt.verify(loginResult.tokens.accessToken, config.jwt.secret);
    assert.equal(decoded.sub, userId);

    // 4. Access Current User Profile
    const { user: me } = await authService.getCurrentUser(userId);
    assert.equal(me.email, userEmail);

    // 5. Logout Session Termination
    await authService.logout(userId);
  });


  // FLOW 2: Manual Workflow End-to-End Execution Flow
  await t.test('Flow 2 — Manual Workflow Lifecycle, Queue & Worker Execution', async () => {
    // 1. Create Workflow
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Manual Order Automation',
      description: 'Flow 2 Integration Blueprint',
    });

    assert.ok(wf.id);
    assert.equal(wf.status, 'draft');

    // 2. Add Trigger, Condition, and Action Nodes
    const definition = {
      nodes: [
        { id: 'trig_1', type: 'trigger', subtype: 'schedule', label: 'Cron Start', config: { cron: '0 9 * * 1' }, position: { x: 100, y: 100 } },
        { id: 'cond_1', type: 'condition', subtype: 'if_else', label: 'Check Status', config: { operator: 'equals', leftValue: 'input.status', rightValue: 'active' }, position: { x: 100, y: 250 } },
        { id: 'act_1', type: 'action', subtype: 'create_notification', label: 'Dispatch Notification', config: { title: 'Order Processed' }, position: { x: 100, y: 400 } },
      ],
      edges: [
        { id: 'e1', source: 'trig_1', target: 'cond_1' },
        { id: 'e2', source: 'cond_1', target: 'act_1', sourceHandle: 'true' },
      ],
    };

    // 3. Save & Reload Workflow
    const saved = await workflowsService.updateWorkflow(wf.id, workspaceId, { definition });
    assert.equal(saved.definition_json.nodes.length, 3);

    const reloaded = await workflowsService.getWorkflowById(wf.id, workspaceId);
    assert.equal(reloaded.id, wf.id);

    // 4. Publish Workflow & Increment Version Snapshot
    const published = await workflowsService.publishWorkflow(wf.id, workspaceId, userId);
    assert.equal(published.status, 'published');
    assert.equal(published.current_version, 2);

    // 5. Enqueue BullMQ Execution Job
    const jobResult = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { status: 'active' },
      userId,
    });

    assert.ok(jobResult.executionId);
    assert.ok(jobResult.jobId);

    // 6. Wait for Worker Processing Completion
    let attempts = 0;
    let completedExec = null;
    const pool = getDbPool();

    while (attempts < 20) {
      await new Promise((res) => setTimeout(res, 200));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [jobResult.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        completedExec = rows[0];
        break;
      }
      attempts++;
    }

    assert.ok(completedExec, 'Execution job should be processed by worker');
    assert.equal(completedExec.status, 'completed');

    // 7. Verify Execution Logs Saved in DB
    const [logs] = await pool.query('SELECT * FROM execution_logs WHERE execution_id = ?', [jobResult.executionId]);
    assert.ok(logs.length >= 3);
  });

  // FLOW 3: Failure and Recovery Flow (Self-Healing Automation)
  await t.test('Flow 3 — Failure Capture, Error Classification & Self-Healing Strategy', async () => {
    // 1. Create Failing Workflow
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Failing Recovery Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          { id: 'fail_act', type: 'action', subtype: 'http_request', label: 'Invalid Host Call', config: { url: 'http://127.0.0.1:59996/invalid' } },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'fail_act' }],
      },
    });

    // 2. Execute & Capture Failure
    const execResult = await workflowExecutor.executeWorkflow({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'manual',
    });

    assert.equal(execResult.success, false);

    // 3. Verify Error Classification & Self-Healing Recovery Diagnostic Log
    const pool = getDbPool();
    const [diagLogs] = await pool.query(
      `SELECT * FROM execution_logs WHERE execution_id = ? AND step_id = 'self_healing_recovery'`,
      [execResult.execution.id]
    );

    assert.ok(diagLogs.length > 0);
    assert.equal(diagLogs[0].status, 'recovery_diagnosed');
  });

  // FLOW 4: AI Workflow Generation Flow
  await t.test('Flow 4 — Natural Language AI Planner, Proposal Preview & Approval', async () => {
    const userPrompt = 'Every Monday check pending customers and send them a reminder email.';

    // 1. Generate Proposal
    const planResult = await aiPlannerService.generatePlan(userPrompt);
    assert.equal(planResult.isValid, true);
    assert.ok(planResult.workflowProposal.name);

    // 2. Explicit User Approval & DB Save
    const saved = await aiPlannerService.approvePlan(
      workspaceId,
      userId,
      planResult.workflowProposal
    );

    assert.ok(saved.id);
    assert.equal(saved.status, 'draft');

    // 3. Publish AI-Generated Workflow
    const published = await workflowsService.publishWorkflow(saved.id, workspaceId, userId);
    assert.equal(published.status, 'published');
  });

  // FLOW 5: Frontend to Backend API Contract & Error Handling
  await t.test('Flow 5 — API Envelope Contract & Error Handling', async () => {
    // 1. Verify Error Analyzer Classification Categories
    const authErr = new Error('Invalid authentication credentials');
    authErr.statusCode = 401;
    const classResult = errorAnalyzer.classify(authErr);
    assert.equal(classResult.category, 'AUTHENTICATION_ERROR');

    // 2. Verify Human Approval Request Creation
    const appReq = await approvalService.createApprovalRequest({
      workspaceId,
      userId,
      executionId: `exec_flow5_${Date.now()}`,
      stepId: 'node_1',
      nodeName: 'Protected Integration',
      reason: '401 Unauthorized API key expired',
      recoveryStrategy: 'HumanApprovalEscalationStrategy',
    });

    assert.ok(appReq.notificationId);

    // 3. Approve Recovery Action
    const approved = await approvalService.approveRecovery(appReq.notificationId, workspaceId, userId);
    assert.equal(approved.approved, true);
  });
});
