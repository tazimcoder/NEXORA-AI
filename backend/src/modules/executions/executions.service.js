import crypto from 'crypto';
import { executionsRepository } from './executions.repository.js';
import { workflowsRepository } from '../workflows/workflows.repository.js';
import { queueService } from '../queue/queue.service.js';
import { workflowExecutor } from '../engine/workflow.executor.js';
import { ApiError } from '../../utils/apiError.js';

export class ExecutionsService {
  async executeWorkflow(workflowId, workspaceId, userId, payload = {}) {
    // Dispatch job to BullMQ queue for async worker processing
    const queuedJob = await queueService.addWorkflowExecutionJob({
      workflowId,
      workspaceId,
      triggerType: 'manual',
      inputPayload: payload,
      userId,
    });

    // Inline execution fallback if queue is not active
    if (queuedJob.status === 'queued' && !queuedJob.jobId) {
      return await workflowExecutor.executeWorkflow({
        workflowId,
        workspaceId,
        triggerType: 'manual',
        inputPayload: payload,
        userId,
      });
    }

    return queuedJob;
  }

  async executeWebhookTrigger(workflowId, workspaceId, triggerPayload = {}) {
    // 1. Validate Workflow Existence & Workspace Ownership
    const workflow = await workflowsRepository.findById(workflowId, workspaceId);
    if (!workflow) {
      throw ApiError.notFound(`Workflow blueprint '${workflowId}' not found in workspace '${workspaceId}'`);
    }

    if (workflow.status !== 'published' && !workflow.is_active) {
      throw ApiError.badRequest('Workflow must be published and active to accept incoming webhooks');
    }

    // 2. Optional HMAC Signature Validation
    const nodes = workflow.definition_json?.nodes || [];
    const webhookNode = nodes.find((n) => n.type === 'trigger' && n.subtype === 'webhook');

    if (webhookNode?.config?.secret) {
      const secret = webhookNode.config.secret;
      const signature = triggerPayload.headers?.['x-signature'] || triggerPayload.headers?.['x-hub-signature-256'];
      if (secret && signature) {
        const payloadStr = typeof triggerPayload.body === 'string' ? triggerPayload.body : JSON.stringify(triggerPayload.body || {});
        const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
        if (signature !== expectedSig && signature !== `sha256=${expectedSig}`) {
          throw ApiError.unauthorized('Invalid webhook HMAC signature');
        }
      }
    }

    // 3. Dispatch webhook trigger job to BullMQ queue
    return await queueService.addWorkflowExecutionJob({
      workflowId,
      workspaceId,
      triggerType: 'webhook',
      inputPayload: triggerPayload,
    });
  }


  async getWorkspaceExecutions(workspaceId) {
    return await executionsRepository.findExecutionsByWorkspace(workspaceId);
  }

  async getExecutionById(executionId, workspaceId) {
    const execution = await executionsRepository.findExecutionById(executionId);
    if (!execution) {
      throw ApiError.notFound('Execution run not found');
    }
    if (execution.workspace_id !== workspaceId) {
      throw ApiError.forbidden('Access denied to execution run in another workspace');
    }
    const logs = await executionsRepository.findExecutionLogs(executionId);
    return { ...execution, logs };
  }
}

export const executionsService = new ExecutionsService();
