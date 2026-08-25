import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase, getDbPool, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { workflowsService } from '../src/modules/workflows/workflows.service.js';
import { queueService } from '../src/modules/queue/queue.service.js';
import { startWorkflowWorker } from '../src/modules/workers/workflow.worker.js';

test('Comprehensive Phase 14 Dockerization & Container Architecture Test Suite', async (t) => {
  const rootDir = path.resolve('../');

  await t.test('1. Verify Docker Artifact Files Integrity', () => {
    assert.equal(fs.existsSync(path.join(rootDir, 'backend/Dockerfile')), true, 'backend/Dockerfile must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'frontend/Dockerfile')), true, 'frontend/Dockerfile must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'frontend/nginx.conf')), true, 'frontend/nginx.conf must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docker-compose.yml')), true, 'docker-compose.yml must exist');
    assert.equal(fs.existsSync(path.join(rootDir, 'docs/docker_guide.md')), true, 'docs/docker_guide.md must exist');
  });

  await t.test('2. Verify docker-compose.yml Service Definitions & Networks', () => {
    const composeContent = fs.readFileSync(path.join(rootDir, 'docker-compose.yml'), 'utf-8');

    assert.ok(composeContent.includes('nexora-mysql'), 'MySQL container defined');
    assert.ok(composeContent.includes('nexora-redis'), 'Redis container defined');
    assert.ok(composeContent.includes('nexora-backend'), 'Backend container defined');
    assert.ok(composeContent.includes('nexora-worker'), 'Worker container defined');
    assert.ok(composeContent.includes('nexora-frontend'), 'Frontend container defined');
    assert.ok(composeContent.includes('nexora-network'), 'Service networking defined');
    assert.ok(composeContent.includes('mysql_data:'), 'Persistent DB volume defined');
    assert.ok(composeContent.includes('redis_data:'), 'Persistent Redis volume defined');
  });

  await t.test('3. Test End-to-End Real Workflow Execution in Containerized System Lifecycle', async () => {
    const dbConnected = await initDatabase();
    assert.equal(dbConnected, true, 'Database connection verified');

    await queueService.initializeQueues();
    const workerInstance = startWorkflowWorker();

    t.after(async () => {
      if (workerInstance) await workerInstance.close();
      await closeDbPool();
    });

    // Register User & Create Real Workflow
    const userReg = await authService.register({
      email: `docker_user_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Docker Test User',
    });

    const wf = await workflowsService.createWorkflow(userReg.workspace.id, userReg.user.id, {
      name: 'Real End-to-End Docker Production Workflow',
      definition: {
        nodes: [
          { id: 'start', type: 'trigger', subtype: 'manual', label: 'Manual Trigger' },
          { id: 'notify', type: 'action', subtype: 'create_notification', label: 'Docker Alert' },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'notify' }],
      },
    });

    await workflowsService.publishWorkflow(wf.id, userReg.workspace.id, userReg.user.id);

    // Enqueue & Process via Queue Worker
    const enqueueRes = await queueService.enqueueWorkflowExecution({
      workflowId: wf.id,
      workspaceId: userReg.workspace.id,
      triggerType: 'manual',
      inputPayload: { environment: 'docker' },
      userId: userReg.user.id,
    });

    assert.ok(enqueueRes.executionId);

    // Wait for Worker execution completion
    const pool = getDbPool();
    let completed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((res) => setTimeout(res, 150));
      const [rows] = await pool.query('SELECT status FROM executions WHERE id = ?', [enqueueRes.executionId]);
      if (rows[0] && rows[0].status === 'completed') {
        completed = true;
        break;
      }
    }

    assert.equal(completed, true, 'Containerized real workflow execution must complete successfully');
  });
});
