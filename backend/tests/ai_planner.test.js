import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { aiPlannerService } from '../src/modules/ai/ai-planner.service.js';
import { validateAIProposal } from '../src/modules/ai/ai-planner.validator.js';
import { translateProposalToDefinition } from '../src/modules/ai/ai-planner.translator.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';

test('Comprehensive Phase 7 Natural Language Automation Generator Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  const regResult = await authService.register({
    email: `ai_phase7_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'AI Automation Engineer',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  await t.test('1. AI Proposal Validation Engine Unit Test', () => {
    // Valid AI Plan Proposal
    const validPlan = {
      title: 'Weekly Pending Customer Reminder',
      description: 'Checks for pending customers every Monday and sends reminder email',
      nodes: [
        { id: 'n_trig', type: 'trigger', subtype: 'schedule', label: 'Every Monday Cron', config: { cron: '0 9 * * 1' } },
        { id: 'n_cond', type: 'condition', subtype: 'if_else', label: 'Check Pending Status', config: { operator: 'equals', leftValue: 'input.body.status', rightValue: 'pending' } },
        { id: 'n_act', type: 'action', subtype: 'create_notification', label: 'Send Reminder Notification', config: { title: 'Reminder Email' } },
      ],
      edges: [
        { id: 'e1', source: 'n_trig', target: 'n_cond' },
        { id: 'e2', source: 'n_cond', target: 'n_act', sourceHandle: 'true' },
      ],
    };

    const valResult = validateAIProposal(validPlan);
    assert.equal(valResult.isValid, true);
    assert.equal(valResult.errors.length, 0);

    // Invalid AI Plan Proposal (Missing trigger node)
    const invalidPlan = {
      title: 'Invalid AI Plan',
      nodes: [
        { id: 'n_act', type: 'action', subtype: 'http_request', label: 'Action Only' },
      ],
      edges: [],
    };

    const invResult = validateAIProposal(invalidPlan);
    assert.equal(invResult.isValid, false);
    assert.ok(invResult.errors.some((e) => e.includes('Trigger node')));
  });

  await t.test('2. AI Proposal Translator & Canvas Layout Computation', () => {
    const validPlan = {
      title: 'Weekly Customer Check',
      description: 'Automated weekly process',
      nodes: [
        { id: 'trig', type: 'trigger', subtype: 'schedule', label: 'Cron' },
        { id: 'act', type: 'action', subtype: 'create_notification', label: 'Alert' },
      ],
      edges: [{ id: 'e1', source: 'trig', target: 'act' }],
    };

    const translated = translateProposalToDefinition(validPlan);
    assert.equal(translated.title, 'Weekly Customer Check');
    assert.equal(translated.definition.nodes.length, 2);
    assert.ok(translated.definition.nodes[0].position.x !== undefined);
    assert.ok(translated.definition.nodes[0].position.y !== undefined);
  });

  await t.test('3. Full E2E Flow: Natural Language Prompt -> Plan Preview -> Validation -> Approval -> DB Save', async () => {
    const userPrompt = 'Every Monday check pending customers and send them a reminder email.';

    // Step A: Generate Plan Preview (Non-executable proposal)
    const planResult = await aiPlannerService.generatePlan(userPrompt);

    assert.equal(planResult.isValid, true);
    assert.ok(planResult.previewPlan.title);
    assert.ok(planResult.workflowProposal.definition.nodes.length >= 2);

    // Step B: Explicit User Approval Step (Persists workflow to DB in draft state)
    const savedWorkflow = await aiPlannerService.approvePlan(
      workspaceId,
      userId,
      planResult.workflowProposal
    );

    assert.ok(savedWorkflow.id);
    assert.equal(savedWorkflow.status, 'draft');
    assert.equal(savedWorkflow.workspace_id, workspaceId);

    // Step C: Verify Workflow Reload from Database
    const reloaded = await workflowsService.getWorkflowById(savedWorkflow.id, workspaceId);
    assert.equal(reloaded.id, savedWorkflow.id);
    assert.equal(reloaded.definition_json.nodes.length, planResult.workflowProposal.definition.nodes.length);
  });
});
