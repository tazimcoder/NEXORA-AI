import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';

test('Visual Workflow Builder E2E API Flow: Create -> Configure -> Connect -> Save -> Reload -> Publish', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  const regResult = await authService.register({
    email: `builder_e2e_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Canvas Builder User',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  let workflowId;

  await t.test('1. Create Workflow Blueprint', async () => {
    const wf = await workflowsService.createWorkflow(workspaceId, userId, {
      name: 'Visual Canvas Workflow',
      description: 'E2E Builder Flow Test',
    });

    assert.ok(wf.id);
    assert.equal(wf.status, 'draft');
    workflowId = wf.id;
  });

  await t.test('2. Configure Nodes & Connect Edges (Canvas Construct)', async () => {
    // Construct Nodes (Trigger, Condition, Action) & Edges
    const definition = {
      nodes: [
        {
          id: 'n_trig_1',
          type: 'trigger',
          subtype: 'webhook',
          label: 'Incoming Webhook',
          config: { path: '/webhook/test', method: 'POST' },
          position: { x: 100, y: 100 },
        },
        {
          id: 'n_cond_1',
          type: 'condition',
          subtype: 'if_else',
          label: 'Check Amount',
          config: { operator: 'greater than', leftValue: 'input.amount', rightValue: '500' },
          position: { x: 100, y: 250 },
        },
        {
          id: 'n_act_1',
          type: 'action',
          subtype: 'create_notification',
          label: 'Alert Manager',
          config: { title: 'High Value Order', message: 'Order > $500 detected' },
          position: { x: 100, y: 400 },
        },
      ],
      edges: [
        { id: 'e1', source: 'n_trig_1', target: 'n_cond_1' },
        { id: 'e2', source: 'n_cond_1', target: 'n_act_1', sourceHandle: 'true' },
      ],
    };

    const updated = await workflowsService.updateWorkflow(workflowId, workspaceId, {
      definition,
    });

    assert.equal(updated.definition_json.nodes.length, 3);
    assert.equal(updated.definition_json.edges.length, 2);
  });

  await t.test('3. Save & Reload Workflow Blueprint', async () => {
    const reloaded = await workflowsService.getWorkflowById(workflowId, workspaceId);
    assert.equal(reloaded.id, workflowId);
    assert.equal(reloaded.definition_json.nodes.length, 3);
    assert.equal(reloaded.definition_json.nodes[1].label, 'Check Amount');
  });

  await t.test('4. Publish Workflow & Increment Version', async () => {
    const published = await workflowsService.publishWorkflow(workflowId, workspaceId, userId);
    assert.equal(published.status, 'published');
    assert.equal(published.is_active, 1);
    assert.equal(published.current_version, 2);

    const versions = await workflowsService.getWorkflowVersions(workflowId, workspaceId);
    assert.equal(versions.length, 1);
    assert.equal(versions[0].version, 1);
  });
});
