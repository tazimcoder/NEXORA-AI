import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { executionsService } from '../src/modules/executions/executions.service.js';
import { integrationRegistry } from '../src/modules/integrations/integration.registry.js';
import { telegramIntegrationProvider } from '../src/modules/integrations/providers/telegram.provider.js';
import { slackIntegrationProvider } from '../src/modules/integrations/providers/slack.provider.js';
import { googleIntegrationProvider } from '../src/modules/integrations/providers/google.provider.js';
import { customApiIntegrationProvider } from '../src/modules/integrations/providers/custom_api.provider.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';

test('Comprehensive Phase 9.2 Advanced Integrations Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  await queueService.initializeQueues();
  const workerInstance = startWorkflowWorker();

  const regResult = await authService.register({
    email: `phase9_2_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Advanced Integrations Specialist',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  t.after(async () => {
    if (workerInstance) {
      await workerInstance.close();
    }
    await closeDbPool();
  });

  await t.test('1. Advanced Integration Provider Registry Verification', () => {
    const telegram = integrationRegistry.getProvider('telegram');
    assert.equal(telegram.name, 'telegram');

    const slack = integrationRegistry.getProvider('slack');
    assert.equal(slack.name, 'slack');

    const google = integrationRegistry.getProvider('google');
    assert.equal(google.name, 'google');

    const customApi = integrationRegistry.getProvider('custom_api');
    assert.equal(customApi.name, 'custom_api');

    const providers = integrationRegistry.listProviders();
    assert.ok(providers.some((p) => p.name === 'telegram'));
    assert.ok(providers.some((p) => p.name === 'slack'));
    assert.ok(providers.some((p) => p.name === 'google'));
    assert.ok(providers.some((p) => p.name === 'custom_api'));
  });

  await t.test('2. Telegram Integration Provider Validation & Error Mapping', async () => {
    // Missing botToken in credentials -> Throws validation error
    await assert.rejects(
      async () => {
        await telegramIntegrationProvider.execute('send_message', { config: { chatId: '12345' } }, {});
      },
      (err) => err.message.includes('credentials validation failed')
    );

    // Missing chatId in config -> Throws validation error
    await assert.rejects(
      async () => {
        await telegramIntegrationProvider.execute('send_message', { config: {} }, { botToken: 'fake_bot_token' });
      },
      (err) => err.message.includes('configuration validation failed')
    );
  });

  await t.test('3. Slack Integration Provider Webhook & Web API Verification', async () => {
    // Missing webhookUrl -> Throws validation error
    await assert.rejects(
      async () => {
        await slackIntegrationProvider.execute('send_webhook', { config: { text: 'Test' } }, {});
      },
      (err) => err.message.includes('requires a valid webhookUrl')
    );

    // Missing botToken for chat.postMessage -> Throws error
    await assert.rejects(
      async () => {
        await slackIntegrationProvider.execute('post_message', { config: { channel: '#general', text: 'Test' } }, {});
      },
      (err) => err.message.includes('requires a valid botToken')
    );
  });

  await t.test('4. Google Services Architecture Provider Verification', async () => {
    // Test Connection Check
    const connTest = await googleIntegrationProvider.testConnection({ apiKey: 'AIzaSyFakeKey' });
    assert.equal(connTest.success, true);

    // Missing spreadsheetId -> Throws Error
    await assert.rejects(
      async () => {
        await googleIntegrationProvider.execute('sheets_append_row', { config: { values: ['A', 'B'] } }, { apiKey: 'AIzaSyFakeKey' });
      },
      (err) => err.message.includes('requires a valid spreadsheetId')
    );
  });

  await t.test('5. Custom API Credentials Provider Execution', async () => {
    // Test Custom API execution hitting jsonplaceholder
    const customResult = await customApiIntegrationProvider.execute(
      'execute_custom_api',
      {
        config: {
          baseUrl: 'https://jsonplaceholder.typicode.com',
          endpoint: '/posts/1',
          method: 'GET',
          queryParams: { ref: 'nexora' },
        },
      },
      {
        authType: 'bearer',
        bearerToken: 'mock_custom_api_secret_token',
      }
    );

    assert.equal(customResult.success, true);
    assert.equal(customResult.statusCode, 200);
    assert.ok(customResult.url.includes('ref=nexora'));
  });

  await t.test('6. E2E Pipeline with Custom API & Advanced Actions: Webhook -> Condition -> Custom API -> Queue -> Worker -> DB Result', async () => {
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Advanced Custom API Pipeline Workflow',
      definition: {
        nodes: [
          { id: 'trig', type: 'trigger', subtype: 'webhook', label: 'Webhook Start', config: { path: '/custom-api-hook' } },
          { id: 'cond', type: 'condition', subtype: 'if_else', label: 'Check Region', config: { operator: 'equals', leftValue: 'input.region', rightValue: 'US' } },
          {
            id: 'act_custom',
            type: 'action',
            subtype: 'custom_api',
            label: 'Fetch Order',
            config: {
              baseUrl: 'https://jsonplaceholder.typicode.com',
              endpoint: '/posts/2',
              method: 'GET',
              credentials: { authType: 'bearer', bearerToken: 'sk_test_token_123' },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trig', target: 'cond' },
          { id: 'e2', source: 'cond', target: 'act_custom', sourceHandle: 'true' },
        ],
      },
    });

    await workflowsService.publishWorkflow(wf.id, workspaceId, userId);

    const enqueueResult = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId,
      triggerType: 'webhook',
      inputPayload: { region: 'US', orderId: '1002' },
      userId,
    });

    assert.ok(enqueueResult.executionId);

    // Wait for worker job processing
    const pool = getDbPool();
    let completedExec = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 200));
      const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [enqueueResult.executionId]);
      if (rows[0] && (rows[0].status === 'completed' || rows[0].status === 'failed')) {
        completedExec = rows[0];
        break;
      }
    }

    assert.ok(completedExec);
    assert.equal(completedExec.status, 'completed');

    // Verify DB Execution Logs
    const [logs] = await pool.query('SELECT * FROM execution_logs WHERE execution_id = ?', [enqueueResult.executionId]);
    assert.ok(logs.length >= 3);
  });
});
