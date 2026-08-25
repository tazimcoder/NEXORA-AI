import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { executionsService } from '../src/modules/executions/executions.service.js';
import { integrationRegistry } from '../src/modules/integrations/integration.registry.js';
import { httpIntegrationProvider } from '../src/modules/integrations/providers/http.provider.js';
import { emailIntegrationProvider } from '../src/modules/integrations/providers/email.provider.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';


test('Comprehensive Phase 9.1 Core Integrations Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  await queueService.initializeQueues();
  const workerInstance = startWorkflowWorker();

  const regResult = await authService.register({
    email: `phase9_1_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Core Integrations Engineer',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  t.after(async () => {
    if (workerInstance) {
      await workerInstance.close();
    }
    await closeDbPool();
  });


  await t.test('1. Integration Registry & Provider Registration Verification', () => {
    const httpProv = integrationRegistry.getProvider('http');
    assert.equal(httpProv.name, 'http');

    const emailProv = integrationRegistry.getProvider('email');
    assert.equal(emailProv.name, 'email');

    const providersList = integrationRegistry.listProviders();
    assert.ok(providersList.some((p) => p.name === 'http'));
    assert.ok(providersList.some((p) => p.name === 'email'));
  });

  await t.test('2. Universal HTTP Action Provider (GET, POST, PUT, PATCH, DELETE)', async () => {
    // Test HTTP GET with query params
    const getResult = await httpIntegrationProvider.execute('execute_request', {
      config: {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET',
      },
    });

    assert.equal(getResult.success, true);
    assert.equal(getResult.statusCode, 200);

    // Test HTTP POST with body
    const postResult = await httpIntegrationProvider.execute('execute_request', {
      config: {
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'POST',
        body: { title: 'NEXORA Integration', body: 'Testing HTTP POST', userId: 1 },
      },
    });

    assert.equal(postResult.success, true);
    assert.equal(postResult.statusCode, 201);
  });

  await t.test('3. Email Integration Provider & Provider Abstraction', async () => {
    const emailResult = await emailIntegrationProvider.execute(
      'send_email',
      {
        config: {
          to: 'customer@example.com',
          subject: 'Weekly Customer Reminder',
          text: 'Every Monday check pending customers',
        },
      },
      {
        smtpHost: 'smtp.sendgrid.net',
        smtpUser: 'apikey',
        smtpPassword: 'sk-smtp-secret-password',
      }
    );

    assert.equal(emailResult.success, true);
    assert.equal(emailResult.output.recipient, 'customer@example.com');
    assert.ok(emailResult.output.messageId);
  });

  await t.test('4. End-to-End Core Pipeline: Webhook -> Condition -> HTTP Action / Email -> Queue -> Worker -> DB Result', async () => {
    // 1. Create Workflow containing Webhook Trigger, Condition, and Email Action
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'E2E Core Integrations Pipeline Workflow',
      description: 'Webhook -> Condition -> Email',
      definition: {
        nodes: [
          { id: 'trig_wh', type: 'trigger', subtype: 'webhook', label: 'Webhook Trigger', config: { path: '/webhook/test' } },
          { id: 'cond_chk', type: 'condition', subtype: 'if_else', label: 'Check Status', config: { operator: 'equals', leftValue: 'input.status', rightValue: 'pending' } },
          { id: 'act_email', type: 'action', subtype: 'send_email', label: 'Dispatch Email', config: { to: 'pending_user@nexora.ai', subject: 'Pending Reminder' } },
        ],
        edges: [
          { id: 'e1', source: 'trig_wh', target: 'cond_chk' },
          { id: 'e2', source: 'cond_chk', target: 'act_email', sourceHandle: 'true' },
        ],
      },
    });

    // Publish Workflow
    await workflowsService.publishWorkflow(wf.id, workspaceId, userId);

    // 2. Simulate Webhook Payload Trigger Dispatching to BullMQ
    const enqueueResult = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'webhook',
      inputPayload: { status: 'pending', customerId: 'cust_991' },
      userId,
    });

    assert.ok(enqueueResult.executionId);
    assert.ok(enqueueResult.jobId);

    // 3. Wait for Worker Execution Processing
    const pool = getDbPool();
    let attempts = 0;
    let completedExec = null;

    while (attempts < 20) {
      await new Promise((res) => setTimeout(res, 200));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [enqueueResult.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        completedExec = rows[0];
        break;
      }
      attempts++;
    }

    assert.ok(completedExec);
    assert.equal(completedExec.status, 'completed');

    // 4. Verify Execution Logs in DB
    const [logs] = await pool.query('SELECT * FROM execution_logs WHERE execution_id = ?', [enqueueResult.executionId]);
    assert.ok(logs.length >= 3);
  });

  await t.test('5. Webhook Security & HMAC Signature Verification', async () => {
    const secret = 'webhook_secret_key_123';
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Secured Webhook Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'webhook', label: 'Secured Webhook', config: { secret } },
          { id: 'act', type: 'action', subtype: 'create_notification', label: 'Alert' },
        ],
        edges: [{ id: 'e1', source: 'trig', target: 'act' }],
      },
    });

    await workflowsService.publishWorkflow(wf.id, workspaceId, userId);

    const bodyPayload = { event: 'order_paid', amount: 500 };
    const validSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(bodyPayload)).digest('hex');

    // Valid Signature -> Enqueues Job Successfully
    const validRes = await executionsService.executeWebhookTrigger(wf.id, workspaceId, {
      headers: { 'x-signature': validSignature },
      body: bodyPayload,
    });
    assert.ok(validRes.executionId);

    // Wait for worker job completion
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise((res) => setTimeout(res, 100));
      const [rows] = await getDbPool().query('SELECT * FROM executions WHERE id = ?', [validRes.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        break;
      }
    }


    // Invalid Signature -> Throws 401 Unauthorized
    await assert.rejects(
      async () => {
        await executionsService.executeWebhookTrigger(wf.id, workspaceId, {
          headers: { 'x-signature': 'bad_signature_xyz' },
          body: bodyPayload,
        });
      },
      (err) => err.statusCode === 401
    );
  });

  await t.test('6. HTTP Action Timeout & Configuration Validation', async () => {
    // Invalid URL format
    await assert.rejects(
      async () => {
        await httpIntegrationProvider.execute('execute_request', {
          config: { url: 'invalid_url_format' },
        });
      },
      (err) => err.message.includes('validation failed')
    );

    // Extremely short timeout triggers 408 Timeout
    await assert.rejects(
      async () => {
        await httpIntegrationProvider.execute('execute_request', {
          config: {
            url: 'https://jsonplaceholder.typicode.com/posts',
            timeout_ms: 1, // 1ms timeout guarantees abort
          },
        });
      },
      (err) => err.statusCode === 408 || err.message.includes('timed out')
    );
  });
});

