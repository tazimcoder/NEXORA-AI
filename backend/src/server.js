import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { initDatabase } from './config/db.config.js';
import { initRedis } from './config/redis.config.js';
import { initQueues } from './config/queue.config.js';
import { initSocketServer } from './socket/socket.server.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  logger.info(`Starting ${config.appName}...`);

  // Initialize MySQL Connection Pool & apply migrations
  const dbConnected = await initDatabase();
  if (!dbConnected) {
    logger.warn('MySQL initialization completed with warnings.');
  }

  // Initialize Redis Connection & BullMQ Queues
  await initRedis();
  initQueues();

  // Create HTTP & Socket.IO WebSockets Server
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(config.port, () => {
    logger.info(`🚀 Server running in [${config.env}] mode on http://localhost:${config.port}`);
    logger.info(`Healthcheck URL: http://localhost:${config.port}/api/v1/health`);
    logger.info(`WebSocket URL: ws://localhost:${config.port}/socket.io`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP & WebSocket server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
