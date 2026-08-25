import { initDatabase } from './config/db.config.js';
import { initRedis } from './config/redis.config.js';
import { startWorkflowWorker, stopWorkflowWorker } from './modules/workers/workflow.worker.js';
import { logger } from './utils/logger.js';

const startWorkerProcess = async () => {
  logger.info('Starting Standalone NEXORA AI Worker Process...');

  await initDatabase();
  await initRedis();

  const worker = startWorkflowWorker();
  if (!worker) {
    logger.error('Failed to initialize worker process. Exiting.');
    process.exit(1);
  }

  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down worker process...`);
    await stopWorkflowWorker();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startWorkerProcess();
