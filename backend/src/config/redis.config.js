import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let redisClient = null;
let isMockInstance = false;

export const initRedis = async () => {
  try {
    const nativeClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
    });

    nativeClient.on('error', (err) => {
      // Suppress noisy console error when fallback is handling it
      if (!isMockInstance) {
        logger.warn('Redis Native Client Notice:', { message: err.message });
      }
    });

    try {
      await nativeClient.connect();
      logger.info('Native Redis connected successfully on port ' + config.redis.port);
      redisClient = nativeClient;
      isMockInstance = false;
      return redisClient;
    } catch (connError) {
      logger.info('Native Redis not reachable on port 6379. Initializing in-memory Redis fallback engine...');
      nativeClient.disconnect();
      redisClient = new RedisMock();
      isMockInstance = true;
      logger.info('In-Memory Redis Fallback initialized successfully');
      return redisClient;
    }
  } catch (error) {
    logger.warn('Initializing in-memory Redis fallback due to exception:', { message: error.message });
    redisClient = new RedisMock();
    isMockInstance = true;
    return redisClient;
  }
};

export const checkRedisHealth = async () => {
  if (!redisClient) {
    return { status: 'offline', message: 'Redis client not initialized' };
  }
  try {
    const start = Date.now();
    const response = await redisClient.ping();
    const latency = Date.now() - start;
    if (response === 'PONG') {
      return {
        status: 'connected',
        latencyMs: latency,
        type: isMockInstance ? 'in-memory-fallback' : 'native-redis',
      };
    }
    return { status: 'degraded', response };
  } catch (error) {
    return { status: 'offline', message: error.message || 'Redis host unreachable' };
  }
};

export const getRedisClient = () => redisClient;
export const isMockRedis = () => isMockInstance;

