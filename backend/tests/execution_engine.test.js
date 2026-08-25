import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { workflowExecutor } from '../src/modules/engine/workflow.executor.js';
import { ConditionEvaluatorHandler } from '../src/modules/engine/handlers/condition.evaluator.js';
import { executionsService } from '../src/modules/executions/executions.service.js';

test('Comprehensive Phase 4 Workflow Execution Core Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  const regResult = await authService.register({
    email: `exec_phase4_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Execution Engineer',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  await t.test('1. Condition Engine 8 Operators Unit Verification', () => {
    const evaluator = new ConditionEvaluatorHandler();

    // equals
    assert.equal(evaluator.evaluateOperator('equals', 'active', 'active'), true);
    assert.equal(evaluator.evaluateOperator('equals', 'active', 'inactive'), false);

    // not equals
    assert.equal(evaluator.evaluateOperator('not equals', '100', '200'), true);

    // greater than
    assert.equal(evaluator.evaluateOperator('greater than', 500, 100), true);
    assert.equal(evaluator.evaluateOperator('greater than', 50, 100), false);

    // less than
    assert.equal(evaluator.evaluateOperator('less than', 50, 100), true);

    // greater than or equal
    assert.equal(evaluator.evaluateOperator('greater than or equal', 100, 100), true);

    // less than or equal
    assert.equal(evaluator.evaluateOperator('less than or equal', 50, 100), true);

    // contains
    assert.equal(evaluator.evaluateOperator('contains', 'Payment completed successfully', 'completed'), true);
    assert.equal(evaluator.evaluateOperator('contains', ['apple', 'banana'], 'apple'), true);

    // exists
    assert.equal(evaluator.evaluateOperator('exists', 'valid_token', null), true);
    assert.equal(evaluator.evaluateOperator('exists', null, null), false);
  });

  await t.test('2. Successful Workflow Execution & Execution Logs Capture', async () => {
    // Blueprint: Manual Trigger -> Condition (Status equals completed) -> Notification Action
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Order Processing Automation',
      description: 'E2E Execution Test Blueprint',
      definition: {
        nodes: [
          { id: 'n_trig', type: 'trigger', subtype: 'manual', label: 'Manual Start' },
          {
            id: 'n_cond',
            type: 'condition',
            subtype: 'if_else',
            label: 'Check Status',
            config: { operator: 'equals', leftValue: 'input.status', rightValue: 'completed' },
          },
          {
            id: 'n_notif',
            type: 'action',
            subtype: 'create_notification',
            label: 'Send Alert',
            config: { title: 'Order Completed', message: 'Order processed successfully' },
          },
        ],
        edges: [
          { id: 'e1', source: 'n_trig', target: 'n_cond' },
          { id: 'e2', source: 'n_cond', target: 'n_notif', sourceHandle: 'true' },
        ],
      },
    });

    const result = await workflowExecutor.executeWorkflow({
      workflowId: workflow.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { status: 'completed', amount: 250 },
      userId,
    });

    assert.equal(result.success, true);
    assert.equal(result.execution.status, 'completed');
    assert.ok(result.execution.id);

    // Verify Granular Execution Logs in Database
    const details = await executionsService.getExecutionById(result.execution.id, workspaceId);
    assert.equal(details.logs.length, 3);
    assert.equal(details.logs[0].step_id, 'n_trig');
    assert.equal(details.logs[1].step_id, 'n_cond');
    assert.equal(details.logs[2].step_id, 'n_notif');
    assert.equal(details.logs[2].status, 'success');
  });

  await t.test('3. Branching Logic Execution (False Branch Followed)', async () => {
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Branching Test Workflow',
      definition: {
        nodes: [
          { id: 'n_trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          {
            id: 'n_cond',
            type: 'condition',
            subtype: 'if_else',
            label: 'Evaluate Amount',
            config: { operator: 'greater than', leftValue: 'input.amount', rightValue: '1000' },
          },
          {
            id: 'n_true_action',
            type: 'action',
            subtype: 'internal_system',
            label: 'High Value Task',
            config: { task: 'high_value' },
          },
          {
            id: 'n_false_action',
            type: 'action',
            subtype: 'internal_system',
            label: 'Standard Task',
            config: { task: 'standard_value' },
          },
        ],
        edges: [
          { id: 'e1', source: 'n_trig', target: 'n_cond' },
          { id: 'e2', source: 'n_cond', target: 'n_true_action', sourceHandle: 'true' },
          { id: 'e3', source: 'n_cond', target: 'n_false_action', sourceHandle: 'false' },
        ],
      },
    });

    // Run with amount = 250 (Condition evaluates to FALSE)
    const result = await workflowExecutor.executeWorkflow({
      workflowId: workflow.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { amount: 250 },
      userId,
    });

    assert.equal(result.success, true);
    assert.equal(result.execution.status, 'completed');

    const details = await executionsService.getExecutionById(result.execution.id, workspaceId);
    const executedStepIds = details.logs.map((l) => l.step_id);

    assert.ok(executedStepIds.includes('n_trig'));
    assert.ok(executedStepIds.includes('n_cond'));
    assert.ok(executedStepIds.includes('n_false_action'));
    assert.equal(executedStepIds.includes('n_true_action'), false, 'True branch must be skipped');
  });

  await t.test('4. Failed Workflow Execution (Node Error Handling)', async () => {
    // Blueprint containing HTTP action pointing to invalid non-existent URL
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Failing HTTP Workflow',
      definition: {
        nodes: [
          { id: 'n_trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          {
            id: 'n_http_fail',
            type: 'action',
            subtype: 'http_request',
            label: 'Invalid HTTP Call',
            config: { url: 'http://127.0.0.1:59999/non-existent-endpoint-xyz', timeout_ms: 1000 },
          },
        ],
        edges: [
          { id: 'e1', source: 'n_trig', target: 'n_http_fail' },
        ],
      },
    });

    const result = await workflowExecutor.executeWorkflow({
      workflowId: workflow.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: {},
      userId,
    });

    assert.equal(result.success, false);
    assert.equal(result.execution.status, 'failed');
    assert.ok(result.execution.error_message);

    const details = await executionsService.getExecutionById(result.execution.id, workspaceId);
    const failedLog = details.logs.find((l) => l.step_id === 'n_http_fail');
    assert.ok(failedLog);
    assert.equal(failedLog.status, 'failed');
  });
});
