import { Worker } from 'bullmq';
import { EventEmitter } from 'events';
import { getRedisClient, isMockRedis } from '../../config/redis.config.js';
import { inMemoryQueues } from '../../config/queue.config.js';
import { workflowExecutor } from '../engine/workflow.executor.js';
import { executionsRepository } from '../executions/executions.repository.js';
import { broadcastExecutionLog, broadcastNodeStatus } from '../../socket/socket.server.js';
import { logger } from '../../utils/logger.js';

let workerInstance = null;

class InMemoryWorker extends EventEmitter {
  constructor(queueName, processor) {
    super();
    this.name = queueName;
    this.processor = processor;
    const queue = inMemoryQueues.get(queueName);

    this.listener = async (job) => {
      if (queue) {
        queue.jobCounts.waiting--;
        queue.jobCounts.active++;
      }
      job.state = 'active';

      let maxAttempts = job.opts?.attempts || 1;
      let success = false;

      while (job.attemptsMade < maxAttempts) {
        job.attemptsMade++;
        try {
          const returnval = await this.processor(job);
          job.state = 'completed';
          job.finishedOn = Date.now();
          if (queue) {
            queue.jobCounts.active--;
            queue.jobCounts.completed++;
          }
          this.emit('completed', job, returnval);
          success = true;
          break;
        } catch (err) {
          job.failedReason = err.message;
          this.emit('failed', job, err);
          if (job.attemptsMade < maxAttempts) {
            const delay = job.opts?.backoff?.delay || 50;
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      if (!success) {
        job.state = 'failed';
        job.finishedOn = Date.now();
        if (queue) {
          queue.jobCounts.active--;
          queue.jobCounts.failed++;
        }
      }
    };

    if (queue) {
      queue.on('job-added', this.listener);
    }
  }

  async close() {
    const queue = inMemoryQueues.get(this.name);
    if (queue && this.listener) {
      queue.off('job-added', this.listener);
    }
  }
}

export const startWorkflowWorker = () => {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis client unavailable. Workflow Worker process cannot start.');
    return null;
  }

  if (workerInstance) {
    logger.info('Workflow Worker process already active');
    return workerInstance;
  }

  const processor = async (job) => {
    const { executionId, workflowId, workspaceId, triggerType, inputPayload, userId } = job.data;
    logger.info(`[Worker] Processing Job [ID: ${job.id}, Attempt: ${job.attemptsMade}] for Execution [${executionId}]`);

    // Execute Workflow DAG
    const result = await workflowExecutor.executeWorkflow({
      executionId,
      workflowId,
      workspaceId,
      triggerType,
      inputPayload,
      userId,
    });


    if (!result.success) {
      throw new Error(result.error || 'Workflow execution failed');
    }

    return result.execution;
  };

  if (isMockRedis()) {
    logger.info('🚀 In-Memory Workflow Worker started [Queue: workflow-execution]');
    workerInstance = new InMemoryWorker('workflow-execution', processor);
  } else {
    logger.info('🚀 BullMQ Independent Workflow Worker started [Queue: workflow-execution, Concurrency: 5]');
    workerInstance = new Worker('workflow-execution', processor, {
      connection: redis,
      concurrency: 5,
    });
  }

  workerInstance.on('completed', (job, returnvalue) => {
    logger.info(`[Worker] Job [ID: ${job.id}] completed successfully`);
  });

  workerInstance.on('failed', async (job, err) => {
    if (!job) {
      logger.error(`[Worker] Job failed with error: ${err.message}`);
      return;
    }

    const { executionId } = job.data;
    const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts || 1);

    logger.warn(`[Worker] Job [ID: ${job.id}] failed (Attempt ${job.attemptsMade}/${job.opts?.attempts || 1}): ${err.message}`);

    if (!isFinalAttempt) {
      // Record 'retrying' status in DB
      await executionsRepository.updateExecutionStatus(executionId, {
        status: 'retrying',
        errorMessage: `Attempt ${job.attemptsMade} failed: ${err.message}. Retrying in background...`,
      });

      await executionsRepository.addExecutionLog({
        executionId,
        stepId: 'queue_worker_retry',
        nodeName: 'BullMQ Worker Retry',
        status: 'failed',
        error: { message: err.message, attempt: job.attemptsMade, isFinalAttempt: false },
        logLevel: 'warn',
      });

      broadcastExecutionLog(executionId, {
        executionId,
        stepId: 'queue_worker_retry',
        nodeName: 'BullMQ Worker Retry',
        status: 'retrying',
        error: `Attempt ${job.attemptsMade} failed: ${err.message}`,
        timestamp: new Date().toISOString(),
      });

    } else {
      // Final exhausted retry -> set status to 'failed'
      await executionsRepository.updateExecutionStatus(executionId, {
        status: 'failed',
        errorMessage: `Exhausted retries (${job.attemptsMade}/${job.opts?.attempts || 1}): ${err.message}`,
      });

      await executionsRepository.addExecutionLog({
        executionId,
        stepId: 'queue_worker_exhausted',
        nodeName: 'BullMQ Worker Exhausted Retries',
        status: 'failed',
        error: { message: err.message, attempt: job.attemptsMade, isFinalAttempt: true },
        logLevel: 'error',
      });

      broadcastExecutionLog(executionId, {
        executionId,
        stepId: 'queue_worker_exhausted',
        nodeName: 'BullMQ Worker Exhausted Retries',
        status: 'failed',
        error: `Exhausted retries: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  workerInstance.on('error', (err) => {
    logger.error('[Worker] Redis/BullMQ worker connection error:', { message: err.message });
  });

  return workerInstance;
};

export const stopWorkflowWorker = async () => {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    logger.info('Workflow Worker process stopped cleanly');
  }
};

