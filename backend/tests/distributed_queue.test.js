import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { initRedis } from '../src/config/redis.config.js';
import { initQueues } from '../src/config/queue.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker, stopWorkflowWorker } from '../src/modules/workers/workflow.worker.js';
import { executionsService } from '../src/modules/executions/executions.service.js';

test('Comprehensive Phase 5 Distributed Job Execution Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  await initRedis();
  initQueues();

  // Start Worker Process
  const worker = startWorkflowWorker();

  t.after(async () => {
    await stopWorkflowWorker();
    await closeDbPool();
  });


  const regResult = await authService.register({
    email: `queue_phase5_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Distributed Queue Engineer',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  await t.test('1. Enqueue & Process Successful Workflow Execution Job', async () => {
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Async Order Notification Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          { id: 'notif', type: 'action', subtype: 'create_notification', label: 'Alert Notification', config: { title: 'Async Job Done', message: 'Job executed by worker' } },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'notif' }],
      },
    });

    const jobResult = await queueService.addWorkflowExecutionJob({
      workflowId: workflow.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: { orderId: 999 },
      userId,
    });

    assert.ok(jobResult.executionId);
    assert.equal(jobResult.status, 'queued');

    // Wait for async worker to process job
    let executionDetails;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      executionDetails = await executionsService.getExecutionById(jobResult.executionId, workspaceId);
      if (['completed', 'failed'].includes(executionDetails.status)) {
        break;
      }
    }

    assert.equal(executionDetails.status, 'completed');
    assert.ok(executionDetails.logs.some((l) => l.step_id === 'notif'));
  });

  await t.test('2. Exhausted Retries Handling on Unrecoverable Failures', async () => {
    // Workflow containing failing HTTP action pointing to invalid URL
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Failing Job Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          { id: 'http_fail', type: 'action', subtype: 'http_request', label: 'Failing HTTP', config: { url: 'http://127.0.0.1:59998/invalid-url-xyz', timeout_ms: 500 } },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'http_fail' }],
      },
    });

    const jobResult = await queueService.addWorkflowExecutionJob({
      workflowId: workflow.id,
      workspaceId,
      triggerType: 'manual',
      inputPayload: {},
      userId,
      maxRetries: 1, // 1 retry attempt
      backoffDelay: 100,
    });

    let executionDetails;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      executionDetails = await executionsService.getExecutionById(jobResult.executionId, workspaceId);
      if (executionDetails.status === 'failed') {
        break;
      }
    }

    assert.equal(executionDetails.status, 'failed');
    assert.ok(executionDetails.error_message);
  });

  await t.test('3. Concurrent Workflow Job Processing', async () => {
    const workflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Concurrent Batch Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'manual', label: 'Start' },
          { id: 'sys', type: 'action', subtype: 'internal_system', label: 'Batch Item', config: { task: 'concurrent_task' } },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'sys' }],
      },
    });

    // Enqueue 5 jobs simultaneously
    const jobPromises = [1, 2, 3, 4, 5].map((i) =>
      queueService.addWorkflowExecutionJob({
        workflowId: workflow.id,
        workspaceId,
        triggerType: 'manual',
        inputPayload: { item: i },
        userId,
      })
    );

    const jobs = await Promise.all(jobPromises);
    assert.equal(jobs.length, 5);

    // Wait for all 5 jobs to finish
    let allFinished = false;
    for (let attempt = 0; attempt < 25; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      const statuses = await Promise.all(jobs.map((j) => executionsService.getExecutionById(j.executionId, workspaceId)));
      allFinished = statuses.every((s) => ['completed', 'failed'].includes(s.status));
      if (allFinished) break;
    }

    assert.equal(allFinished, true);
  });

  await t.test('4. Queue Status & Metrics Retrieval', async () => {
    const metrics = await queueService.getQueueMetrics();
    assert.ok(metrics.status);
    assert.ok(metrics.counts);
  });

  await stopWorkflowWorker();
});
