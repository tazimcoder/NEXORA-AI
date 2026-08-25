import { Queue } from 'bullmq';
import { EventEmitter } from 'events';
import { getRedisClient, isMockRedis } from './redis.config.js';
import { logger } from '../utils/logger.js';

export const inMemoryQueues = new Map();

class InMemoryQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.jobs = new Map();
    this.jobCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }

  async add(name, data, opts = {}) {
    const id = opts.jobId || data.executionId || `mock_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job = {
      id,
      name,
      data,
      opts,
      attemptsMade: 0,
      timestamp: Date.now(),
      finishedOn: null,
      failedReason: null,
      state: 'waiting',
      getState: async function () {
        return this.state;
      },
    };

    this.jobs.set(id, job);
    this.jobCounts.waiting++;

    setImmediate(() => this.emit('job-added', job));

    return job;
  }

  async getJobCounts() {
    return { ...this.jobCounts };
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async close() {
    this.jobs.clear();
  }
}

let workflowExecutionQueue = null;
let scheduledTriggerQueue = null;

export const initQueues = () => {
  try {
    const redis = getRedisClient();
    if (!redis) {
      logger.warn('Redis client not available. Queue initialization postponed.');
      return null;
    }

    if (isMockRedis()) {
      logger.info('Initializing In-Memory Queue Fallback Engine (Native Redis offline)...');
      workflowExecutionQueue = new InMemoryQueue('workflow-execution');
      scheduledTriggerQueue = new InMemoryQueue('scheduled-triggers');
      inMemoryQueues.set('workflow-execution', workflowExecutionQueue);
      inMemoryQueues.set('scheduled-triggers', scheduledTriggerQueue);
    } else {
      const connectionOptions = { connection: redis };
      workflowExecutionQueue = new Queue('workflow-execution', connectionOptions);
      scheduledTriggerQueue = new Queue('scheduled-triggers', connectionOptions);
    }

    logger.info('Queue instances initialized: [workflow-execution], [scheduled-triggers]');

    return {
      workflowExecutionQueue,
      scheduledTriggerQueue,
    };
  } catch (error) {
    logger.warn('BullMQ initialization notice:', { message: error.message });
    return null;
  }
};

export const getWorkflowQueue = () => workflowExecutionQueue;
export const getScheduledTriggerQueue = () => scheduledTriggerQueue;

