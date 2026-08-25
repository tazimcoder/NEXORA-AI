import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { validateWorkflowGraph } from '../src/modules/workflows/workflows.validator.js';
import { ApiError } from '../src/utils/apiError.js';

test('Comprehensive Phase 3 Workflows Core Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  // Register user & workspace context
  const testEmail = `wf_phase3_${Date.now()}@nexora.ai`;
  const regResult = await authService.register({
    email: testEmail,
    password: 'Password123!',
    name: 'Workflow Architect',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  let createdWorkflow;

  await t.test('1. Create Workflow Blueprint (Draft State)', async () => {
    createdWorkflow = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Order Fulfillment Workflow',
      description: 'Automates payment webhook processing and shipping notifications',
    });

    assert.ok(createdWorkflow.id);
    assert.equal(createdWorkflow.name, 'Order Fulfillment Workflow');
    assert.equal(createdWorkflow.status, 'draft');
    assert.equal(createdWorkflow.is_active, 0);
    assert.equal(createdWorkflow.current_version, 1);
  });

  await t.test('2. Retrieve Workflow Blueprint by ID', async () => {
    const fetched = await workflowsService.getWorkflowById(createdWorkflow.id, workspaceId);
    assert.equal(fetched.id, createdWorkflow.id);
    assert.equal(fetched.workspace_id, workspaceId);
  });

  await t.test('3. Graph AST Validation Unit Test', () => {
    // Valid AST
    const validGraph = {
      nodes: [
        { id: 'trigger_1', type: 'trigger', subtype: 'webhook', label: 'Order Created' },
        { id: 'cond_1', type: 'condition', subtype: 'if_else', label: 'Is Total > $100' },
        { id: 'action_1', type: 'action', subtype: 'http_request', label: 'Notify Slack' },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'cond_1' },
        { id: 'e2', source: 'cond_1', target: 'action_1' },
      ],
    };
    const validResult = validateWorkflowGraph(validGraph);
    assert.equal(validResult.isValid, true);
    assert.equal(validResult.errors.length, 0);

    // Invalid AST (Missing Trigger node)
    const noTriggerGraph = {
      nodes: [
        { id: 'action_1', type: 'action', subtype: 'http_request', label: 'Notify Slack' },
      ],
      edges: [],
    };
    const invalidResult = validateWorkflowGraph(noTriggerGraph);
    assert.equal(invalidResult.isValid, false);
    assert.ok(invalidResult.errors.some((e) => e.includes('Trigger node')));

    // Invalid AST (Dangling Edge)
    const danglingEdgeGraph = {
      nodes: [
        { id: 'trigger_1', type: 'trigger', subtype: 'webhook', label: 'Order Created' },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'non_existent_node' },
      ],
    };
    const danglingResult = validateWorkflowGraph(danglingEdgeGraph);
    assert.equal(danglingResult.isValid, false);
    assert.ok(danglingResult.errors.some((e) => e.includes('unknown target node')));
  });

  await t.test('4. Update Workflow AST Definition', async () => {
    const validGraph = {
      nodes: [
        { id: 'trig_1', type: 'trigger', subtype: 'webhook', label: 'Catch Webhook' },
        { id: 'act_1', type: 'action', subtype: 'openrouter', label: 'AI Summarize' },
      ],
      edges: [
        { id: 'e1', source: 'trig_1', target: 'act_1' },
      ],
    };

    const updated = await workflowsService.updateWorkflow(createdWorkflow.id, workspaceId, {
      name: 'Order Fulfillment Workflow v2',
      definition: validGraph,
    });

    assert.equal(updated.name, 'Order Fulfillment Workflow v2');
    assert.equal(updated.definition_json.nodes.length, 2);
  });

  await t.test('5. Reject Publishing Invalid Graph AST', async () => {
    // Save invalid graph missing trigger
    await workflowsService.updateWorkflow(createdWorkflow.id, workspaceId, {
      definition: {
        nodes: [{ id: 'act_1', type: 'action', subtype: 'http', label: 'Action Only' }],
        edges: [],
      },
    });

    await assert.rejects(async () => {
      await workflowsService.publishWorkflow(createdWorkflow.id, workspaceId, userId);
    }, (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'WORKFLOW_VALIDATION_FAILED');
  });

  await t.test('6. Publish Workflow & Immutable Version Snapshot Creation', async () => {
    // Restore valid graph
    const validGraph = {
      nodes: [
        { id: 'trig_1', type: 'trigger', subtype: 'webhook', label: 'Catch Webhook' },
        { id: 'act_1', type: 'action', subtype: 'openrouter', label: 'AI Summarize' },
      ],
      edges: [
        { id: 'e1', source: 'trig_1', target: 'act_1' },
      ],
    };

    await workflowsService.updateWorkflow(createdWorkflow.id, workspaceId, { definition: validGraph });

    const published = await workflowsService.publishWorkflow(createdWorkflow.id, workspaceId, userId);
    assert.equal(published.status, 'published');
    assert.equal(published.is_active, 1);
    assert.equal(published.current_version, 2);

    const versions = await workflowsService.getWorkflowVersions(createdWorkflow.id, workspaceId);
    assert.equal(versions.length, 1);
    assert.equal(versions[0].version, 1);
  });

  await t.test('7. Pause Workflow Execution State', async () => {
    const paused = await workflowsService.pauseWorkflow(createdWorkflow.id, workspaceId);
    assert.equal(paused.status, 'paused');
    assert.equal(paused.is_active, 0);
  });

  await t.test('8. Revert to Draft State', async () => {
    const draft = await workflowsService.draftWorkflow(createdWorkflow.id, workspaceId);
    assert.equal(draft.status, 'draft');
    assert.equal(draft.is_active, 0);
  });
});
