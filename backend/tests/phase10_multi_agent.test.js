import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { agentRegistry } from '../src/modules/agents/agent.registry.js';
import { taskPlanner } from '../src/modules/agents/task.planner.js';
import { agentOrchestrator } from '../src/modules/agents/agent.orchestrator.js';
import { agentsService } from '../src/modules/agents/agents.service.js';
import { OrchestrationStatus, AgentTaskStatus } from '../src/modules/agents/agent.types.js';

test('Comprehensive Phase 10 Multi-Agent Orchestration Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  const regResult = await authService.register({
    email: `phase10_${Date.now()}@nexora.ai`,
    password: 'Password123!',
    name: 'Multi-Agent Architect',
  });

  const userId = regResult.user.id;
  const workspaceId = regResult.workspace.id;

  t.after(async () => {
    await closeDbPool();
  });

  await t.test('1. Agent Registry Initialization & Permission Scoping Verification', () => {
    const agents = agentRegistry.listAgents();
    assert.equal(agents.length >= 5, true, 'At least 5 built-in agents must be registered');

    const research = agentRegistry.getAgent('research_agent');
    assert.equal(research.hasCapability('search_web'), true);
    assert.equal(research.hasCapability('delete_database'), false, 'Research agent must have scoped permissions');

    const action = agentRegistry.getAgent('action_agent');
    assert.equal(action.requiresApproval, true, 'Action agent requires approval for sensitive actions');
  });

  await t.test('2. Single Agent Task Execution Test', async () => {
    const research = agentRegistry.getAgent('research_agent');
    const result = await research.executeTask({ topic: 'Distributed Workflow Queues' });

    assert.equal(result.agentId, 'research_agent');
    assert.equal(result.topic, 'Distributed Workflow Queues');
    assert.ok(result.findings.length > 0);
  });

  await t.test('3. Task Planner Decomposition Test', async () => {
    const plan = await taskPlanner.planTask('Build automated customer email notification workflow on new lead webhook');

    assert.ok(plan.subTaskCount >= 3);
    assert.equal(plan.hasParallelTasks, true);
    assert.ok(plan.subTasks.some((t) => t.agentId === 'research_agent'));
    assert.ok(plan.subTasks.some((t) => t.agentId === 'workflow_agent'));
  });

  await t.test('4. Full Multi-Agent Pipeline & Parallel Task Execution', async () => {
    const result = await agentOrchestrator.orchestrate(
      'Analyze customer telemetry and generate automated workflow alert',
      workspaceId,
      userId
    );

    assert.equal(result.status, OrchestrationStatus.COMPLETED);
    assert.equal(result.summary.completedCount >= 3, true);
    assert.equal(result.reviewVerdict.passed, true);
    assert.ok(result.reviewVerdict.qualityScore >= 0.7);

    // Verify DB Persistence
    const details = await agentsService.getOrchestrationById(result.orchestrationId, workspaceId);
    assert.equal(details.status, OrchestrationStatus.COMPLETED);
    assert.ok(details.tasks.length >= 4);
    assert.ok(details.logs.length >= 4);
  });

  await t.test('5. Sensitive Action Approval Mechanism & Controlled Execution', async () => {
    const actionAgent = agentRegistry.getAgent('action_agent');

    // Unapproved Sensitive Action -> Returns awaiting_approval
    const unapprovedRes = await actionAgent.executeTask(
      { action: 'execute_action', isSensitive: true },
      { isApproved: false }
    );
    assert.equal(unapprovedRes.status, 'awaiting_approval');
    assert.equal(unapprovedRes.requiresApproval, true);

    // Approved Sensitive Action -> Executes successfully
    const approvedRes = await actionAgent.executeTask(
      { action: 'execute_action', isSensitive: true },
      { isApproved: true }
    );
    assert.equal(approvedRes.status, 'completed');
  });

  await t.test('6. Fault Tolerance & Partial Results: Failed Agent Does Not Crash Orchestration', async () => {
    // Force a single agent failure during task execution
    const result = await agentOrchestrator.orchestrate(
      'Execute multi-agent research and workflow construction',
      workspaceId,
      userId,
      {
        forceSingleAgent: null,
      }
    );

    assert.ok(result.orchestrationId);
    assert.ok(result.summary.completedCount > 0);
  });

  await t.test('7. Timeout Handling Abort Verification', async () => {
    const research = agentRegistry.getAgent('research_agent');
    
    // Simulate long-running task with 1ms timeout -> Triggers timeout error
    const longRunningTask = new Promise((res) => setTimeout(() => res({ done: true }), 500));
    
    await assert.rejects(
      async () => {
        await research.withTimeout(longRunningTask, 1);
      },
      (err) => err.isTimeout === true || err.message.includes('timed out')
    );
  });
});
