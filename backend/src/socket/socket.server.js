import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

let io = null;

export const initSocketServer = (httpServer) => {
  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      path: '/socket.io',
    });

    io.on('connection', (socket) => {
      logger.info(`WebSocket Client Connected: [${socket.id}]`);

      // Join execution telemetry room
      socket.on('join_execution', (executionId) => {
        socket.join(`execution:${executionId}`);
        logger.info(`Socket [${socket.id}] joined room [execution:${executionId}]`);
      });

      // Leave execution telemetry room
      socket.on('leave_execution', (executionId) => {
        socket.leave(`execution:${executionId}`);
        logger.info(`Socket [${socket.id}] left room [execution:${executionId}]`);
      });

      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket Client Disconnected: [${socket.id}] (${reason})`);
      });
    });

    logger.info('Socket.IO WebSocket Server mounted successfully');
    return io;
  } catch (error) {
    logger.error('Failed to initialize Socket.IO server:', { message: error.message });
    return null;
  }
};

export const broadcastExecutionLog = (executionId, logPayload) => {
  if (io) {
    io.to(`execution:${executionId}`).emit('execution_log_stream', logPayload);
  }
};

export const broadcastNodeStatus = (executionId, statusPayload) => {
  if (io) {
    io.to(`execution:${executionId}`).emit('node_status_change', statusPayload);
  }
};

export const getIO = () => io;
