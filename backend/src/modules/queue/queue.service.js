import { initQueues, getWorkflowQueue, getScheduledTriggerQueue } from '../../config/queue.config.js';
import { initRedis } from '../../config/redis.config.js';
import { executionsRepository } from '../executions/executions.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class QueueService {
  async initializeQueues() {
    await initRedis();
    return initQueues();
  }

  async enqueueWorkflowExecution(params) {
    return this.addWorkflowExecutionJob(params);
  }

  /**
   * Dispatches a workflow execution job to the BullMQ queue with retry & backoff policies.
   */
  async addWorkflowExecutionJob({ workflowId, workspaceId, triggerType = 'manual', inputPayload = {}, userId = null, maxRetries = 3, backoffDelay = 1000 }) {

    const queue = getWorkflowQueue();

    // Initialize Execution Record in DB with 'pending' state
    const execution = await executionsRepository.createExecution({
      workflowId,
      workspaceId,
      triggerType,
      status: 'pending',
    });

    const jobData = {
      executionId: execution.id,
      workflowId,
      workspaceId,
      triggerType,
      inputPayload,
      userId,
    };

    const jobOptions = {
      attempts: maxRetries + 1, // 1 initial attempt + maxRetries retries
      backoff: {
        type: 'exponential',
        delay: backoffDelay,
      },
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 604800, count: 5000 },
    };

    let jobId = execution.id;

    if (queue) {
      const job = await queue.add('process-workflow', jobData, jobOptions);
      jobId = job.id;
      logger.info(`Workflow Execution Job queued in BullMQ [Job ID: ${jobId}, Execution ID: ${execution.id}]`);
    } else {
      logger.warn(`BullMQ Queue not available. Execution [${execution.id}] registered as pending in DB.`);
    }

    return {
      jobId,
      executionId: execution.id,
      queueName: 'workflow-execution',
      status: 'queued',
      maxRetries,
      backoffDelay,
    };
  }

  async getQueueMetrics() {
    const queue = getWorkflowQueue();
    if (!queue) {
      return {
        status: 'disabled',
        message: 'Redis / BullMQ Queue instance not connected',
        counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      };
    }

    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    return {
      status: 'active',
      queueName: 'workflow-execution',
      counts,
    };
  }

  async getJobStatus(jobId) {
    const queue = getWorkflowQueue();
    if (!queue) {
      throw ApiError.internal('BullMQ Queue is not active');
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw ApiError.notFound(`Job '${jobId}' not found in queue`);
    }

    const state = await job.getState();
    return {
      id: job.id,
      state,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
    };
  }
}

export const queueService = new QueueService();
