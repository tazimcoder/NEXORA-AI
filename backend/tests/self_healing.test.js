import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { errorAnalyzer, FAILURE_CATEGORIES } from '../src/modules/self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../src/modules/self-healing/recovery-strategy.registry.js';
import { approvalService } from '../src/modules/self-healing/approval.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { workflowExecutor } from '../src/modules/engine/workflow.executor.js';

test('Comprehensive Phase 8 Self-Healing Automation Engine Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  const regResult = await authService.register({
    email: `self_healing_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Self Healing Engineer',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  await t.test('1. Error Analyzer 6 Failure Categories Unit Verification', () => {
    // 1. Transient Error
    const transientErr = new Error('HTTP 429 Rate limit exceeded');
    transientErr.statusCode = 429;
    const c1 = errorAnalyzer.classify(transientErr);
    assert.equal(c1.category, FAILURE_CATEGORIES.TRANSIENT_ERROR);
    assert.equal(c1.isDestructive, false);

    // 2. Authentication Error
    const authErr = new Error('Invalid OpenRouter API Key');
    authErr.statusCode = 401;
    const c2 = errorAnalyzer.classify(authErr);
    assert.equal(c2.category, FAILURE_CATEGORIES.AUTHENTICATION_ERROR);
    assert.equal(c2.isDestructive, true);

    // 3. Validation Error
    const valErr = new Error('Zod schema validation failed for payload');
    valErr.statusCode = 400;
    const c3 = errorAnalyzer.classify(valErr);
    assert.equal(c3.category, FAILURE_CATEGORIES.VALIDATION_ERROR);
    assert.equal(c3.isDestructive, false);

    // 4. External API Error
    const extErr = new Error('Upstream external API server error');
    extErr.statusCode = 500;
    const c4 = errorAnalyzer.classify(extErr);
    assert.equal(c4.category, FAILURE_CATEGORIES.EXTERNAL_API_ERROR);

    // 5. Business Rule Error
    const bizErr = new Error('Business rule condition policy check failed');
    const c5 = errorAnalyzer.classify(bizErr);
    assert.equal(c5.category, FAILURE_CATEGORIES.BUSINESS_RULE_ERROR);
    assert.equal(c5.isDestructive, true);

    // 6. Unknown Error
    const unkErr = new Error('Unhandled runtime exception');
    const c6 = errorAnalyzer.classify(unkErr);
    assert.equal(c6.category, FAILURE_CATEGORIES.UNKNOWN_ERROR);
  });

  await t.test('2. Recovery Strategy Registry Lookup', () => {
    const s1 = recoveryStrategyRegistry.getStrategy(FAILURE_CATEGORIES.TRANSIENT_ERROR);
    assert.equal(s1.action, 'retry');

    const s2 = recoveryStrategyRegistry.getStrategy(FAILURE_CATEGORIES.AUTHENTICATION_ERROR);
    assert.equal(s2.action, 'escalate_human_approval');

    const s3 = recoveryStrategyRegistry.getStrategy(FAILURE_CATEGORIES.BUSINESS_RULE_ERROR);
    assert.equal(s3.action, 'escalate_human_approval');
  });

  await t.test('3. Self-Healing Execution Diagnosis & Human Approval Escalation', async () => {
    // Create workflow with failing HTTP node to trigger execution failure
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Failing Self-Healing Test Workflow',
      description: 'Tests self-healing error analysis',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          { id: 'http_fail', type: 'action', subtype: 'http_request', label: 'Failing HTTP', config: { url: 'http://127.0.0.1:59997/unauthorized-endpoint' } },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'http_fail' }],
      },
    });

    const execResult = await workflowExecutor.executeWorkflow({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'manual',
    });

    assert.equal(execResult.success, false);
    assert.ok(execResult.execution.id);

    // Verify self-healing recovery log written to DB
    const pool = getDbPool();
    const [logs] = await pool.query(
      `SELECT * FROM execution_logs WHERE execution_id = ? AND step_id = 'self_healing_recovery'`,
      [execResult.execution.id]
    );

    assert.ok(logs.length > 0);
    assert.equal(logs[0].status, 'recovery_diagnosed');
  });

  await t.test('4. Human Approval Mechanism API & Audit Trail Verification', async () => {
    // 1. Create Approval Request
    const appReq = await approvalService.createApprovalRequest({
      workspaceId,
      userId,
      executionId: `exec_test_${Date.now()}`,
      stepId: 'node_auth_1',
      nodeName: 'Protected API Action',
      reason: '401 Unauthorized API key expired',
      recoveryStrategy: 'HumanApprovalEscalationStrategy',
    });

    assert.ok(appReq.notificationId);
    assert.equal(appReq.status, 'pending_approval');

    // 2. Fetch Pending Approvals List
    const pendingList = await approvalService.getPendingApprovals(workspaceId);
    assert.ok(pendingList.some((p) => p.id === appReq.notificationId));

    // 3. Approve Recovery Action
    const appResult = await approvalService.approveRecovery(appReq.notificationId, workspaceId, userId);
    assert.equal(appResult.approved, true);

    // 4. Verify Audit Log entry created in audit_logs table
    const pool = getDbPool();
    const [auditRows] = await pool.query(
      `SELECT * FROM audit_logs WHERE workspace_id = ? AND action = 'APPROVAL_GRANTED'`,
      [workspaceId]
    );
    assert.ok(auditRows.length > 0);
    assert.equal(auditRows[0].resource_id, appReq.notificationId);
  });
});
