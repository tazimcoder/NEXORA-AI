import { io } from 'socket.io-client';

let socket = null;

export const initSocketClient = () => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
    path: '/socket.io',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Client connected to WebSocket server:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Client disconnected:', reason);
  });

  return socket;
};

export const subscribeToExecutionLogs = (executionId, callback) => {
  const client = initSocketClient();
  client.emit('join_execution', executionId);

  const handler = (data) => callback(data);
  client.on('execution_log_stream', handler);

  return () => {
    client.emit('leave_execution', executionId);
    client.off('execution_log_stream', handler);
  };
};

export const getSocket = () => socket;
